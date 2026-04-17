import { create } from 'zustand';
import type { InventoryItem } from '../types/api';
import type { StoreProductsSort } from '../api/stores';

const DEFAULT_PAGE_SIZE = 24;
const DEFAULT_TTL_MS = 20 * 60 * 1000;

export interface StoreCatalogSnapshot {
  page: number;
  pageSize: number;
  query: string;
  inStockOnly: boolean;
  sort: StoreProductsSort;
  totalPages: number;
  totalElements: number;
  items: InventoryItem[];
  scrollOffset: number;
  updatedAt: number;
}

interface StoreCatalogState {
  snapshots: Record<string, StoreCatalogSnapshot>;
  getStateForStore: (storeId: string) => StoreCatalogSnapshot;
  patchState: (storeId: string, patch: Partial<StoreCatalogSnapshot>) => void;
  clearExpired: (ttlMs?: number) => void;
  clearStore: (storeId: string) => void;
}

function buildDefaultSnapshot(): StoreCatalogSnapshot {
  return {
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    query: '',
    inStockOnly: false,
    sort: 'titleAsc',
    totalPages: 1,
    totalElements: 0,
    items: [],
    scrollOffset: 0,
    updatedAt: Date.now(),
  };
}

const EMPTY_SNAPSHOT: StoreCatalogSnapshot = Object.freeze(buildDefaultSnapshot());

export const useStoreCatalogStore = create<StoreCatalogState>((set, get) => ({
  snapshots: {},

  getStateForStore: (storeId) => get().snapshots[storeId] ?? EMPTY_SNAPSHOT,

  patchState: (storeId, patch) => {
    set((state) => {
      const prev = state.snapshots[storeId] ?? buildDefaultSnapshot();
      const isDataPatch =
        Object.prototype.hasOwnProperty.call(patch, 'items') ||
        Object.prototype.hasOwnProperty.call(patch, 'totalElements') ||
        Object.prototype.hasOwnProperty.call(patch, 'totalPages');
      return {
        snapshots: {
          ...state.snapshots,
          [storeId]: {
            ...prev,
            ...patch,
            updatedAt: isDataPatch ? Date.now() : (prev.updatedAt ?? Date.now()),
          },
        },
      };
    });
  },

  clearExpired: (ttlMs = DEFAULT_TTL_MS) => {
    const now = Date.now();
    set((state) => {
      const next: Record<string, StoreCatalogSnapshot> = {};
      Object.entries(state.snapshots).forEach(([storeId, snapshot]) => {
        if (now - snapshot.updatedAt <= ttlMs) {
          next[storeId] = snapshot;
        }
      });
      return { snapshots: next };
    });
  },

  clearStore: (storeId) => {
    set((state) => {
      const next = { ...state.snapshots };
      delete next[storeId];
      return { snapshots: next };
    });
  },
}));
