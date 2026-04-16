import { api } from './client';
import type { Store, InventoryItem, Page } from '../types/api';

export type StoreProductsSort = 'titleAsc' | 'priceAsc' | 'priceDesc';

export interface StoreProductsPagedParams {
  page?: number;
  size?: number;
  query?: string;
  inStockOnly?: boolean;
  sort?: StoreProductsSort;
}

type UnknownRecord = Record<string, any>;

function toInventoryItem(item: UnknownRecord, index: number): InventoryItem {
  const fallbackId = `idx-${index}`;
  return {
    productId: String(item.productId ?? item.id ?? fallbackId),
    productTitle: String(item.productTitle ?? item.title ?? item.name ?? 'Тауар'),
    price: Number(item.price ?? 0),
    imageUrl: item.imageUrl ?? null,
    quantity: Number(item.quantity ?? item.stock ?? 0),
  };
}

function normalizeInventoryList(payload: unknown): InventoryItem[] {
  if (Array.isArray(payload)) {
    return payload.map((entry, idx) => toInventoryItem((entry ?? {}) as UnknownRecord, idx));
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as UnknownRecord).content)) {
    const content = (payload as UnknownRecord).content as unknown[];
    return content.map((entry, idx) => toInventoryItem((entry ?? {}) as UnknownRecord, idx));
  }
  return [];
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
    const res = await api.get(`/api/stores/${storeId}/products`, {
      params: {
        page,
        size,
        q: query || undefined,
        inStock: inStockOnly || undefined,
        sort,
      },
    });
    const data = res.data as any;
    const content = normalizeInventoryList(data);

    const hasPageMeta = data && typeof data === 'object' && Array.isArray(data.content);
    if (hasPageMeta) {
      return {
        content,
        totalElements: Number(data.totalElements ?? content.length),
        totalPages: Number(data.totalPages ?? Math.max(1, Math.ceil(content.length / size))),
        number: Number(data.number ?? page),
        size: Number(data.size ?? size),
        first: Boolean(data.first ?? page === 0),
        last: Boolean(data.last ?? page + 1 >= Number(data.totalPages ?? 1)),
      };
    }

    // Some backends ignore pagination params and still return plain array.
    const totalElements = content.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const safePage = Math.min(Math.max(page, 0), totalPages - 1);
    const start = safePage * size;
    const paged = applyLocalSort(content, sort).slice(start, start + size);

    return {
      content: paged,
      totalElements,
      totalPages,
      number: safePage,
      size,
      first: safePage === 0,
      last: safePage >= totalPages - 1,
    };
  } catch {
    // Fallback for backends that still return full list without pagination params.
    let raw = await getStoreProducts(storeId);
    if (raw.length === 0) {
      raw = await getStoreInventory(storeId);
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
