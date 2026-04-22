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

type StatsResponse = {
  totalRevenue: number;
  ordersCount: number;
  topProducts: Array<{
    productId: string;
    title: string;
    totalQuantity: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    day: string;
    revenue: number;
  }>;
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function resolvePeriodRange(period: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);

  if (period === 'DAY') from.setDate(from.getDate() - 1);
  if (period === 'WEEK') from.setDate(from.getDate() - 7);
  if (period === 'MONTH') from.setMonth(from.getMonth() - 1);
  if (period === 'YEAR') from.setFullYear(from.getFullYear() - 1);

  return { from: toIsoDate(from), to: toIsoDate(to) };
}

async function getPrimaryStoreId(): Promise<string> {
  const storesRes = await api.get('/api/stores/my');
  const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
  const firstStore = stores[0];
  if (!firstStore?.id) {
    throw new Error('Store not found for current merchant');
  }
  return firstStore.id;
}

async function loadOrdersAndInventory(storeId: string) {
  const [ordersRes, inventoryRes] = await Promise.all([
    api.get('/api/admin/orders', { params: { size: 200 } }),
    api.get('/api/admin/inventory', { params: { storeId } }),
  ]);

  const orders = Array.isArray(ordersRes.data?.content) ? ordersRes.data.content : [];
  const inventory = Array.isArray(inventoryRes.data) ? inventoryRes.data : [];

  return { orders, inventory };
}

function countOrderStatuses(orders: Array<{ status?: string }>) {
  const statuses = {
    pending: 0,
    confirmed: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const order of orders) {
    const status = (order.status || '').toUpperCase();
    if (status === 'CREATED' || status === 'PAID') statuses.pending += 1;
    else if (status === 'CONFIRMED' || status === 'PROCESSING' || status === 'SHIPPED') statuses.confirmed += 1;
    else if (status === 'DELIVERED') statuses.delivered += 1;
    else if (status === 'CANCELLED') statuses.cancelled += 1;
  }

  return statuses;
}

/**
 * Получить аналитику для бизнеса (для продавцов)
 */
export async function getBusinessAnalytics(period: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' = 'MONTH'): Promise<BusinessAnalytics> {
  const storeId = await getPrimaryStoreId();
  const range = resolvePeriodRange(period);

  const [statsRes, aux] = await Promise.all([
    api.get<StatsResponse>('/api/admin/stats', {
      params: { storeId, from: range.from, to: range.to },
    }),
    loadOrdersAndInventory(storeId),
  ]);

  const stats = statsRes.data;
  const orderStatuses = countOrderStatuses(aux.orders);
  const totalRevenue = Number(stats.totalRevenue ?? 0);
  const totalOrders = Number(stats.ordersCount ?? 0);

  return {
    period,
    totalRevenue,
    totalOrders,
    totalProducts: aux.inventory.length,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    topProducts: (stats.topProducts || []).map((p) => ({
      id: p.productId,
      name: p.title,
      sales: Number(p.totalQuantity ?? 0),
      revenue: Number(p.revenue ?? 0),
    })),
    revenueByDay: (stats.revenueByDay || []).map((r) => ({
      date: r.day,
      revenue: Number(r.revenue ?? 0),
      orders: 0,
    })),
    orderStatuses,
  };
}

/**
 * Получить детальную аналитику по периодам
 */
export async function getBusinessAnalyticsByDateRange(
  startDate: string,
  endDate: string
): Promise<BusinessAnalytics> {
  const storeId = await getPrimaryStoreId();

  const [statsRes, aux] = await Promise.all([
    api.get<StatsResponse>('/api/admin/stats', {
      params: { storeId, from: startDate, to: endDate },
    }),
    loadOrdersAndInventory(storeId),
  ]);

  const stats = statsRes.data;
  const totalRevenue = Number(stats.totalRevenue ?? 0);
  const totalOrders = Number(stats.ordersCount ?? 0);

  return {
    period: `${startDate}..${endDate}`,
    totalRevenue,
    totalOrders,
    totalProducts: aux.inventory.length,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    topProducts: (stats.topProducts || []).map((p) => ({
      id: p.productId,
      name: p.title,
      sales: Number(p.totalQuantity ?? 0),
      revenue: Number(p.revenue ?? 0),
    })),
    revenueByDay: (stats.revenueByDay || []).map((r) => ({
      date: r.day,
      revenue: Number(r.revenue ?? 0),
      orders: 0,
    })),
    orderStatuses: countOrderStatuses(aux.orders),
  };
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
  const analytics = await getBusinessAnalytics('MONTH');

  const lowStockProducts = analytics.topProducts.filter((p) => p.sales <= 5).length;
  return {
    totalProducts: analytics.totalProducts,
    activeProducts: analytics.totalProducts,
    inactiveProducts: 0,
    lowStockProducts,
    topSellingProducts: analytics.topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sales: p.sales,
    })),
  };
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
  const analytics = await getBusinessAnalytics('MONTH');
  return {
    totalOrders: analytics.totalOrders,
    pendingOrders: analytics.orderStatuses.pending,
    deliveredOrders: analytics.orderStatuses.delivered,
    cancelledOrders: analytics.orderStatuses.cancelled,
    averageOrderValue: analytics.averageOrderValue,
    totalRevenue: analytics.totalRevenue,
  };
}

/**
 * Экспортировать аналитику в CSV
 */
export async function exportAnalytics(format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
  const analytics = await getBusinessAnalytics('MONTH');

  if (format === 'pdf') {
    throw new Error('PDF export is not supported yet');
  }

  const lines = [
    'metric,value',
    `totalRevenue,${analytics.totalRevenue}`,
    `totalOrders,${analytics.totalOrders}`,
    `totalProducts,${analytics.totalProducts}`,
    `averageOrderValue,${analytics.averageOrderValue}`,
  ];

  return new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;', lastModified: Date.now() });
}