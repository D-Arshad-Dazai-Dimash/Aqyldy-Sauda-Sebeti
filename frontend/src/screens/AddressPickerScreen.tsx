import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddressPicker'>;

const DEFAULT_LAT = 51.1694;
const DEFAULT_LNG = 71.4491;

// Поиск через Nominatim (OpenStreetMap), не требует API-ключа.
// Согласно политике использования передаём User-Agent и Accept-Language.
async function geocodeAddress(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ru,kk,en&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AqyldySaudaSebeti/1.0 (mobile app)',
      'Accept-Language': 'ru,kk,en',
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  const first = json?.[0];
  if (!first) return null;
  return {
    address: first.display_name,
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
  };
}

async function reverseGeocode(lat: number, lng: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru,kk,en`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AqyldySaudaSebeti/1.0 (mobile app)',
        'Accept-Language': 'ru,kk,en',
      },
    });
    if (!res.ok) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const json = (await res.json()) as { display_name?: string };
    return json?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

// HTML-страница с Leaflet, рендерится во WebView.
// Тайлы OpenStreetMap, без API-ключа. Связь с RN через postMessage.
function buildMapHtml(lat: number, lng: number): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#e8eef2; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  (function() {
    function send(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);

    function emit(latlng) {
      send({ type: 'pick', lat: latlng.lat, lng: latlng.lng });
    }

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      emit(e.latlng);
    });

    marker.on('dragend', function() {
      var pos = marker.getLatLng();
      emit(pos);
    });

    // Команды от RN: { type:'setView', lat, lng, zoom? }
    function handleCommand(raw) {
      try {
        var msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (msg && msg.type === 'setView' && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
          map.setView([msg.lat, msg.lng], msg.zoom || 15, { animate: true });
          marker.setLatLng([msg.lat, msg.lng]);
        }
      } catch (e) {}
    }

    document.addEventListener('message', function(e) { handleCommand(e.data); });
    window.addEventListener('message', function(e) { handleCommand(e.data); });

    send({ type: 'ready' });
  })();
  true;
</script>
</body>
</html>`;
}

export default function AddressPickerScreen({ navigation, route }: Props) {
  const webRef = useRef<WebView | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);

  const initialHtml = useMemo(() => buildMapHtml(DEFAULT_LAT, DEFAULT_LNG), []);

  const sendToMap = (payload: any) => {
    const js = `(function(){ var ev = new MessageEvent('message', { data: ${JSON.stringify(JSON.stringify(payload))} }); document.dispatchEvent(ev); window.dispatchEvent(ev); })(); true;`;
    webRef.current?.injectJavaScript(js);
  };

  const onSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await geocodeAddress(query.trim());
      if (!result) {
        Alert.alert('Табылмады', 'Мекенжай табылмады');
        return;
      }
      setAddress(result.address);
      setLat(result.lat);
      setLng(result.lng);
      sendToMap({ type: 'setView', lat: result.lat, lng: result.lng, zoom: 16 });
    } catch {
      Alert.alert('Қате', 'Іздеу кезінде қате пайда болды');
    } finally {
      setLoading(false);
    }
  };

  const onMapMessage = async (event: any) => {
    let msg: any;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (!msg || msg.type !== 'pick') return;
    const nextLat = Number(msg.lat);
    const nextLng = Number(msg.lng);
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return;
    setLat(nextLat);
    setLng(nextLng);
    setLoading(true);
    try {
      const resolved = await reverseGeocode(nextLat, nextLng);
      setAddress(resolved);
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = () => {
    const finalAddress = address.trim() || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    route.params.onConfirm(finalAddress, lat, lng);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html: initialHtml }}
        style={StyleSheet.absoluteFill}
        onMessage={onMapMessage}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
      />

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Мекенжайды іздеңіз"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        <TouchableOpacity onPress={onSearch} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Іздеу</Text>
        </TouchableOpacity>
      </View>

      {!!address && (
        <View style={styles.addressChip}>
          <Text numberOfLines={2} style={styles.addressText}>{address}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
        <Text style={styles.confirmText}>Растастау</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#4AB7B6" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchWrap: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#1E293B',
  },
  searchButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4AB7B6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  addressChip: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addressText: {
    color: '#1E293B',
    fontSize: 14,
  },
  confirmButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 16,
    backgroundColor: '#4AB7B6',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
