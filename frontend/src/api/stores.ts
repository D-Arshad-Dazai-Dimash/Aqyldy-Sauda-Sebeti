import { api } from './client';
import type { Store, InventoryItem, Page } from '../types/api';
import { normalizeInventoryList as _normalizeInventoryItems, normalizePage } from './normalizers';

export type StoreProductsSort = 'titleAsc' | 'priceAsc' | 'priceDesc';

export interface StoreProductsPagedParams {
  page?: number;
  size?: number;
  query?: string;
  inStockOnly?: boolean;
  sort?: StoreProductsSort;
}

// Обертка для совместимости с типом InventoryItem
function normalizeInventoryList(payload: unknown): InventoryItem[] {
  const items = _normalizeInventoryItems(Array.isArray(payload) ? payload : []);
  return items.map((item) => ({
    productId: item.productId,
    productTitle: item.productTitle,
    price: item.price,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
  }));
}

function applyLocalSort(items: InventoryItem[], sort: StoreProductsSort): InventoryItem[] {
  const copy = [...items];
  if (sort === 'priceAsc') return copy.sort((a, b) => a.price - b.price);
  if (sort === 'priceDesc') return copy.sort((a, b) => b.price - a.price);
  return copy.sort((a, b) => (a.productTitle || '').localeCompare(b.productTitle || ''));
}

export async function getStores(): Promise<Store[]> {
  const res = await api.get<Store[]>('/api/stores');
  return res.data;
}

export async function getNearbyStores(
  lat: number,
  lng: number,
  radiusMeters: number = 5000
): Promise<Store[]> {
  const res = await api.get<Store[]>('/api/stores/nearby', {
    params: { lat, lng, radiusMeters },
  });
  return res.data;
}

export async function getStore(id: string): Promise<Store> {
  const res = await api.get<Store>(`/api/stores/${id}`);
  return res.data;
}

export async function getStoreInventory(storeId: string): Promise<InventoryItem[]> {
  const res = await api.get(`/api/stores/${storeId}/inventory`);
  return normalizeInventoryList(res.data);
}

export async function getStoreProducts(storeId: string): Promise<InventoryItem[]> {
  const res = await api.get(`/api/stores/${storeId}/products`);
  return normalizeInventoryList(res.data);
}

export async function getStoreProductsPaged(
  storeId: string,
  params: StoreProductsPagedParams = {}
): Promise<Page<InventoryItem>> {
  const page = params.page ?? 0;
  const size = params.size ?? 24;
  const query = params.query?.trim() ?? '';
  const inStockOnly = Boolean(params.inStockOnly);
  const sort = params.sort ?? 'titleAsc';

  try {
    const res = await api.get(`/api/stores/${storeId}/products/page`, {
      params: {
        page,
        size,
        q: query || undefined,
        inStock: inStockOnly || undefined,
        sort,
      },
    });
    const data = res.data as any;

    if (data && typeof data === 'object' && Array.isArray(data.content)) {
      return {
        content: normalizeInventoryList(data.content),
        totalElements: Number(data.totalElements ?? 0),
        totalPages: Number(data.totalPages ?? 1),
        number: Number(data.number ?? page),
        size: Number(data.size ?? size),
        first: Boolean(data.first ?? page === 0),
        last: Boolean(data.last ?? false),
      };
    }

    throw new Error('Unexpected pagination response format');
  } catch (err: any) {
    const status = err?.response?.status;
    if (status !== 404 && status !== undefined) {
      throw err;
    }

    // Backward compatibility for older backend versions.
    const raw = await getStoreProducts(storeId);
    if (!Array.isArray(raw)) {
      throw new Error('Unexpected response format');
    }
    let filtered = raw;

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter((item) => (item.productTitle || '').toLowerCase().includes(q));
    }
    if (inStockOnly) {
      filtered = filtered.filter((item) => item.quantity > 0);
    }

    const sorted = applyLocalSort(filtered, sort);
    const totalElements = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const safePage = Math.min(Math.max(page, 0), totalPages - 1);
    const start = safePage * size;
    const content = sorted.slice(start, start + size);

    return {
      content,
      totalElements,
      totalPages,
      number: safePage,
      size,
      first: safePage === 0,
      last: safePage >= totalPages - 1,
    };
  }
}
