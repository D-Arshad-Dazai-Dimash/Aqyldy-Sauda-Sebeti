// ===== PRODUCT =====
export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  barcode: string | null;
  stock: number;
  discount: number | null;
  imageUrl: string | null;
  active: boolean;
  categoryIds: string[];
}

// ===== CATEGORY =====
export interface Category {
  id: string;
  name: string;
  slug: string;
}

// ===== STORE =====
export interface Store {
  id: string;
  name: string;
  address: string;
}

// ===== INVENTORY =====
export interface InventoryItem {
  productId: string;
  productTitle: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

// ===== CART =====
export interface CartItem {
  id: string;
  productId: string;
  productTitle: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  id: string | null;
  items: CartItem[];
  total: number;
}

// ===== SCAN =====
export interface ScanResult {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  barcode: string;
  quantity: number;
  available: boolean;
  storeId: string;
  storeName: string;
}

// ===== ORDER =====
export interface OrderResponse {
  id: string;
  storeId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

// ===== PAGINATED =====
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
