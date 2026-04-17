import { api } from './client';
import type { OrderResponse } from '../types/api';

export interface CheckoutRequest {
  storeId: string;
  paymentMethod: 'CARD' | 'CASH';
  cardLast4?: string;
  cardBrand?: string;
  comment?: string;
}

export async function checkout(req: CheckoutRequest): Promise<OrderResponse> {
  const res = await api.post<OrderResponse>('/api/orders/checkout', req);
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
  const res = await api.patch<OrderResponse>(`/api/orders/${orderId}/cancel`);
  return res.data;
}
