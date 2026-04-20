/**
 * Helper функции для нормализации API ответов
 * Решает проблему несоответствий в форматах ответов от backend
 */

export interface NormalizedInventoryItem {
  id: string;
  productId: string;
  productTitle: string;
  price: number;
  imageUrl: string | null;
  barcode: string;
  quantity: number;
  available: boolean;
  storeId: string;
  storeName: string;
}

/**
 * Нормализует inventory item - обрабатывает разные имена полей
 * Backend может возвращать: productId или id, productTitle или title, и т.д.
 */
export function normalizeInventoryItem(item: any): NormalizedInventoryItem {
  return {
    id: item.id || item.itemId || '',
    productId: item.productId || item.id || '',
    productTitle: item.productTitle || item.title || item.name || '',
    price: Number(item.price || item.currentPrice || 0),
    imageUrl: item.imageUrl || item.image || item.productImage || null,
    barcode: item.barcode || item.sku || '',
    quantity: Number(item.quantity || item.stock || item.available || 0),
    available: Boolean(item.available !== false && (item.quantity || item.stock || 0) > 0),
    storeId: item.storeId || item.store_id || '',
    storeName: item.storeName || item.store_name || '',
  };
}

/**
 * Нормализует список inventory items
 */
export function normalizeInventoryList(items: any[]): NormalizedInventoryItem[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeInventoryItem);
}

/**
 * Нормализует Page response - обрабатывает разные форматы
 */
export interface NormalizedPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export function normalizePage<T>(
  response: any,
  normalizer: (item: any) => T,
  defaultSize: number = 20
): NormalizedPage<T> {
  // Если это массив - это plain list
  if (Array.isArray(response)) {
    return {
      content: response.map(normalizer),
      totalElements: response.length,
      totalPages: Math.ceil(response.length / defaultSize),
      number: 0,
      size: defaultSize,
      first: true,
      last: true,
    };
  }

  // Если это объект - это Page<T>
  if (response && typeof response === 'object') {
    const content = Array.isArray(response.content) ? response.content : [];
    return {
      content: content.map(normalizer),
      totalElements: Number(response.totalElements ?? content.length),
      totalPages: Number(response.totalPages ?? 1),
      number: Number(response.number ?? 0),
      size: Number(response.size ?? defaultSize),
      first: Boolean(response.first ?? true),
      last: Boolean(response.last ?? true),
    };
  }

  // Fallback
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: defaultSize,
    first: true,
    last: true,
  };
}
