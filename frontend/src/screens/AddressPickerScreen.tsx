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
import MapView, { Marker, Region } from 'react-native-maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { GOOGLE_MAPS_API_KEY } from '../config/api';

type Props = NativeStackScreenProps<RootStackParamList, 'AddressPicker'>;

const DEFAULT_REGION: Region = {
  latitude: 51.1694,
  longitude: 71.4491,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

async function geocodeAddress(query: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  const first = json?.results?.[0];
  if (!first) return null;
  return {
    address: first.formatted_address as string,
    lat: first.geometry.location.lat as number,
    lng: first.geometry.location.lng as number,
  };
}

async function reverseGeocode(lat: number, lng: number) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  return (json?.results?.[0]?.formatted_address as string) || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export default function AddressPickerScreen({ navigation, route }: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(DEFAULT_REGION.latitude);
  const [lng, setLng] = useState(DEFAULT_REGION.longitude);

  const region = useMemo<Region>(() => ({
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  }), [lat, lng]);

  const onSearch = async () => {
    if (!query.trim()) return;
    if (!GOOGLE_MAPS_API_KEY) {
      Alert.alert('API кілті', 'GOOGLE_MAPS_API_KEY толтырылмаған');
      return;
    }
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
      mapRef.current?.animateToRegion(
        {
          latitude: result.lat,
          longitude: result.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        450
      );
    } catch {
      Alert.alert('Қате', 'Іздеу кезінде қате пайда болды');
    } finally {
      setLoading(false);
    }
  };

  const onMapPress = async (event: any) => {
    const nextLat = event.nativeEvent.coordinate.latitude as number;
    const nextLng = event.nativeEvent.coordinate.longitude as number;
    setLat(nextLat);
    setLng(nextLng);
    mapRef.current?.animateToRegion(
      {
        latitude: nextLat,
        longitude: nextLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      350
    );

    if (!GOOGLE_MAPS_API_KEY) {
      setAddress(`${nextLat.toFixed(6)}, ${nextLng.toFixed(6)}`);
      return;
    }

    setLoading(true);
    try {
      const resolved = await reverseGeocode(nextLat, nextLng);
      setAddress(resolved);
    } catch {
      setAddress(`${nextLat.toFixed(6)}, ${nextLng.toFixed(6)}`);
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
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} region={region} onPress={onMapPress}>
        <Marker coordinate={{ latitude: lat, longitude: lng }} />
      </MapView>

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
