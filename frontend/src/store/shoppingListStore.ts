import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { safeJsonParse } from '../utils/storage';

const STORAGE_KEY = 'shopping:list:v1';

export type ShoppingListItem = {
  id: string;
  productId: string;
  title: string;
  price: number;
  imageUrl: string | null;
  storeId?: string;
  quantity: number;
  collectedQuantity: number;
  checked: boolean;
  createdAt: number;
};

type AddShoppingListItemInput = {
  productId: string;
  title: string;
  price: number;
  imageUrl?: string | null;
  storeId?: string;
  quantity?: number;
};

type ShoppingListState = {
  items: ShoppingListItem[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  addItem: (input: AddShoppingListItemInput) => Promise<void>;
  toggleChecked: (id: string) => Promise<void>;
  setCheckedForIds: (ids: string[], checked: boolean) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  incrementCollected: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearPurchased: () => Promise<void>;
  clearAll: () => Promise<void>;
};

async function persist(items: ShoppingListItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function normalizePrice(price: number): number {
  const parsed = Number(price);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = safeJsonParse<ShoppingListItem[]>(raw, []);
      set({ items: Array.isArray(parsed) ? parsed : [], loaded: true, loading: false });
    } catch {
      set({ items: [], loaded: true, loading: false });
    }
  },

  addItem: async (input) => {
    const qty = Math.max(1, Math.floor(Number(input.quantity ?? 1)));
    const now = Date.now();
    const state = get();
    const items = state.items;
    const existing = items.find(
      (it) => it.productId === input.productId && (it.storeId ?? '') === (input.storeId ?? '') && !it.checked
    );

    const next = existing
      ? items.map((it) =>
          it.id === existing.id ? { ...it, quantity: it.quantity + qty, price: normalizePrice(input.price) } : it
        )
      : [
          {
            id: `${input.productId}-${input.storeId ?? 'none'}-${now}`,
            productId: input.productId,
            title: input.title,
            price: normalizePrice(input.price),
            imageUrl: input.imageUrl ?? null,
            storeId: input.storeId,
            quantity: qty,
            collectedQuantity: 0,
            checked: false,
            createdAt: now,
          },
          ...items,
        ];

    set({ items: next });
    await persist(next);
  },

  toggleChecked: async (id) => {
    const next = get().items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it));
    set({ items: next });
    await persist(next);
  },

  setCheckedForIds: async (ids, checked) => {
    if (ids.length === 0) return;
    const setIds = new Set(ids);
    const next = get().items.map((it) => (setIds.has(it.id) ? { ...it, checked } : it));
    set({ items: next });
    await persist(next);
  },

  updateQuantity: async (id, quantity) => {
    const safeQuantity = Math.max(1, Math.floor(Number(quantity || 1)));
    const next = get().items.map((it) => (it.id === id ? { ...it, quantity: safeQuantity } : it));
    set({ items: next });
    await persist(next);
  },

  incrementCollected: async (id) => {
    const item = get().items.find((it) => it.id === id);
    if (!item) return;
    const newCollected = (item.collectedQuantity ?? 0) + 1;
    const isComplete = newCollected >= item.quantity;
    const next = get().items.map((it) =>
      it.id === id ? { ...it, collectedQuantity: newCollected, checked: isComplete ? true : it.checked } : it
    );
    set({ items: next });
    await persist(next);
  },

  removeItem: async (id) => {
    const next = get().items.filter((it) => it.id !== id);
    set({ items: next });
    await persist(next);
  },

  clearPurchased: async () => {
    const next = get().items.filter((it) => !it.checked);
    set({ items: next });
    await persist(next);
  },

  clearAll: async () => {
    set({ items: [] });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
