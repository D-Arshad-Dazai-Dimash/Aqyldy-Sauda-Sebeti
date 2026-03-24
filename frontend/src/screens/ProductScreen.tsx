import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useFavoritesStore } from '../store/favoritesStore';
import { useCartStore } from '../store/cartStore';
import * as ProductsApi from '../api/products';
import type { Product } from '../types/api';

const { width } = Dimensions.get('window');
const GLOBAL_PADDING = 20;

export default function ProductScreen({ route, navigation }: any) {
  const productId: string | undefined = route.params?.productId;
  const storeId: string | undefined = route.params?.storeId;

  // Support legacy navigation that passes full product object
  const legacyProduct = route.params?.product;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const addItem = useCartStore((s) => s.addItem);

  const id = productId || legacyProduct?.id;
  const isFav = id ? isFavorite(id) : false;

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    } else if (legacyProduct) {
      // Legacy: product object passed directly
      setProduct({
        id: legacyProduct.id,
        title: legacyProduct.name || legacyProduct.title || 'Product',
        description: null,
        price: typeof legacyProduct.price === 'number' ? legacyProduct.price : 0,
        barcode: null,
        stock: 0,
        discount: null,
        imageUrl: null,
        active: true,
        categoryIds: [],
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [productId]);

  const loadProduct = async (pid: string) => {
    setLoading(true);
    try {
      const data = await ProductsApi.getProduct(pid);
      setProduct(data);
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !storeId) {
      Alert.alert('Info', 'Select a store first to add to cart');
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(storeId, product.id);
      Alert.alert('Added!', `${product.title} added to cart`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price: number) => `${Math.round(price)} \u20B8`;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4AB7B6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="chevron-left" size={32} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const discountedPrice = product.discount && product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={32} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => id && toggleFavorite(id)} style={styles.iconBtn}>
          <Image
            source={isFav ? require('../assets/icons/heart.png') : require('../assets/icons/love.png')}
            style={styles.heartIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* PRODUCT IMAGE */}
        <View style={styles.imageSection}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.mainImage} resizeMode="contain" />
          ) : (
            <Image source={require('../assets/p1.png')} style={styles.mainImage} resizeMode="contain" />
          )}
        </View>

        {/* NAME & PRICE */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.title}</Text>
          <View style={styles.priceRow}>
            {discountedPrice ? (
              <>
                <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
                <Text style={styles.productPrice}>{formatPrice(discountedPrice)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{product.discount}%</Text>
                </View>
              </>
            ) : (
              <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            )}
          </View>
          {product.stock > 0 ? (
            <Text style={styles.stockText}>In stock: {product.stock}</Text>
          ) : (
            <Text style={styles.outOfStockText}>Out of stock</Text>
          )}
        </View>

        {/* ADD TO CART BUTTON */}
        <TouchableOpacity
          style={[styles.addBtn, (!product.active || product.stock === 0) && styles.addBtnDisabled]}
          activeOpacity={0.8}
          onPress={handleAddToCart}
          disabled={!product.active || product.stock === 0 || addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.addBtnText}>
              {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
            </Text>
          )}
        </TouchableOpacity>

        {/* DESCRIPTION */}
        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        )}

        {/* BARCODE */}
        {product.barcode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Barcode</Text>
            <Text style={styles.barcodeText}>{product.barcode}</Text>
          </View>
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
    paddingHorizontal: GLOBAL_PADDING,
    height: 60,
  },
  iconBtn: { padding: 5 },
  heartIcon: { width: 28, height: 28 },
  scrollContent: { paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#EF4444' },

  imageSection: {
    marginTop: 20,
    paddingHorizontal: 75,
    alignItems: 'center',
  },
  mainImage: { width: width - 150, height: 220 },

  infoSection: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: GLOBAL_PADDING,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 5,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productPrice: { fontSize: 22, fontWeight: '700', color: '#4AB7B6' },
  originalPrice: { fontSize: 16, color: '#94A3B8', textDecorationLine: 'line-through' },
  discountBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  discountText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  stockText: { fontSize: 13, color: '#27AE60', marginTop: 4 },
  outOfStockText: { fontSize: 13, color: '#EF4444', marginTop: 4 },

  addBtn: {
    backgroundColor: '#4AB7B6',
    marginHorizontal: 60,
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    elevation: 5,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  addBtnDisabled: { backgroundColor: '#CBD5E1' },
  addBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  section: {
    marginTop: 35,
    paddingHorizontal: GLOBAL_PADDING,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  descriptionText: { fontSize: 15, color: '#64748B', lineHeight: 22 },
  barcodeText: { fontSize: 14, color: '#64748B', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
