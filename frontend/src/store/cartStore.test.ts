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
});