import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Collapsible from 'react-native-collapsible';
import { useFavoritesStore } from '../store/favoritesStore';
import { useCartStore } from '../store/cartStore';
import * as StoresApi from '../api/stores';
import type { Store, InventoryItem } from '../types/api';
// @ts-ignore
import VerifiedIcon from '../assets/icons/verified.svg';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 20;
const COLUMN_SPACING = 15;
const ITEM_WIDTH = (width - (SCREEN_PADDING * 2) - COLUMN_SPACING) / 2;

export default function StoreScreen({ route, navigation }: any) {
  const storeId: string = route.params?.storeId;
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [storeData, productsData] = await Promise.all([
        StoresApi.getStore(storeId),
        StoresApi.getStoreProducts(storeId),
      ]);
      setStore(storeData);
      setProducts(productsData);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addItem(storeId, productId);
    } catch {}
  };

  const formatPrice = (price: number) => `${Math.round(price)} \u20B8`;

  const renderProductItem = ({ item }: { item: InventoryItem }) => {
    const isFav = isFavorite(item.productId);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.productGridItem}
        onPress={() => navigation.navigate('ProductScreen', {
          productId: item.productId,
          storeId,
        })}
      >
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => toggleFavorite(item.productId)}
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
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productGridImage} resizeMode="contain" />
          ) : (
            <Image source={require('../assets/p1.png')} style={styles.productGridImage} resizeMode="contain" />
          )}
        </View>

        <View style={styles.productTextContainer}>
          <Text style={styles.productGridTitle} numberOfLines={2}>
            {item.productTitle}
          </Text>
          <Text style={styles.productGridPrice}>{formatPrice(item.price)}</Text>
        </View>

        <TouchableOpacity style={styles.addToCartBtn} onPress={() => handleAddToCart(item.productId)}>
          <Feather name="plus" size={18} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4AB7B6" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="chevron-left" size={32} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Store not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={32} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Search')}>
          <Feather name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* STORE INFO */}
        <View style={styles.storeInfoRow}>
          <View style={styles.storeTextCol}>
            <View style={styles.storeNameContainer}>
              <Text style={styles.storeNameText}>{store.name}</Text>
              <VerifiedIcon width={30} height={30} style={styles.verifyIcon} />
            </View>
            <Text style={styles.storeTypeText}>Supermarket</Text>
            <Text style={styles.storeAddressText}>{store.address}</Text>
          </View>
        </View>

        {/* ABOUT SECTION */}
        <View style={styles.aboutStoreSection}>
          <TouchableOpacity
            style={styles.aboutHeader}
            onPress={() => setIsAboutExpanded(!isAboutExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.aboutHeaderText}>Details</Text>
            <Feather
              name={isAboutExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#000"
            />
          </TouchableOpacity>
          <Collapsible collapsed={!isAboutExpanded} align="center">
            <View style={styles.aboutStoreBody}>
              <Text style={styles.aboutStoreContent}>
                {store.address}
              </Text>
              <Text style={styles.productCountText}>{products.length} products available</Text>
            </View>
          </Collapsible>
        </View>

        {/* PRODUCTS GRID */}
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No products available</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.productId}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            scrollEnabled={false}
            contentContainerStyle={styles.productGridContainer}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 60 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconBtn: { padding: 5 },
  scrollContent: { paddingHorizontal: SCREEN_PADDING, paddingTop: 10, paddingBottom: 40 },
  storeInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  storeTextCol: { flex: 1, marginRight: 20 },
  storeNameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  storeNameText: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginRight: 8 },
  verifyIcon: { marginTop: 4 },
  storeTypeText: { fontSize: 16, color: '#64748B', marginBottom: 2 },
  storeAddressText: { fontSize: 16, color: '#1E293B', fontWeight: '600' },
  aboutStoreSection: { marginBottom: 30 },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aboutHeaderText: { fontSize: 16, color: '#000', fontWeight: '700', marginRight: 5 },
  aboutStoreBody: { padding: 15, backgroundColor: '#F8FAFC', borderRadius: 15 },
  aboutStoreContent: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  productCountText: { fontSize: 14, color: '#4AB7B6', fontWeight: '600', marginTop: 8 },

  productRow: { justifyContent: 'space-between' },
  productGridContainer: { paddingTop: 10 },
  productGridItem: {
    width: ITEM_WIDTH,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 15,
    marginBottom: COLUMN_SPACING,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  productGridImage: { width: '100%', height: '100%' },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 3,
  },
  heartIcon: { width: 22, height: 22 },
  productTextContainer: { alignItems: 'center', width: '100%' },
  productGridTitle: { fontSize: 12, color: '#1E293B', fontWeight: '500', textAlign: 'center', marginBottom: 2 },
  productGridPrice: { fontSize: 14, color: '#4AB7B6', fontWeight: '700' },
  addToCartBtn: {
    backgroundColor: '#4AB7B6',
    borderRadius: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#EF4444', marginBottom: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: '#4AB7B6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  retryBtnText: { color: '#FFF', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#94A3B8', marginTop: 12 },
});
