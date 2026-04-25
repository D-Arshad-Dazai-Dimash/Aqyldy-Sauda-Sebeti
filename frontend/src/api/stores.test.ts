import { getNearbyStores, getStoreProductsPaged } from './stores';
import { api } from './client';

jest.mock('./client', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('stores api fallback behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rethrows non-404 error from paged endpoint', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce({ response: { status: 500 } });

    await expect(getStoreProductsPaged('store-1')).rejects.toEqual(
      expect.objectContaining({ response: { status: 500 } }),
    );

    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('uses non-paged fallback for 404 and supports empty array as valid response', async () => {
    (api.get as jest.Mock)
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({ data: [] });

    const page = await getStoreProductsPaged('store-1', { page: 0, size: 24 });

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/stores/store-1/products/page', {
      params: {
        page: 0,
        size: 24,
        q: undefined,
        inStock: undefined,
        sort: 'titleAsc',
      },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/stores/store-1/products');
    expect(page.content).toEqual([]);
    expect(page.totalElements).toBe(0);
    expect(page.totalPages).toBe(1);
  });

  it('calls nearby endpoint with lat/lng/radius query params', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: [{ id: 's1', name: 'A', address: 'B' }] });

    const result = await getNearbyStores(51.1694, 71.4491, 3000);

    expect(api.get).toHaveBeenCalledWith('/api/stores/nearby', {
      params: { lat: 51.1694, lng: 71.4491, radiusMeters: 3000 },
    });
    expect(result).toHaveLength(1);
  });
});
