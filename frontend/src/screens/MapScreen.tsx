import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Geolocation from '@react-native-community/geolocation';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { getStores } from '../api/stores';
import type { Store } from '../types/api';
import { useCartStore } from '../store/cartStore';
import { palette } from '../config/palette';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(740, SCREEN_W - 28);

type StoreWithDistance = Store & {
  latitude: number;
  longitude: number;
  distanceKm?: number;
};

type FilterTab = 'mine' | 'nearby' | 'map';

type RatingHistogram = {
  five: number;
  four: number;
  three: number;
  two: number;
};

const FILTER_TABS: Array<{ key: FilterTab; title: string; icon: string }> = [
  { key: 'mine', title: 'Менің', icon: 'user' },
  { key: 'nearby', title: 'Маңайда', icon: 'target' },
  { key: 'map', title: 'Картада', icon: 'map' },
];

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const earthKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const hav =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthKm * Math.asin(Math.sqrt(hav));
}

function formatDistance(value?: number) {
  if (value == null) return 'Қашықтық белгісіз';
  if (value < 1) return `${Math.round(value * 1000)} м`;
  return `${value.toFixed(1)} км`;
}

function normalizeCoordinate(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function hasValidCoordinates(lat: number | null, lng: number | null): lat is number {
  if (lat == null || lng == null) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  // Defensive guard for empty/placeholder coordinates.
  if (lat === 0 && lng === 0) return false;
  return true;
}

function getStorePhone(storeId: string) {
  const seed = storeId.replace(/[^0-9a-z]/gi, '').slice(0, 9);
  return `8705${seed.padEnd(7, '1').slice(0, 7)}`;
}

function getStoreCode(storeId: string) {
  return `JP${storeId.replace(/[^0-9a-z]/gi, '').slice(0, 4).toUpperCase()}`;
}

function buildRating(storeId?: string): { average: number; total: number; histogram: RatingHistogram } {
  const text = storeId ?? 'default';
  const hash = Array.from(text).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const histogram = {
    five: 20 + (hash % 16),
    four: 12 + (hash % 10),
    three: 3 + (hash % 4),
    two: 2 + (hash % 3),
  };

  const total = histogram.five + histogram.four + histogram.three + histogram.two;
  const weighted = histogram.five * 5 + histogram.four * 4 + histogram.three * 3 + histogram.two * 2;
  const average = total > 0 ? Number((weighted / total).toFixed(1)) : 0;

  return { average, total, histogram };
}

function getOpenBadge() {
  const now = new Date();
  const openHour = 10;
  const closeHour = 20;
  const hour = now.getHours();
  const isOpen = hour >= openHour && hour < closeHour;

  if (isOpen) {
    const closeIn = Math.max(closeHour - hour, 1);
    return {
      label: `Ашық · ${closeIn} сағ кейін жабылады`,
      bg: '#E8F5E9',
      text: '#2E7D32',
      icon: 'check-circle',
    };
  }

  return {
    label: 'Қазір жабық',
    bg: '#F3F4F6',
    text: '#6B7280',
    icon: 'clock',
  };
}

function isStoreOpen() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 10 && hour < 20;
}

function buildMapPreviewHtml() {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: ${palette.softBlue};
      }
      .store-pin {
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: ${palette.mint};
        border: 3px solid #ffffff;
        box-shadow: 0 6px 16px rgba(26,154,136,0.34);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      function postMessage(payload) {
        if (!window.ReactNativeWebView) return;
        try { window.ReactNativeWebView.postMessage(JSON.stringify(payload)); } catch (e) {}
      }

      function bootstrap() {
        if (typeof L === 'undefined') {
          postMessage({ type: 'previewError', reason: 'leaflet-missing' });
          return;
        }
        const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([43.238949, 76.889709], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        let storeMarker = null;
        let userMarker = null;

      window.updatePreview = function(payload) {
        if (storeMarker) {
          map.removeLayer(storeMarker);
          storeMarker = null;
        }

        if (userMarker) {
          map.removeLayer(userMarker);
          userMarker = null;
        }

        if (!payload || !payload.store) return;

        const s = payload.store;
        const ll = [s.latitude, s.longitude];

        const pinIcon = L.divIcon({
          html: '<div class="store-pin"></div>',
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 22],
        });

        storeMarker = L.marker(ll, { icon: pinIcon }).addTo(map);

        if (payload.userLocation) {
          userMarker = L.circleMarker([payload.userLocation.latitude, payload.userLocation.longitude], {
            radius: 6,
            color: '#ffffff',
            weight: 2,
            fillColor: '#2563eb',
            fillOpacity: 1,
          }).addTo(map);
        }

        map.setView(ll, 14);
      };

      map.on('click', function() {
        postMessage({ type: 'openMap' });
      });

      postMessage({ type: 'previewReady' });
      } // end bootstrap()

      if (document.readyState === 'complete') {
        try { bootstrap(); } catch (e) { postMessage({ type: 'previewError', reason: String(e && e.message || e) }); }
      } else {
        window.addEventListener('load', function() {
          try { bootstrap(); } catch (e) { postMessage({ type: 'previewError', reason: String(e && e.message || e) }); }
        });
      }
    </script>
  </body>
</html>
`;
}

function buildBranchMapHtml() {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" crossorigin="" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" crossorigin="" />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: ${palette.paper};
      }
      .branch-pin {
        border-radius: 999px;
        width: 22px;
        height: 22px;
        background: ${palette.mint};
        border: 3px solid #ffffff;
        box-shadow: 0 6px 16px rgba(26,154,136,0.34);
      }
      .branch-pin.selected {
        width: 26px;
        height: 26px;
        background: ${palette.mintDark};
      }
      .marker-cluster-small,
      .marker-cluster-medium,
      .marker-cluster-large {
        background-color: rgba(26,154,136,0.22) !important;
      }
      .marker-cluster-small div,
      .marker-cluster-medium div,
      .marker-cluster-large div {
        background-color: rgba(26,154,136,0.85) !important;
        color: #fff;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js" crossorigin=""></script>
    <script>
      function postMessage(payload) {
        if (!window.ReactNativeWebView) return;
        try { window.ReactNativeWebView.postMessage(JSON.stringify(payload)); } catch (e) {}
      }

      // Defer initialization until the page (and CDN scripts) have loaded.
      // Without this, slow networks could cause Leaflet (the L global) to be
      // undefined and the whole bootstrap to throw silently — leaving
      // 'branchMapReady' never being posted, so the React side never injects
      // markers.
      function bootstrap() {
        if (typeof L === 'undefined') {
          postMessage({ type: 'branchMapError', reason: 'leaflet-missing' });
          return;
        }

        const defaultCenter = [43.238949, 76.889709];
        const map = L.map('map', { zoomControl: false, attributionControl: false }).setView(defaultCenter, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        const markersById = new Map();
        let userMarker = null;
        // markercluster is optional — if the CDN script failed, fall back to a
        // plain LayerGroup so single markers still render.
        const clusterGroup = (typeof L.markerClusterGroup === 'function')
          ? L.markerClusterGroup({
              maxClusterRadius: 60,
              showCoverageOnHover: false,
              spiderfyOnMaxZoom: true,
            })
          : L.layerGroup();
        map.addLayer(clusterGroup);

      function makeIcon(selected) {
        return L.divIcon({
          html: '<div class="branch-pin' + (selected ? ' selected' : '') + '"></div>',
          className: '',
          iconSize: selected ? [26, 26] : [22, 22],
          iconAnchor: selected ? [13, 26] : [11, 22],
        });
      }

      function clearStores() {
        clusterGroup.clearLayers();
        markersById.clear();
      }

      function updateUser(user) {
        if (userMarker) {
          map.removeLayer(userMarker);
          userMarker = null;
        }
        if (!user) return;

        userMarker = L.circleMarker([user.latitude, user.longitude], {
          radius: 9,
          color: '#ffffff',
          weight: 3,
          fillColor: '${palette.mint}',
          fillOpacity: 1,
        }).addTo(map);
      }

      window.updateBranchMap = function(payload) {
        clearStores();
        updateUser(payload.userLocation || null);

        (payload.stores || []).forEach(function(store) {
          const selected = payload.selectedStoreId === store.id;
          const marker = L.marker([store.latitude, store.longitude], { icon: makeIcon(selected) });
          marker.on('click', function() {
            postMessage({ type: 'markerPress', storeId: store.id });
          });
          clusterGroup.addLayer(marker);
          markersById.set(store.id, marker);
        });

        const selected = payload.selectedStoreId ? markersById.get(payload.selectedStoreId) : null;
        if (selected) {
          map.setView(selected.getLatLng(), Math.max(map.getZoom(), 15));
        } else if (payload.userLocation) {
          map.setView([payload.userLocation.latitude, payload.userLocation.longitude], 14);
        }
      };

      window.focusUser = function() {
        if (!userMarker) return;
        map.setView(userMarker.getLatLng(), Math.max(map.getZoom(), 15));
      };

      window.zoomInMap = function() { map.zoomIn(); };
      window.zoomOutMap = function() { map.zoomOut(); };

      postMessage({ type: 'branchMapReady' });
      } // end bootstrap()

      if (document.readyState === 'complete') {
        try { bootstrap(); } catch (e) {
          postMessage({ type: 'branchMapError', reason: String(e && e.message || e) });
        }
      } else {
        window.addEventListener('load', function() {
          try { bootstrap(); } catch (e) {
            postMessage({ type: 'branchMapError', reason: String(e && e.message || e) });
          }
        });
      }
    </script>
  </body>
</html>
`;
}

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Орналасқан жер рұқсаты',
      message: 'Жақын бөлімшені көрсету үшін орналасқан жерге рұқсат беріңіз',
      buttonPositive: 'Рұқсат беру',
      buttonNegative: 'Бас тарту',
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function tryGetPosition(highAccuracy: boolean): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 8000 : 15000, maximumAge: 30000 }
    );
  });
}

async function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  try {
    return await tryGetPosition(true);
  } catch {
    return await tryGetPosition(false);
  }
}

async function openExternalMap(store: StoreWithDistance) {
  const label = encodeURIComponent(store.name);
  const fallback = `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
  const url = Platform.select({
    ios: `http://maps.apple.com/?ll=${store.latitude},${store.longitude}&q=${label}`,
    android: `geo:${store.latitude},${store.longitude}?q=${store.latitude},${store.longitude}(${label})`,
    default: fallback,
  });

  if (!url) return;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // fallback below
  }
  await Linking.openURL(fallback);
}

async function open2GIS(store: StoreWithDistance) {
  const primary = `dgis://2gis.ru/routeSearch/rsType/car/to/${store.longitude},${store.latitude}`;
  const fallback = `https://2gis.kz/almaty/search/${store.latitude}%2C${store.longitude}`;
  const supported = await Linking.canOpenURL(primary);
  await Linking.openURL(supported ? primary : fallback);
}

async function openYandex(store: StoreWithDistance) {
  const primary = `yandexmaps://maps.yandex.ru/?pt=${store.longitude},${store.latitude}&z=16&l=map`;
  const fallback = `https://yandex.com/maps/?pt=${store.longitude},${store.latitude}&z=16&l=map`;
  const supported = await Linking.canOpenURL(primary);
  await Linking.openURL(supported ? primary : fallback);
}

export default function MapScreen({ navigation }: any) {
  const previewWebRef = useRef<WebView | null>(null);
  const mapWebRef = useRef<WebView | null>(null);
  const persistedStoreId = useCartStore((s) => s.storeId);
  const setCartStore = useCartStore((s) => s.setStore);

  const [stores, setStores] = useState<StoreWithDistance[]>([]);
  const [noCoordsStores, setNoCoordsStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('nearby');
  const [previewReady, setPreviewReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapSheetVisible, setMapSheetVisible] = useState(false);

  const mapHtml = useMemo(() => buildMapPreviewHtml(), []);
  const branchMapHtml = useMemo(() => buildBranchMapHtml(), []);

  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getStores();
      const noCoords: Store[] = [];
      const withCoords: StoreWithDistance[] = (data || [])
        .map((store) => {
          const latitude = normalizeCoordinate(store.latitude);
          const longitude = normalizeCoordinate(store.longitude);

          if (!hasValidCoordinates(latitude, longitude)) {
            noCoords.push(store);
            return null;
          }

          return {
            ...store,
            latitude,
            longitude,
          };
        })
        .filter((store): store is StoreWithDistance => store != null);

      setNoCoordsStores(noCoords);

      const allowed = await requestLocationPermission();
      let current: { latitude: number; longitude: number } | null = null;

      if (allowed) {
        try {
          current = await getCurrentPosition();
          setUserLocation(current);
        } catch {
          setUserLocation(null);
        }
      } else {
        setUserLocation(null);
      }

      const withDistance = withCoords.map((store) => {
        if (!current) return store;
        return {
          ...store,
          distanceKm: distanceKm(current.latitude, current.longitude, store.latitude, store.longitude),
        };
      });

      setStores(withDistance);
      setSelectedStoreId(persistedStoreId ?? withDistance[0]?.id ?? null);
    } catch {
      setError('Бөлімшелерді жүктеу мүмкін болмады');
    } finally {
      setLoading(false);
    }
  }, [persistedStoreId]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const orderedStores = useMemo(() => {
    const items = [...stores];

    items.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    return items;
  }, [activeTab, stores]);

  const selectedStore = useMemo(() => {
    if (!orderedStores.length) return null;
    return orderedStores.find((s) => s.id === selectedStoreId) ?? orderedStores[0];
  }, [orderedStores, selectedStoreId]);

  useEffect(() => {
    if (!selectedStore && orderedStores.length) {
      setSelectedStoreId(orderedStores[0].id);
    }
  }, [orderedStores, selectedStore]);

  useEffect(() => {
    if (!previewReady || !previewWebRef.current || !selectedStore) return;

    const payload = {
      store: {
        id: selectedStore.id,
        name: selectedStore.name,
        latitude: selectedStore.latitude,
        longitude: selectedStore.longitude,
      },
      userLocation,
    };

    previewWebRef.current.injectJavaScript(`window.updatePreview(${JSON.stringify(payload)}); true;`);
  }, [previewReady, selectedStore, userLocation]);

  useEffect(() => {
    if (!mapReady || !mapWebRef.current) return;

    const payload = {
      stores: orderedStores.map((store) => ({
        id: store.id,
        name: store.name,
        latitude: store.latitude,
        longitude: store.longitude,
      })),
      userLocation,
      selectedStoreId,
    };

    mapWebRef.current.injectJavaScript(`window.updateBranchMap(${JSON.stringify(payload)}); true;`);
  }, [mapReady, orderedStores, selectedStoreId, userLocation]);

  const rating = useMemo(() => buildRating(selectedStore?.id), [selectedStore?.id]);
  const maxBucket = Math.max(rating.histogram.five, rating.histogram.four, rating.histogram.three, rating.histogram.two, 1);
  const openBadge = useMemo(() => getOpenBadge(), []);

  const handleMapPreviewMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data || '{}');
      if (payload.type === 'previewReady') {
        setPreviewReady(true);
      }
      if (payload.type === 'openMap' && selectedStore) {
        openExternalMap(selectedStore);
      }
    } catch {
      // Ignore malformed events
    }
  };

  const handleBranchMapMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data || '{}');
      if (payload.type === 'branchMapReady') {
        setMapReady(true);
        return;
      }
      if (payload.type === 'branchMapError') {
        // eslint-disable-next-line no-console
        console.warn('[MapScreen] branch map failed to bootstrap:', payload.reason);
        return;
      }
      if (payload.type === 'markerPress' && payload.storeId) {
        setSelectedStoreId(payload.storeId);
        setMapSheetVisible(true);
      }
    } catch {
      // ignore malformed events
    }
  };

  const handleCall = async () => {
    if (!selectedStore) return;
    const phone = getStorePhone(selectedStore.id);
    const url = `tel:${phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleCopyAddress = () => {
    if (!selectedStore?.address) return;
    Clipboard.setString(selectedStore.address);
    Alert.alert('Көшірілді', 'Мекенжай буферге көшірілді');
  };

  const handleOpenStore = () => {
    if (!selectedStore) return;
    navigation.navigate('StoreScreen', { storeId: selectedStore.id });
  };

  const handleTabPress = (tab: FilterTab) => {
    setActiveTab(tab);
    setMapSheetVisible(false);

    if (tab === 'mine' && orderedStores.length > 0) {
      const current = persistedStoreId ? orderedStores.find((store) => store.id === persistedStoreId) : null;
      setSelectedStoreId(current?.id ?? orderedStores[0].id);
    }
    if (tab === 'map' && orderedStores.length > 0) {
      setSelectedStoreId((current) => current ?? orderedStores[0].id);
    }
  };

  const handleNearbyDetail = (store: StoreWithDistance) => {
    setSelectedStoreId(store.id);
    setActiveTab('mine');
  };

  const handleConfirmStore = () => {
    if (!selectedStore) return;
    setCartStore(selectedStore.id);
    navigation.goBack();
  };

  const nearestStore = orderedStores[0] ?? null;
  const showNearbySelection = activeTab === 'nearby';
  const showMapMode = activeTab === 'map';
  const isOpen = isStoreOpen();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Бөлімшені таңдау</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabsWrap}>
        {FILTER_TABS.map((tab) => {
          const active = activeTab === tab.key;
          const isLast = tab.key === FILTER_TABS[FILTER_TABS.length - 1].key;
          return (
            <View key={tab.key} style={styles.tabCell}>
              <TouchableOpacity
                style={[styles.tab, active && styles.tabActive]}
                activeOpacity={0.88}
                onPress={() => handleTabPress(tab.key)}
              >
                <Feather name={tab.icon as any} size={16} color={active ? '#15921C' : '#111827'} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.title}</Text>
              </TouchableOpacity>
              {!isLast ? <View style={styles.tabDivider} /> : null}
            </View>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Бөлімшелер жүктелуде...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorWrap}>
          <Feather name="alert-triangle" size={14} color="#FEE2E2" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadStores}>
            <Text style={styles.retryText}>Қайта</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showMapMode ? (
        <View style={styles.mapModeWrap}>
          <WebView
            ref={(instance) => {
              mapWebRef.current = instance;
            }}
            source={{ html: branchMapHtml }}
            originWhitelist={['*']}
            onMessage={handleBranchMapMessage}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            setSupportMultipleWindows={false}
            style={styles.fullMap}
          />

          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.mapControlBtn}
              onPress={() => mapWebRef.current?.injectJavaScript('window.zoomInMap(); true;')}
            >
              <Feather name="plus" size={20} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapControlBtn}
              onPress={() => mapWebRef.current?.injectJavaScript('window.zoomOutMap(); true;')}
            >
              <Feather name="minus" size={20} color="#111827" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.locateBtn}
            onPress={() => mapWebRef.current?.injectJavaScript('window.focusUser(); true;')}
          >
            <Feather name="target" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {mapSheetVisible && selectedStore ? (
            <View style={styles.mapSheet}>
              <Text style={styles.mapSheetTitle}>{selectedStore.name}</Text>
              <Text style={styles.mapSheetAddress}>{selectedStore.address || 'Мекенжай көрсетілмеген'}</Text>
              <View style={styles.mapSheetMetaRow}>
                <View style={styles.branchStatusRow}>
                  <View style={styles.branchStatusDot} />
                  <Text style={styles.branchStatusText}>{isOpen ? 'Қазір ашық' : 'Қазір жабық'}</Text>
                </View>
                <Text style={styles.mapSheetPhone}>{getStorePhone(selectedStore.id)}</Text>
              </View>
              <TouchableOpacity style={styles.mapSelectBtn} onPress={handleConfirmStore}>
                <Text style={styles.mapSelectBtnText}>Выбрать филиал</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : showNearbySelection ? (
        <View style={styles.nearbyScreen}>
          <View style={styles.nearbyListCard}>
            {orderedStores.map((item, index) => {
              const selected = item.id === selectedStore?.id;
              return (
                <View key={item.id} style={[styles.branchItem, index > 0 && styles.branchItemSpacer]}>
                  <TouchableOpacity
                    style={styles.branchMainPress}
                    activeOpacity={0.9}
                    onPress={() => setSelectedStoreId(item.id)}
                  >
                    <View style={[styles.radioWrap, selected && styles.radioWrapActive]}>
                      {selected ? <Feather name="check" size={15} color="#FFFFFF" /> : null}
                    </View>

                    <View style={styles.branchTextBlock}>
                      <Text style={styles.branchTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.branchSubtitle} numberOfLines={1}>
                        {item.address || (item.distanceKm != null ? `${item.distanceKm.toFixed(1)} км қашық` : 'Мекенжай көрсетілмеген')}
                      </Text>
                      <View style={styles.branchStatusRow}>
                        <View style={styles.branchStatusDot} />
                        <Text style={styles.branchStatusText}>{isOpen ? 'Қазір ашық' : 'Қазір жабық'}</Text>
                      </View>
                    </View>

                    <View style={styles.branchCodeWrap}>
                      <Text style={styles.branchCode}>{getStoreCode(item.id)}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.branchChevronBtn}
                    onPress={() => handleNearbyDetail(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="chevron-right" size={20} color="#7A828A" />
                  </TouchableOpacity>
                </View>
              );
            })}

            {noCoordsStores.length > 0 ? (
              <>
                <View style={styles.noCoordsHeader}>
                  <Feather name="alert-triangle" size={13} color="#B45309" />
                  <Text style={styles.noCoordsHeaderText}>
                    Координаталары көрсетілмеген ({noCoordsStores.length})
                  </Text>
                </View>
                {noCoordsStores.map((item) => (
                  <View key={item.id} style={[styles.branchItem, styles.branchItemSpacer, styles.branchItemDisabled]}>
                    <View style={styles.branchMainPress}>
                      <View style={[styles.radioWrap, styles.radioWrapDisabled]}>
                        <Feather name="map-pin" size={13} color="#9CA3AF" />
                      </View>
                      <View style={styles.branchTextBlock}>
                        <Text style={styles.branchTitle} numberOfLines={1}>
                          {item.address || item.name}
                        </Text>
                        <Text style={[styles.branchSubtitle, { color: '#B45309' }]} numberOfLines={1}>
                          Картада белгіленбеген — тек тізімде
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, !selectedStore && styles.confirmBtnDisabled]}
            disabled={!selectedStore}
            onPress={handleConfirmStore}
            activeOpacity={0.92}
          >
            <Text style={styles.confirmBtnText}>Бөлімше өзгерту</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FlatList
            data={orderedStores}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storeChips}
            renderItem={({ item }) => {
              const active = item.id === selectedStore?.id;
              return (
                <TouchableOpacity
                  style={[styles.storeChip, active && styles.storeChipActive]}
                  activeOpacity={0.9}
                  onPress={() => setSelectedStoreId(item.id)}
                >
                  <Text style={[styles.storeChipText, active && styles.storeChipTextActive]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {selectedStore ? (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <View style={[styles.smartBadge, { backgroundColor: openBadge.bg }]}>
                <Feather name={openBadge.icon as any} size={12} color={openBadge.text} />
                <Text style={[styles.smartBadgeText, { color: openBadge.text }]}>{openBadge.label}</Text>
              </View>
              {nearestStore?.id === selectedStore.id ? (
                <View style={styles.aiBadge}>
                  <Feather name="zap" size={11} color="#2E7D32" />
                  <Text style={styles.aiBadgeText}>AI: Ең жақсы пункт</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.storeTitle}>{selectedStore.name} • {getStoreCode(selectedStore.id)}</Text>

            <TouchableOpacity style={styles.infoRow} activeOpacity={0.85} onPress={handleCall}>
              <Feather name="phone" size={15} color="#6B7280" />
              <Text style={styles.infoText}>{getStorePhone(selectedStore.id)}</Text>
            </TouchableOpacity>

            <View style={styles.infoRow}>
              <Feather name="clock" size={15} color="#6B7280" />
              <View style={styles.infoColumn}>
                <Text style={styles.infoText}>10:00 - 20:00</Text>
                <Text style={styles.infoSubText}>Демалыссыз</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.iconOnlyAction} onPress={handleOpenStore}>
              <Feather name="arrow-up-right" size={15} color="#2E7D32" />
              <Text style={styles.iconOnlyActionText}>Дүкен туралы толық ақпарат</Text>
            </TouchableOpacity>

            <View style={styles.infoRowBetween}>
              <View style={styles.infoRowGrow}>
                <Feather name="map-pin" size={15} color="#6B7280" />
                <View style={styles.infoColumn}>
                  <Text style={styles.infoText}>{selectedStore.address || 'Мекенжай көрсетілмеген'}</Text>
                  <Text style={styles.infoSubText}>Алматы қаласы · Бөлімше</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.iconPill} onPress={handleCopyAddress}>
                <Feather name="clipboard" size={15} color="#2E7D32" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.95} onPress={() => openExternalMap(selectedStore)}>
              <View style={styles.mapPreviewWrap}>
                <WebView
                  ref={(instance) => {
                    previewWebRef.current = instance;
                  }}
                  source={{ html: mapHtml }}
                  originWhitelist={['*']}
                  onMessage={handleMapPreviewMessage}
                  javaScriptEnabled
                  domStorageEnabled
                  mixedContentMode="always"
                  scrollEnabled={false}
                  style={styles.mapPreview}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.mapButtonsRow}>
              <TouchableOpacity style={styles.mapProviderBtn} onPress={() => open2GIS(selectedStore)}>
                <Text style={styles.mapProviderBtnText}>2GIS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mapProviderBtn} onPress={() => openYandex(selectedStore)}>
                <Text style={styles.mapProviderBtnText}>Yandex</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.distanceBadge}>
              <Feather name="navigation" size={13} color="#2E7D32" />
              <Text style={styles.distanceBadgeText}>{formatDistance(selectedStore.distanceKm)} сізден</Text>
            </View>
          </View>
          ) : null}

          {selectedStore ? (
          <View style={styles.ratingBlock}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingValue}>{rating.average.toFixed(1)} / 5</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Feather
                    key={n}
                    name={n <= Math.round(rating.average) ? 'star' : 'star'}
                    size={16}
                    color={n <= Math.round(rating.average) ? '#F59E0B' : '#D1D5DB'}
                  />
                ))}
              </View>
              <Text style={styles.reviewsText}>{rating.total} Пікір</Text>
            </View>

            {([
              { label: '5', value: rating.histogram.five },
              { label: '4', value: rating.histogram.four },
              { label: '3', value: rating.histogram.three },
              { label: '2', value: rating.histogram.two },
            ] as const).map((row) => (
              <View key={row.label} style={styles.histRow}>
                <Text style={styles.histLabel}>{row.label} ⭐</Text>
                <View style={styles.histTrack}>
                  <View
                    style={[
                      styles.histFill,
                      { width: `${Math.max(6, (row.value / maxBucket) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.histCount}>{row.value}</Text>
              </View>
            ))}
          </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.border,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: palette.text,
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  tabsWrap: {
    marginTop: 6,
    marginHorizontal: 16,
    minHeight: 66,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  tabCell: {
    flex: 1,
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    minHeight: 66,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  tabActive: {
    backgroundColor: palette.mintSoft,
  },
  tabText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: palette.mint,
    fontWeight: '700',
  },
  tabDivider: {
    width: 1,
    height: 32,
    backgroundColor: palette.border,
  },
  mapModeWrap: {
    flex: 1,
    marginTop: 10,
    overflow: 'hidden',
  },
  fullMap: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 20,
    gap: 10,
  },
  mapControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  locateBtn: {
    position: 'absolute',
    right: 16,
    bottom: 150,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  mapSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  mapSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  mapSheetAddress: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
  },
  mapSheetMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapSheetPhone: {
    color: palette.mint,
    fontSize: 14,
    fontWeight: '700',
  },
  mapSelectBtn: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapSelectBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingWrap: {
    marginTop: 14,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontWeight: '600',
  },
  errorWrap: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: 'rgba(220,38,38,0.88)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  content: {
    paddingTop: 10,
    paddingBottom: 24,
  },
  nearbyScreen: {
    flex: 1,
    paddingTop: 26,
    paddingHorizontal: 16,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  nearbyListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  branchItem: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchItemSpacer: {
    marginTop: 24,
  },
  branchMainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: palette.softGray,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioWrapActive: {
    backgroundColor: palette.mint,
    borderColor: palette.mint,
  },
  radioWrapDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  branchItemDisabled: {
    opacity: 0.75,
  },
  noCoordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  noCoordsHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  branchTextBlock: {
    flex: 1,
    marginRight: 8,
  },
  branchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.text,
  },
  branchSubtitle: {
    marginTop: 5,
    fontSize: 15,
    color: palette.textMuted,
  },
  branchStatusRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.mint,
    marginRight: 8,
  },
  branchStatusText: {
    fontSize: 15,
    color: palette.text,
    fontWeight: '500',
  },
  branchCodeWrap: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchCode: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.mint,
  },
  branchChevronBtn: {
    marginLeft: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    alignSelf: 'center',
    width: '100%',
    minHeight: 60,
    borderRadius: 20,
    backgroundColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  confirmBtnDisabled: {
    backgroundColor: palette.mintSoft,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  storeChips: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  storeChip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeChipActive: {
    backgroundColor: palette.mintSoft,
    borderColor: palette.mint,
  },
  storeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textMuted,
    maxWidth: 180,
  },
  storeChipTextActive: {
    color: palette.mint,
    fontWeight: '700',
  },
  card: {
    width: CARD_W,
    alignSelf: 'center',
    borderRadius: 18,
    backgroundColor: palette.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  smartBadge: {
    flex: 1,
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiBadge: {
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: palette.softBlue,
    borderWidth: 1,
    borderColor: palette.sky,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  aiBadgeText: {
    fontSize: 11,
    color: palette.mint,
    fontWeight: '700',
  },
  storeTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  infoRowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  infoRowGrow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoColumn: {
    flex: 1,
  },
  infoText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  infoSubText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  iconOnlyAction: {
    marginTop: 10,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: palette.mintSoft,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconOnlyActionText: {
    color: palette.mintDark,
    fontSize: 13,
    fontWeight: '700',
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  mapPreviewWrap: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    height: 150,
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  mapButtonsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  mapProviderBtn: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapProviderBtnText: {
    fontSize: 13,
    color: palette.text,
    fontWeight: '700',
  },
  distanceBadge: {
    marginTop: 10,
    minHeight: 30,
    borderRadius: 999,
    backgroundColor: palette.mintSoft,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  distanceBadgeText: {
    color: palette.mintDark,
    fontSize: 12,
    fontWeight: '700',
  },
  ratingBlock: {
    width: CARD_W,
    alignSelf: 'center',
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: palette.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  ratingHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingValue: {
    color: palette.mint,
    fontSize: 30,
    fontWeight: '900',
  },
  starsRow: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 4,
  },
  reviewsText: {
    marginTop: 4,
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  histLabel: {
    width: 38,
    color: palette.text,
    fontWeight: '700',
    fontSize: 12,
  },
  histTrack: {
    flex: 1,
    height: 9,
    borderRadius: 999,
    backgroundColor: palette.softGray,
    overflow: 'hidden',
  },
  histFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.gold,
  },
  histCount: {
    width: 26,
    textAlign: 'right',
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
