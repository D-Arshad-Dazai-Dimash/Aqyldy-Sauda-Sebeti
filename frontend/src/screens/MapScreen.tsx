import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Geolocation from '@react-native-community/geolocation';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { getStores } from '../api/stores';
import type { Store } from '../types/api';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(330, SCREEN_W - 36);
const CARD_GAP = 12;

type StoreWithDistance = Store & {
  latitude: number;
  longitude: number;
  distanceKm?: number;
};

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

function buildMapHtml() {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      crossorigin=""
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
      crossorigin=""
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
      crossorigin=""
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #e2e8f0;
      }
      .store-popup-title {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
      }
      .store-popup-sub {
        margin-top: 4px;
        font-size: 12px;
        color: #475569;
      }
      /* Teal cluster bubbles matching app palette */
      .marker-cluster-small,
      .marker-cluster-medium,
      .marker-cluster-large {
        background-color: rgba(14, 165, 233, 0.25) !important;
      }
      .marker-cluster-small div,
      .marker-cluster-medium div,
      .marker-cluster-large div {
        background-color: rgba(14, 165, 233, 0.75) !important;
        color: #ffffff;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js" crossorigin=""></script>
    <script>
      const defaultCenter = [51.1694, 71.4491];
      const map = L.map('map', { zoomControl: true }).setView(defaultCenter, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersById = new Map();
      let userMarker = null;
      let clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 60,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: '<div><span>' + count + '</span></div>',
            className: 'marker-cluster marker-cluster-' + (count < 10 ? 'small' : count < 100 ? 'medium' : 'large'),
            iconSize: L.point(40, 40),
          });
        },
      });
      map.addLayer(clusterGroup);

      function postMessage(payload) {
        if (!window.ReactNativeWebView) return;
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }

      function clearStoreMarkers() {
        clusterGroup.clearLayers();
        markersById.clear();
      }

      function addUserMarker(user) {
        if (userMarker) {
          map.removeLayer(userMarker);
          userMarker = null;
        }

        if (!user) return;

        userMarker = L.circleMarker([user.latitude, user.longitude], {
          radius: 8,
          color: '#ffffff',
          weight: 2,
          fillColor: '#2563eb',
          fillOpacity: 1,
        }).addTo(map);

        userMarker.bindPopup('<div class="store-popup-title">Сіз осындасыз</div>');
      }

      window.updatePayload = function(payload) {
        clearStoreMarkers();
        addUserMarker(payload.userLocation || null);

        (payload.stores || []).forEach((store) => {
          const isSelected = payload.selectedStoreId === store.id;
          const marker = L.circleMarker([store.latitude, store.longitude], {
            radius: isSelected ? 10 : 8,
            color: isSelected ? '#0f172a' : '#ffffff',
            weight: 2,
            fillColor: isSelected ? '#0ea5e9' : '#14b8a6',
            fillOpacity: 1,
          });

          marker.bindPopup(
            '<div class="store-popup-title">' + store.name + '</div>' +
            '<div class="store-popup-sub">' + (store.address || '') + '</div>'
          );

          marker.on('click', () => {
            postMessage({ type: 'markerPress', storeId: store.id });
          });

          clusterGroup.addLayer(marker);
          markersById.set(store.id, { marker, store });
        });

        const selected = payload.selectedStoreId ? markersById.get(payload.selectedStoreId) : null;
        if (selected) {
          const ll = selected.marker.getLatLng();
          map.setView([ll.lat, ll.lng], Math.max(map.getZoom(), 14));
        } else if (payload.userLocation) {
          map.setView([payload.userLocation.latitude, payload.userLocation.longitude], 13);
        } else if ((payload.stores || []).length > 0) {
          const first = payload.stores[0];
          map.setView([first.latitude, first.longitude], 12);
        }
      };

      window.focusStore = function(storeId) {
        const data = markersById.get(storeId);
        if (!data) return;
        const ll = data.marker.getLatLng();
        map.setView([ll.lat, ll.lng], Math.max(map.getZoom(), 15));
        data.marker.openPopup();
      };

      window.focusUser = function() {
        if (!userMarker) return;
        const ll = userMarker.getLatLng();
        map.setView([ll.lat, ll.lng], Math.max(map.getZoom(), 15));
        userMarker.openPopup();
      };

      postMessage({ type: 'mapReady' });
    </script>
  </body>
</html>
`;
}

// Required for Android — must be called before any Geolocation API usage
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
      message: 'Жақын дүкендерді көрсету үшін орналасқан жерге рұқсат беріңіз',
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
    // Try GPS first (accurate, but may fail on emulator without mock location)
    return await tryGetPosition(true);
  } catch {
    // Fallback to network/cell-based location
    return await tryGetPosition(false);
  }
}

export default function MapScreen({ navigation }: any) {
  const webRef = useRef<WebView | null>(null);
  const cardsRef = useRef<FlatList<StoreWithDistance> | null>(null);

  const [stores, setStores] = useState<StoreWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapHtml = useMemo(() => buildMapHtml(), []);

  const sendPayloadToMap = useCallback((overrideStoreId?: string | null) => {
    if (!mapReady || !webRef.current) return;

    const payload = {
      stores: stores.map((store) => ({
        id: store.id,
        name: store.name,
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
      })),
      userLocation,
      selectedStoreId: overrideStoreId ?? selectedStoreId,
    };

    webRef.current.injectJavaScript(`window.updatePayload(${JSON.stringify(payload)}); true;`);
  }, [mapReady, selectedStoreId, stores, userLocation]);

  const focusStoreOnMap = useCallback((storeId: string) => {
    if (!mapReady || !webRef.current) return;
    webRef.current.injectJavaScript(`window.focusStore(${JSON.stringify(storeId)}); true;`);
  }, [mapReady]);

  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStores();

      const withCoords: StoreWithDistance[] = (data || [])
        .filter((store) => store.latitude != null && store.longitude != null)
        .map((store) => ({
          ...store,
          latitude: Number(store.latitude),
          longitude: Number(store.longitude),
        }));

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

      const sorted: StoreWithDistance[] = withCoords
        .map((store) => {
          if (!current) return store;
          return {
            ...store,
            distanceKm: distanceKm(current.latitude, current.longitude, store.latitude, store.longitude),
          };
        })
        .sort((a, b) => {
          if (a.distanceKm == null && b.distanceKm == null) return 0;
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });

      setStores(sorted);
      setSelectedStoreId(sorted[0]?.id ?? null);
    } catch {
      setError('Дүкендерді жүктеу мүмкін болмады');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    sendPayloadToMap();
  }, [sendPayloadToMap]);

  const nearestStore = useMemo(() => stores[0], [stores]);

  const handleMapMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data || '{}');
      if (payload.type === 'mapReady') {
        setMapReady(true);
        return;
      }

      if (payload.type === 'markerPress' && payload.storeId) {
        setSelectedStoreId(payload.storeId);
        const index = stores.findIndex((store) => store.id === payload.storeId);
        if (index >= 0) {
          cardsRef.current?.scrollToIndex({ index, animated: true });
        }
      }
    } catch {
      // ignore malformed messages
    }
  };

  const selectStore = (store: StoreWithDistance, source: 'card' | 'slide' | 'marker') => {
    setSelectedStoreId(store.id);
    focusStoreOnMap(store.id);

    if (source === 'card') {
      const index = stores.findIndex((item) => item.id === store.id);
      if (index >= 0) {
        cardsRef.current?.scrollToIndex({ index, animated: true });
      }
    }
  };

  const handleRecenter = async () => {
    try {
      const allowed = await requestLocationPermission();
      if (!allowed) {
        Alert.alert('Рұқсат', 'Орналасқан жер рұқсаты берілмеген');
        return;
      }

      const current = await getCurrentPosition();
      setUserLocation(current);
      webRef.current?.injectJavaScript('window.focusUser(); true;');
      await loadStores();
    } catch {
      Alert.alert('Ескерту', 'Орналасқан жерді анықтау мүмкін болмады');
    }
  };

  const openExternalMap = async (store: Store) => {
    if (store.latitude == null || store.longitude == null) return;
    const label = encodeURIComponent(store.name);
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${store.latitude},${store.longitude}&q=${label}`,
      android: `geo:${store.latitude},${store.longitude}?q=${store.latitude},${store.longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`,
    });

    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.root}>
      <WebView
        ref={(instance) => {
          webRef.current = instance;
        }}
        source={{ html: mapHtml }}
        originWhitelist={['*']}
        onMessage={handleMapMessage}
        javaScriptEnabled
        domStorageEnabled
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeOverlay} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundBtn}>
            <Feather name="chevron-left" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.titlePill}>
            <Feather name="map-pin" size={14} color="#0EA5E9" />
            <Text style={styles.title}>Дүкендер картасы</Text>
          </View>

          <TouchableOpacity onPress={handleRecenter} style={styles.roundBtn}>
            <Feather name="crosshair" size={18} color="#0EA5E9" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Карта жүктелуде...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-triangle" size={14} color="#FEE2E2" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadStores}>
            <Text style={styles.retryText}>Қайта</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {stores.length > 0 ? (
        <View style={styles.bottomSheet}>
          {nearestStore ? (
            <View style={styles.nearestBadge}>
              <Feather name="navigation" size={12} color="#0EA5E9" />
              <Text style={styles.nearestBadgeText} numberOfLines={1}>
                Ең жақын: {nearestStore.name} · {formatDistance(nearestStore.distanceKm)}
              </Text>
            </View>
          ) : null}

          <FlatList
            ref={(instance) => {
              cardsRef.current = instance;
            }}
            data={stores}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
            snapToInterval={CARD_W + CARD_GAP}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) => {
              if (!stores.length) return;
              const index = Math.max(
                0,
                Math.min(
                  stores.length - 1,
                  Math.round(event.nativeEvent.contentOffset.x / (CARD_W + CARD_GAP))
                )
              );

              const store = stores[index];
              if (store) {
                selectStore(store, 'slide');
              }
            }}
            getItemLayout={(_, index) => ({
              length: CARD_W + CARD_GAP,
              offset: (CARD_W + CARD_GAP) * index,
              index,
            })}
            renderItem={({ item }) => {
              const selected = selectedStoreId === item.id;

              return (
                <TouchableOpacity
                  style={[styles.card, selected && styles.cardActive]}
                  activeOpacity={0.92}
                  onPress={() => selectStore(item, 'card')}
                >
                  <View style={styles.cardHeadRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.distanceChip}>
                      <Text style={styles.distanceChipText}>{formatDistance(item.distanceKm)}</Text>
                    </View>
                  </View>

                  <View style={styles.addressRow}>
                    <Feather name="map-pin" size={12} color="#64748B" />
                    <Text style={styles.cardAddress} numberOfLines={2}>{item.address || 'Мекенжай көрсетілмеген'}</Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.ghostBtn}
                      onPress={() => openExternalMap(item)}
                    >
                      <Feather name="navigation" size={14} color="#0EA5E9" />
                      <Text style={styles.ghostBtnText}>Маршрут</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => navigation.navigate('StoreScreen', { storeId: item.id })}
                    >
                      <Text style={styles.primaryBtnText}>Ашу</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  safeOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  loadingOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 84,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingText: { marginTop: 6, color: '#334155', fontWeight: '600', fontSize: 12 },
  errorBanner: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(220,38,38,0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { flex: 1, color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 14,
    backgroundColor: 'transparent',
  },
  nearestBadge: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nearestBadgeText: { color: '#0F172A', fontWeight: '700', fontSize: 12, flex: 1 },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_W,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.98)',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  cardActive: {
    borderColor: '#0EA5E9',
    shadowOpacity: 0.2,
  },
  cardHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#0F172A' },
  distanceChip: {
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distanceChipText: { color: '#0369A1', fontSize: 11, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
  cardAddress: { flex: 1, color: '#475569', fontSize: 12, lineHeight: 16 },
  cardActions: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ghostBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ghostBtnText: { color: '#0EA5E9', fontWeight: '700', fontSize: 13 },
  primaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
