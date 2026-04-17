import { api } from './client';
import type { Product, Page } from '../types/api';

export interface ProductSearchParams {
  q?: string;
  categoryId?: string;
  active?: boolean;
  page?: number;
  size?: number;
}

export async function searchProducts(params: ProductSearchParams = {}): Promise<Page<Product>> {
  const res = await api.get<Page<Product>>('/api/products', { params });
  return res.data;
}

export async function getProduct(id: string): Promise<Product> {
  const res = await api.get<Product>(`/api/products/${id}`);
  return res.data;
}

export async function getProductByBarcode(barcode: string): Promise<Product> {
  const res = await api.get<Product>(`/api/products/barcode/${barcode}`);
  return res.data;
}

export async function getProductsBatch(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const res = await api.post<Product[]>('/api/products/batch', { ids });
  return res.data;
}
