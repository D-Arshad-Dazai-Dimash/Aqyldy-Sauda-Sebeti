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
  addItem: (storeId: string, productId: string, quantity?: number) => Promise<void>;
  updateItem: (storeId: string, itemId: string, quantity: number) => Promise<void>;
  removeItem: (storeId: string, itemId: string) => Promise<void>;
  clearCart: (storeId: string) => Promise<void>;
  reset: () => void;
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

  addItem: async (storeId, productId, quantity = 1) => {
    set({ loading: true, error: null });
    try {
      const cart = await CartApi.addToCart(storeId, productId, quantity);
      set({ cart, loading: false });
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Failed to add item';
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  updateItem: async (storeId, itemId, quantity) => {
    set({ loading: true, error: null });
    try {
      const cart = await CartApi.updateCartItem(storeId, itemId, quantity);
      set({ cart, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.response?.data?.detail || 'Failed to update item' });
    }
  },

  removeItem: async (storeId, itemId) => {
    set({ loading: true, error: null });
    try {
      const cart = await CartApi.removeCartItem(storeId, itemId);
      set({ cart, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.response?.data?.detail || 'Failed to remove item' });
    }
  },

  clearCart: async (storeId) => {
    set({ loading: true, error: null });
    try {
      const cart = await CartApi.clearCart(storeId);
      set({ cart, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.response?.data?.detail || 'Failed to clear cart' });
    }
  },

  reset: () => set({ cart: null, storeId: null, loading: false, error: null }),
}));

// Helper: get item count for badge
export const useCartItemCount = () =>
  useCartStore((s) => s.cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0);
