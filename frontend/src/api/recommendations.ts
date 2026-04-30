import { api } from './client';
import type { RecommendedProduct } from '../types/api';

export async function getFrequentlyBoughtTogether(
  productId: string,
  limit = 10,
): Promise<RecommendedProduct[]> {
  const res = await api.get<RecommendedProduct[]>(
    `/api/recommendations/together/${productId}`,
    { params: { limit } },
  );
  return res.data;
}

export async function getPersonalRecommendations(
  limit = 10,
): Promise<RecommendedProduct[]> {
  const res = await api.get<RecommendedProduct[]>(
    '/api/recommendations/personal',
    { params: { limit } },
  );
  return res.data;
}

export async function getPopularProducts(
  limit = 10,
  excludeIds?: string[],
): Promise<RecommendedProduct[]> {
  const params: Record<string, any> = { limit };
  if (excludeIds && excludeIds.length > 0) {
    // Spring binds repeated `exclude` params into List<UUID>
    params.exclude = excludeIds;
  }
  const res = await api.get<RecommendedProduct[]>(
    '/api/recommendations/popular',
    {
      params,
      paramsSerializer: {
        indexes: null, // -> exclude=a&exclude=b (no [] suffix)
      },
    },
  );
  return res.data;
}
