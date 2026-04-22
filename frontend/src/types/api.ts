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

// ===== USER =====
export interface User {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
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
  storeName?: string;
  status: string;
  paymentMethod?: 'CARD' | 'CASH';
  totalAmount: number;
  items: CartItem[];
  createdAt: string;
  updatedAt?: string;
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

// ===== RECOMMENDATION (AI/ML) =====
export interface RecommendedProduct {
  id: string;
  title: string;
  price: number;
  discount: number | null;
  imageUrl: string | null;
  active: boolean;
  score: number;
}

// ===== SPENDING ANALYTICS (AI/ML) =====
export interface MonthlySpending {
  month: string;
  amount: number;
  orderCount: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface FrequentProduct {
  productId: string;
  title: string;
  imageUrl: string | null;
  purchaseCount: number;
  avgPrice: number;
}

export interface SpendingAnalytics {
  totalSpent: number;
  averageOrderAmount: number;
  orderCount: number;
  monthlyTrend: MonthlySpending[];
  categoryBreakdown: CategorySpending[];
  predictedNextMonthSpending: number;
  frequentProducts: FrequentProduct[];
}

// ===== PRICE INSIGHTS (AI/ML) =====
export interface PricePoint {
  price: number;
  date: string;
}

export interface PriceInsight {
  productId: string;
  currentPrice: number;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  changePercentage: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  goodDeal: boolean;
  history: PricePoint[];
}

// ===== NOTIFICATIONS =====
export interface Notification {
  id: string;
  userId: string;
  type: 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'PRICE_DROP' | 'FAVORITE_BACK_IN_STOCK';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationResponse {
  id: string;
  type: 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'PRICE_DROP' | 'FAVORITE_BACK_IN_STOCK';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}
