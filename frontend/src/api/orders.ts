import { api } from './client';
import type { OrderResponse } from '../types/api';

export async function checkout(storeId: string, comment?: string): Promise<OrderResponse> {
  const res = await api.post<OrderResponse>('/api/orders/checkout', { storeId, comment });
  return res.data;
}

export async function getMyOrders(): Promise<OrderResponse[]> {
  const res = await api.get<OrderResponse[]>('/api/orders/my');
  return res.data;
}

export async function getOrderById(orderId: string): Promise<any> {
  const res = await api.get(`/api/orders/${orderId}`);
  return res.data;
}

export async function cancelOrder(orderId: string): Promise<OrderResponse> {
  const res = await api.delete<OrderResponse>(`/api/orders/${orderId}`);
  return res.data;
}
