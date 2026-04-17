import { api } from './client';
import type { OrderResponse } from '../types/api';

export interface CheckoutRequest {
  storeId: string;
  paymentMethod: 'CARD' | 'CASH';
  cardLast4?: string;
  cardBrand?: string;
  comment?: string;
}

function unwrapData<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

function unwrapList<T>(payload: any): T[] {
  const base = unwrapData<any>(payload);
  if (Array.isArray(base)) return base;
  if (Array.isArray(base?.content)) return base.content;
  if (Array.isArray(base?.items)) return base.items;
  return [];
}

export async function checkout(req: CheckoutRequest): Promise<OrderResponse> {
  const res = await api.post<OrderResponse>('/api/orders/checkout', req);
  return unwrapData<OrderResponse>(res.data);
}

export async function getMyOrders(): Promise<OrderResponse[]> {
  const res = await api.get<OrderResponse[]>('/api/orders/my');
  return unwrapList<OrderResponse>(res.data);
}

export async function getOrderById(orderId: string): Promise<any> {
  const res = await api.get(`/api/orders/${orderId}`);
  return unwrapData<any>(res.data);
}

export async function cancelOrder(orderId: string): Promise<OrderResponse> {
  const res = await api.patch<OrderResponse>(`/api/orders/${orderId}/cancel`);
  return res.data;
}
