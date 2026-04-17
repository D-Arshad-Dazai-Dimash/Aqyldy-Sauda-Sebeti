import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { getStores } from '../api/stores';
import type { Store } from '../types/api';

export default function MapScreen({ navigation }: any) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStores();
      setStores(data || []);
    } catch {
      setError('Дүкендерді жүктеу мүмкін болмады');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const mapPins = useMemo(() => stores.slice(0, 8), [stores]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Дүкендер картасы</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>Қала картасы</Text>
        <Text style={styles.mapSub}>Жақын дүкендер белгіленген</Text>
        <View style={styles.mapCanvas}>
          {mapPins.map((store, idx) => {
            const left = 10 + ((idx * 29) % 75);
            const top = 12 + ((idx * 17) % 70);
            return (
              <TouchableOpacity
                key={store.id}
                style={[styles.pin, { left: `${left}%`, top: `${top}%` }]}
                onPress={() => navigation.navigate('StoreScreen', { storeId: store.id })}
              >
                <Feather name="map-pin" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 24 }} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadStores}>
            <Text style={styles.retryText}>Қайта көру</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.storeCard}
              onPress={() => navigation.navigate('StoreScreen', { storeId: item.id })}
            >
              <View style={styles.storeLeft}>
                <Feather name="shopping-bag" size={18} color="#0EA5E9" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.storeName}>{item.name}</Text>
                  <Text style={styles.storeAddress}>{item.address || 'Мекенжай көрсетілмеген'}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  mapCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  mapTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  mapSub: { fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 10 },
  mapCanvas: {
    height: 220,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    overflow: 'hidden',
  },
  pin: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 16, paddingBottom: 110 },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  storeName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  storeAddress: { fontSize: 12, color: '#64748B', marginTop: 2 },
  errorWrap: { alignItems: 'center', marginTop: 24 },
  errorText: { color: '#EF4444', fontWeight: '600', marginBottom: 10 },
  retryBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: '#FFF', fontWeight: '700' },
});
