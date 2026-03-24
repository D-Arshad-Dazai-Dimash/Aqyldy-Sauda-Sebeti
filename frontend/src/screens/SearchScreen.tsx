import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FilterModal } from '../components/FilterModal';
import { useFavoritesStore } from '../store/favoritesStore';
import * as ProductsApi from '../api/products';
import * as StoresApi from '../api/stores';
import type { Product, Store } from '../types/api';

// @ts-ignore
import VerifiedIcon from '../assets/icons/verified.svg';

const HISTORY_KEY = 'search:history';

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  // Filter state
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);

  // Load search history and stores on mount
  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) setHistory(JSON.parse(raw));
    });
    StoresApi.getStores().then(setStores).catch(() => {});
  }, []);

  // Search with debounce
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setProducts([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, priceRange, selectedStores]);

  const performSearch = async (q: string) => {
    setLoading(true);
    try {
      const result = await ProductsApi.searchProducts({ q, active: true, size: 40 });
      // Client-side price filter (backend doesn't have price filter yet)
      let filtered = result.content.filter(
        (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
      );
      setProducts(filtered);

      // Save to history
      const updated = [q, ...history.filter((h) => h !== q)].slice(0, 10);
      setHistory(updated);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated)).catch(() => {});
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStore = (store: string) => {
    setSelectedStores((prev) =>
      prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]
    );
  };

  const removeHistoryItem = (item: string) => {
    const updated = history.filter((h) => h !== item);
    setHistory(updated);
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated)).catch(() => {});
  };

  const clearHistory = () => {
    setHistory([]);
    AsyncStorage.removeItem(HISTORY_KEY).catch(() => {});
  };

  const selectHistoryItem = (item: string) => {
    setSearchQuery(item);
  };

  const formatPrice = (price: number) => `${Math.round(price)} \u20B8`;

  const renderSearchResults = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4AB7B6" />
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>Nothing found</Text>
        </View>
      );
    }

    // Group products — for now show a flat grid since we don't have per-store search yet
    return (
      <ScrollView style={styles.resultsBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultCount}>{products.length} products found</Text>
        <View style={styles.productGrid}>
          {products.map((product) => {
            const isFav = isFavorite(product.id);
            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ProductScreen', { productId: product.id })}
              >
                <TouchableOpacity
                  style={styles.favoriteBtn}
                  onPress={() => toggleFavorite(product.id)}
                >
                  <Image
                    source={
                      isFav
                        ? require('../assets/icons/heart.png')
                        : require('../assets/icons/love.png')
                    }
                    style={styles.heartIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <View style={styles.imageWrapper}>
                  {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Feather name="package" size={30} color="#CBD5E1" />
                    </View>
                  )}
                </View>

                <Text style={styles.productName} numberOfLines={2}>{product.title}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Show stores the user can browse */}
        {stores.length > 0 && (
          <View style={styles.storesSection}>
            <Text style={styles.storesSectionTitle}>Browse stores</Text>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={styles.storeCard}
                onPress={() => navigation.navigate('StoreScreen', { storeId: store.id })}
              >
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeAddress}>{store.address}</Text>
                </View>
                <Feather name="chevron-right" size={24} color="#64748B" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={32} color="#000" />
        </TouchableOpacity>

        <View style={styles.activeSearchInputContainer}>
          <Feather name="search" size={20} color="#000" style={styles.searchIcon} />
          <TextInput
            autoFocus
            placeholder="Search products..."
            style={styles.activeSearchInput}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setIsFilterVisible(true)} style={{ marginLeft: 8 }}>
            <Feather name="sliders" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {searchQuery.length > 0 ? (
        renderSearchResults()
      ) : (
        <View style={styles.searchBody}>
          <View style={styles.historyTitleRow}>
            <Text style={styles.historyTitle}>Recent searches</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearAllText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.historyTags}>
            {history.map((item, index) => (
              <TouchableOpacity key={index} style={styles.tag} onPress={() => selectHistoryItem(item)}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => removeHistoryItem(item)}>
                  <Feather name="x" size={16} color="#94A3B8" style={styles.xIcon} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick store links */}
          {stores.length > 0 && (
            <View style={styles.quickStores}>
              <Text style={styles.quickStoresTitle}>Stores</Text>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.storeCard}
                  onPress={() => navigation.navigate('StoreScreen', { storeId: store.id })}
                >
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <Text style={styles.storeAddress}>{store.address}</Text>
                  </View>
                  <Feather name="chevron-right" size={24} color="#64748B" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      <FilterModal
        isVisible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedStores={selectedStores}
        toggleStore={toggleStore}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 10,
  },
  backBtn: { marginRight: 10 },
  activeSearchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00449C',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: { marginRight: 10 },
  activeSearchInput: { flex: 1, fontSize: 16, color: '#000', fontWeight: '500', paddingVertical: 0 },

  searchBody: { paddingHorizontal: 25, marginTop: 30 },
  historyTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  historyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  clearAllText: { color: '#00449C', fontWeight: '600', fontSize: 14 },
  historyTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  tagText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  xIcon: { marginLeft: 8 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#94A3B8', marginTop: 12 },

  resultsBody: { paddingHorizontal: 20, marginTop: 15 },
  resultCount: { fontSize: 14, color: '#64748B', marginBottom: 15 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: '#FFF',
    padding: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    position: 'relative',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 3,
  },
  heartIcon: { width: 22, height: 22 },
  imageWrapper: { height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  productImage: { width: '100%', height: '100%' },
  placeholderImage: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 12, color: '#1E293B', fontWeight: '500', marginBottom: 4 },
  productPrice: { fontSize: 14, color: '#4AB7B6', fontWeight: '700' },

  storesSection: { marginTop: 30, marginBottom: 40 },
  storesSectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 15 },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginBottom: 10,
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  storeAddress: { fontSize: 13, color: '#64748B', marginTop: 2 },

  quickStores: { marginTop: 30 },
  quickStoresTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 15 },
});
