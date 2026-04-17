import { create } from 'zustand';
import * as CartApi from '../api/cart';
import type { Cart, CartItem } from '../types/api';

interface CartState {
  cart: Cart | null;
  storeId: string | null;
  loading: boolean;
  error: string | null;

  setStore: (storeId: string) => void;
  fetchCart: (storeId: string) => Promise<void>;
  addItem: (storeId: string, productId: string, quantity?: number, optimisticItem?: Partial<CartItem>) => Promise<void>;
  updateItem: (storeId: string, itemId: string, quantity: number) => Promise<void>;
  removeItem: (storeId: string, itemId: string) => Promise<void>;
  clearCart: (storeId: string) => Promise<void>;
  reset: () => void;
}

function calculateTotal(items: CartItem[]) {
  return items.reduce((sum, item) => {
    const line = item.lineTotal ?? (Number(item.price) * item.quantity);
    return sum + (Number.isNaN(line) ? 0 : Number(line));
  }, 0);
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  storeId: null,
  loading: false,
  error: null,

  setStore: (storeId) => {
    const current = get().storeId;
    if (current !== storeId) {
      set({ storeId, cart: null, error: null });
    }
  },

  fetchCart: async (storeId) => {
    set({ loading: true, error: null });
    try {
      const cart = await CartApi.getCart(storeId);
      set({ cart, storeId, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.response?.data?.detail || 'Failed to load cart' });
    }
  },

  addItem: async (storeId, productId, quantity = 1, optimisticItem) => {
    const previousCart = get().cart;
    set({ loading: true, error: null, storeId });
    const currentItems = previousCart?.items ?? [];
    const existingItem = currentItems.find((item) => item.productId === productId);

    if (existingItem || optimisticItem) {
      const nextItems = existingItem
        ? currentItems.map((item) => item.productId === productId
          ? {
              ...item,
              quantity: item.quantity + quantity,
              lineTotal: Number(item.price) * (item.quantity + quantity),
            }
          : item)
        : [
            ...currentItems,
            {
              id: `temp-${productId}`,
              productId,
              productTitle: existingItem?.productTitle ?? optimisticItem?.productTitle ?? 'Тауар',
              price: Number(optimisticItem?.price ?? 0),
              imageUrl: optimisticItem?.imageUrl ?? null,
              quantity,
              lineTotal: Number(optimisticItem?.price ?? 0) * quantity,
            },
          ];

      set({
        cart: {
          id: previousCart?.id ?? `optimistic_${Date.now()}`,
          items: nextItems,
          total: calculateTotal(nextItems),
        },
        error: null,
        loading: true,
        storeId,
      });
    } else {
      set({ loading: true, error: null, storeId });
    }

    try {
      const cart = await CartApi.addToCart(storeId, productId, quantity);
      set({ cart, storeId, loading: false, error: null });
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Failed to add item';
      set({ cart: previousCart, loading: false, error: msg });
      throw new Error(msg);
    }
  },

  updateItem: async (storeId, itemId, quantity) => {
    const previousCart = get().cart;
    set({ loading: true, error: null, storeId });
    const nextItems = previousCart?.items
      ?.map((item) => item.id === itemId
        ? { ...item, quantity, lineTotal: Number(item.price) * quantity }
        : item)
      ?? [];

    set({
      cart: previousCart ? { ...previousCart, items: nextItems, total: calculateTotal(nextItems) } : previousCart,
      loading: true,
      error: null,
    });

    try {
      const cart = await CartApi.updateCartItem(storeId, itemId, quantity);
      set({ cart, loading: false, error: null });
    } catch (e: any) {
      set({ cart: previousCart, loading: false, error: e?.response?.data?.detail || 'Failed to update item' });
      throw e;
    }
  },

  removeItem: async (storeId, itemId) => {
    const previousCart = get().cart;
    set({ loading: true, error: null, storeId });
    const nextItems = previousCart?.items?.filter((item) => item.id !== itemId) ?? [];

    set({
      cart: previousCart ? { ...previousCart, items: nextItems, total: calculateTotal(nextItems) } : previousCart,
      loading: true,
      error: null,
    });

    try {
      const cart = await CartApi.removeCartItem(storeId, itemId);
      set({ cart, loading: false, error: null });
    } catch (e: any) {
      set({ cart: previousCart, loading: false, error: e?.response?.data?.detail || 'Failed to remove item' });
      throw e;
    }
  },

  clearCart: async (storeId) => {
    const previousCart = get().cart;
    set({ loading: true, error: null, storeId });
    set({
      cart: previousCart ? { ...previousCart, items: [], total: 0 } : previousCart,
      loading: true,
      error: null,
    });

    try {
      const cart = await CartApi.clearCart(storeId);
      set({ cart, loading: false, error: null });
    } catch (e: any) {
      set({ cart: previousCart, loading: false, error: e?.response?.data?.detail || 'Failed to clear cart' });
      throw e;
    }
  },

  reset: () => set({ cart: null, storeId: null, loading: false, error: null }),
}));

// Helper: get item count for badge
export const useCartItemCount = () =>
  useCartStore((s) => s.cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0);
