import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { CartQtyControl } from '../components/CartQtyControl';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';
import * as CartApi from '../api/cart';

jest.mock('../api/cart', () => ({
  addToCart: jest.fn(),
  updateCartItem: jest.fn(),
  removeCartItem: jest.fn(),
  clearCart: jest.fn(),
  getCart: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const milk = {
  id: 'item-1',
  productId: 'product-1',
  productTitle: 'Milk',
  price: 100,
  imageUrl: null,
  quantity: 2,
  lineTotal: 200,
};

function resetCart(items: any[] = []) {
  useCartStore.setState({
    cart: items.length ? { id: 'c', items, total: items.reduce((s, i) => s + i.lineTotal, 0) } : null,
    storeId: 'store-1',
    loading: false,
    error: null,
  });
  useLocationStore.setState({
    userLocation: null,
    activeStoreId: 'store-1',
    knownStores: [],
    loading: false,
    error: null,
  });
}

describe('CartQtyControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCart([]);
  });

  it('renders + button when product is not in cart', () => {
    const { getByTestId, queryByTestId } = render(
      <CartQtyControl productId="product-1" />,
    );
    expect(getByTestId('cart-add-product-1')).toBeTruthy();
    expect(queryByTestId('cart-qty-product-1')).toBeNull();
  });

  it('renders pill with quantity when product is in cart', () => {
    resetCart([milk]);
    const { getByTestId } = render(<CartQtyControl productId="product-1" />);
    expect(getByTestId('cart-qty-text-product-1').props.children).toBe(2);
  });

  it('renders pick-store fallback when no active store is available', () => {
    useLocationStore.setState({ activeStoreId: null } as any);
    const { getByTestId, queryByTestId } = render(<CartQtyControl productId="product-1" />);
    expect(getByTestId('cart-pickstore-product-1')).toBeTruthy();
    expect(queryByTestId('cart-add-product-1')).toBeNull();
  });

  it('calls addItem when + is pressed (empty state)', async () => {
    (CartApi.addToCart as jest.Mock).mockResolvedValue({
      id: 'c', items: [{ ...milk, quantity: 1, lineTotal: 100 }], total: 100,
    });
    const { getByTestId } = render(<CartQtyControl productId="product-1" />);
    await act(async () => {
      fireEvent.press(getByTestId('cart-add-product-1'));
    });
    await waitFor(() => expect(CartApi.addToCart).toHaveBeenCalledWith('store-1', 'product-1', 1));
  });

  it('calls updateItem when - is pressed and quantity > 1', async () => {
    resetCart([milk]);
    (CartApi.updateCartItem as jest.Mock).mockResolvedValue({
      id: 'c', items: [{ ...milk, quantity: 1, lineTotal: 100 }], total: 100,
    });
    const { getByTestId } = render(<CartQtyControl productId="product-1" />);
    await act(async () => {
      fireEvent.press(getByTestId('cart-dec-product-1'));
    });
    await waitFor(() => expect(CartApi.updateCartItem).toHaveBeenCalledWith('store-1', 'item-1', 1));
  });

  it('calls removeItem when - is pressed and quantity = 1', async () => {
    resetCart([{ ...milk, quantity: 1, lineTotal: 100 }]);
    (CartApi.removeCartItem as jest.Mock).mockResolvedValue({
      id: 'c', items: [], total: 0,
    });
    const { getByTestId } = render(<CartQtyControl productId="product-1" />);
    await act(async () => {
      fireEvent.press(getByTestId('cart-dec-product-1'));
    });
    await waitFor(() => expect(CartApi.removeCartItem).toHaveBeenCalledWith('store-1', 'item-1'));
  });
});
