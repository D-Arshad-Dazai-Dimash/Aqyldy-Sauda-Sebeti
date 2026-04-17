import { useStoreCatalogStore } from './storeCatalogStore';

describe('storeCatalogStore', () => {
  beforeEach(() => {
    useStoreCatalogStore.setState({ snapshots: {} });
    jest.clearAllMocks();
  });

  it('returns stable empty snapshot reference for missing store', () => {
    const first = useStoreCatalogStore.getState().getStateForStore('missing-store');
    const second = useStoreCatalogStore.getState().getStateForStore('missing-store');

    expect(first).toBe(second);
  });

  it('does not bump ttl timestamp when patching only scroll offset', () => {
    const storeId = 'store-1';
    const oldTs = Date.now() - 10000;

    useStoreCatalogStore.setState({
      snapshots: {
        [storeId]: {
          page: 0,
          pageSize: 24,
          query: '',
          inStockOnly: false,
          sort: 'titleAsc',
          totalPages: 1,
          totalElements: 0,
          items: [],
          scrollOffset: 0,
          updatedAt: oldTs,
        },
      },
    });

    useStoreCatalogStore.getState().patchState(storeId, { scrollOffset: 240 });

    expect(useStoreCatalogStore.getState().snapshots[storeId].updatedAt).toBe(oldTs);
  });
});
