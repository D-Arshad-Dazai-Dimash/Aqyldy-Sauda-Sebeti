import { api } from './client';
import type { SpendingAnalytics } from '../types/api';

export async function getSpendingAnalytics(): Promise<SpendingAnalytics> {
  const res = await api.get<SpendingAnalytics>('/api/analytics/spending');
  return res.data;
}
