import { create } from 'zustand';
import { getStores } from '../api/stores';
import type { Store } from '../types/api';
import { isValidCoord, pickNearestStore, type LatLng } from '../utils/geo';

// Geolocation is loaded lazily so that unit tests (which don't run on a
// real device) can use the store without RN native modules blowing up.
type GeoLib = typeof import('@react-native-community/geolocation');

interface LocationState {
  userLocation: LatLng | null;
  /** Store the user is currently shopping in. Set automatically (nearest)
   * but can be overridden manually via `setActiveStoreId`. */
  activeStoreId: string | null;
  /** Snapshot of the most recent store list with coords. */
  knownStores: Pick<Store, 'id' | 'name' | 'latitude' | 'longitude'>[];
  loading: boolean;
  error: string | null;

  /** Manual override (called from MapScreen when the user taps a store). */
  setActiveStoreId: (id: string | null) => void;

  /** One-shot init: fetches stores + tries to read GPS, then auto-picks
   * the nearest store. Safe to call multiple times. */
  init: () => Promise<void>;

  /** Test/dev hook to bypass the real geolocation call. */
  _setUserLocation: (loc: LatLng | null) => void;
}

let geoLib: GeoLib | null | undefined;
function loadGeo(): GeoLib | null {
  if (geoLib !== undefined) return geoLib;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    geoLib = require('@react-native-community/geolocation') as GeoLib;
  } catch {
    geoLib = null;
  }
  return geoLib;
}

function getCurrentPosition(): Promise<LatLng> {
  const geo = loadGeo();
  if (!geo) return Promise.reject(new Error('geolocation unavailable'));
  return new Promise((resolve, reject) => {
    geo.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

export const useLocationStore = create<LocationState>((set, get) => ({
  userLocation: null,
  activeStoreId: null,
  knownStores: [],
  loading: false,
  error: null,

  setActiveStoreId: (id) => set({ activeStoreId: id }),

  _setUserLocation: (loc) => {
    set({ userLocation: loc });
    if (loc) {
      const nearest = pickNearestStore(loc, get().knownStores);
      if (nearest?.id && !get().activeStoreId) {
        set({ activeStoreId: nearest.id });
      }
    }
  },

  init: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const stores = await getStores();
      const withCoords = (stores || []).filter((s) =>
        isValidCoord(s.latitude, s.longitude),
      );
      set({ knownStores: withCoords });

      let loc: LatLng | null = null;
      try {
        loc = await getCurrentPosition();
      } catch {
        // Geo permission denied or unavailable — fall back to first store
        // with coordinates so the app still has *some* active store.
        loc = null;
      }

      if (loc) {
        set({ userLocation: loc });
        const nearest = pickNearestStore(loc, withCoords);
        if (nearest?.id && !get().activeStoreId) {
          set({ activeStoreId: nearest.id });
        }
      } else if (!get().activeStoreId && withCoords[0]?.id) {
        set({ activeStoreId: withCoords[0].id });
      }
    } catch (e: any) {
      set({ error: e?.message || 'failed to load stores' });
    } finally {
      set({ loading: false });
    }
  },
}));
