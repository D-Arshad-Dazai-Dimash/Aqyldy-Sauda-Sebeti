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
