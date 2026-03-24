import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'favorites:ids';

interface FavoritesState {
  favorites: string[];
  loaded: boolean;
  load: () => Promise<void>;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ favorites: JSON.parse(raw), loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  toggleFavorite: (productId) => {
    const current = get().favorites;
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    set({ favorites: next });
    // Persist in background
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  },

  isFavorite: (productId) => get().favorites.includes(productId),
}));
