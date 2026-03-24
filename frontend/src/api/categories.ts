import { api } from './client';
import type { Category } from '../types/api';

export async function getCategories(): Promise<Category[]> {
  const res = await api.get<Category[]>('/api/categories');
  return res.data;
}
