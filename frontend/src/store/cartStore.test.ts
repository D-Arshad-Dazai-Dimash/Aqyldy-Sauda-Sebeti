import { useCartStore } from './cartStore';
import * as CartApi from '../api/cart';

jest.mock('../api/cart', () => ({
  addToCart: jest.fn(),
  updateCartItem: jest.fn(),
  removeCartItem: jest.fn(),
  clearCart: jest.fn(),
  getCart: jest.fn(),
}));

describe('cartStore optimistic updates', () => {
  beforeEach(() => {
    useCartStore.setState({
      cart: {
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            productTitle: 'Milk',
            price: 100,
            imageUrl: null,
            quantity: 1,
            lineTotal: 100,
          },
        ],
        total: 100,
      },
      storeId: 'store-1',
      loading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('updates quantity optimistically and keeps server result', async () => {
    (CartApi.updateCartItem as jest.Mock).mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          productTitle: 'Milk',
          price: 100,
          imageUrl: null,
          quantity: 2,
          lineTotal: 200,
        },
      ],
      total: 200,
    });

    const promise = useCartStore.getState().updateItem('store-1', 'item-1', 2);

    expect(useCartStore.getState().cart?.items[0].quantity).toBe(2);
    expect(useCartStore.getState().cart?.total).toBe(200);

    await promise;

    expect(CartApi.updateCartItem).toHaveBeenCalledWith('store-1', 'item-1', 2);
    expect(useCartStore.getState().cart?.items[0].quantity).toBe(2);
  });

  it('rolls back optimistic remove on api failure', async () => {
    (CartApi.removeCartItem as jest.Mock).mockRejectedValue({
      response: { data: { detail: 'remove failed' } },
    });

    await expect(useCartStore.getState().removeItem('store-1', 'item-1')).rejects.toEqual(
      expect.objectContaining({
        response: { data: { detail: 'remove failed' } },
      }),
    );

    expect(useCartStore.getState().cart?.items).toHaveLength(1);
    expect(useCartStore.getState().error).toBe('remove failed');
  });

  it('sets loading=true immediately while addItem request is in flight', async () => {
    let resolveFn: ((value: any) => void) | null = null;
    (CartApi.addToCart as jest.Mock).mockImplementation(
      () => new Promise((resolve) => {
        resolveFn = resolve;
      }),
    );

    const pending = useCartStore.getState().addItem('store-1', 'product-2', 1, {
      productTitle: 'Bread',
      price: 200,
    });

    expect(useCartStore.getState().loading).toBe(true);

    resolveFn?.({
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          productTitle: 'Milk',
          price: 100,
          imageUrl: null,
          quantity: 1,
          lineTotal: 100,
        },
      ],
      total: 100,
    });

    await pending;
    expect(useCartStore.getState().loading).toBe(false);
  });

  it('does not produce NaN total when optimistic price is invalid', async () => {
    (CartApi.addToCart as jest.Mock).mockResolvedValue({
      id: 'cart-1',
      items: [],
      total: 0,
    });

    await useCartStore.getState().addItem('store-1', 'product-3', 1, {
      productTitle: 'Unknown',
      // @ts-expect-error validating runtime behavior for malformed data
      price: 'bad-price',
    });

    expect(Number.isNaN(useCartStore.getState().cart?.total ?? 0)).toBe(false);
  });
});