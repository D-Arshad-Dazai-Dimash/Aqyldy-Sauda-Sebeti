import { api } from './client';

export interface BusinessAnalytics {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  orderStatuses: {
    pending: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
  };
}

/**
 * Получить аналитику для бизнеса (для продавцов)
 */
export async function getBusinessAnalytics(period: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' = 'MONTH'): Promise<BusinessAnalytics> {
  const response = await api.get<BusinessAnalytics>('/api/admin/analytics', {
    params: { period },
  });
  return response.data;
}

/**
 * Получить детальную аналитику по периодам
 */
export async function getBusinessAnalyticsByDateRange(
  startDate: string,
  endDate: string
): Promise<BusinessAnalytics> {
  const response = await api.get<BusinessAnalytics>('/api/admin/analytics/range', {
    params: { startDate, endDate },
  });
  return response.data;
}

/**
 * Получить статистику товаров
 */
export async function getProductStats(): Promise<{
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
  topSellingProducts: Array<{ id: string; name: string; sales: number }>;
}> {
  const response = await api.get('/api/admin/products/stats');
  return response.data;
}

/**
 * Получить статистику заказов
 */
export async function getOrderStats(): Promise<{
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  totalRevenue: number;
}> {
  const response = await api.get('/api/admin/orders/stats');
  return response.data;
}

/**
 * Экспортировать аналитику в CSV
 */
export async function exportAnalytics(format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
  const response = await api.get(`/api/admin/analytics/export`, {
    params: { format },
    responseType: 'blob',
  });
  return response.data;
}
