import { api } from './client';
import type { PriceInsight } from '../types/api';

export async function getPriceInsight(productId: string): Promise<PriceInsight> {
  const res = await api.get<PriceInsight>(`/api/price-insights/${productId}`);
  return res.data;
}
