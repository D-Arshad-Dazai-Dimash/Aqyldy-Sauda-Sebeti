import { api } from './client';
import type { Cart } from '../types/api';

export async function getCart(storeId: string): Promise<Cart> {
  const res = await api.get<Cart>('/api/cart', { params: { storeId } });
  return res.data;
}

export async function addToCart(storeId: string, productId: string, quantity: number = 1): Promise<Cart> {
  const res = await api.post<Cart>('/api/cart/items', { productId, quantity }, { params: { storeId } });
  return res.data;
}

export async function updateCartItem(storeId: string, itemId: string, quantity: number): Promise<Cart> {
  const res = await api.put<Cart>(`/api/cart/items/${itemId}`, { quantity }, { params: { storeId } });
  return res.data;
}

export async function removeCartItem(storeId: string, itemId: string): Promise<Cart> {
  const res = await api.delete<Cart>(`/api/cart/items/${itemId}`, { params: { storeId } });
  return res.data;
}

export async function clearCart(storeId: string): Promise<Cart> {
  const res = await api.delete<Cart>('/api/cart', { params: { storeId } });
  return res.data;
}
