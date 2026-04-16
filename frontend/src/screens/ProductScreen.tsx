import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useFavoritesStore } from '../store/favoritesStore';
import { useCartStore } from '../store/cartStore';
import { api } from '../api/client';
import RecommendationsSection from '../components/RecommendationsSection';
import PriceTrendSection from '../components/PriceTrendSection';
import { getPriceInsight } from '../api/priceInsights';
import { getFrequentlyBoughtTogether } from '../api/recommendations';
import type { PriceInsight, RecommendedProduct } from '../types/api';

export default function ProductScreen({ route, navigation }: any) {
  const { productId, storeId: routeStoreId } = route.params;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [priceInsight, setPriceInsight] = useState<PriceInsight | null>(null);
  const [related, setRelated] = useState<RecommendedProduct[]>([]);

  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { addItem, storeId: cartStoreId } = useCartStore();
  const storeId = routeStoreId || cartStoreId;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/products/${productId}`);
        setProduct(res.data);
      } catch (error) {
        console.log('Тауарды жүктеу мүмкін болмады:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();

    // Load AI features in parallel (non-blocking)
    getPriceInsight(productId).then(setPriceInsight).catch(() => {});
    getFrequentlyBoughtTogether(productId, 6).then(setRelated).catch(() => {});
  }, [productId]);

  const handleAddToCart = async () => {
    if (!storeId) {
      setCartMessage('Алдымен дүкенді таңдаңыз');
      return;
    }
    try {
      setAddingToCart(true);
      await addItem(storeId, productId, 1);
      setCartMessage('Себетке қосылды!');
    } catch {
      setCartMessage('Себетке қосу мүмкін болмады');
    } finally {
      setAddingToCart(false);
      setTimeout(() => setCartMessage(''), 2500);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4AB7B6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Тауар табылмады</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFav = isFavorite(product.id);
  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount) / 100
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={30} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.title}</Text>
        <TouchableOpacity onPress={() => toggleFavorite(product.id)} style={styles.iconBtn}>
          <Feather name="heart" size={24} color={isFav ? '#EF4444' : '#CBD5E1'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* IMAGE */}
        <View style={styles.imageContainer}>
          <Image
            source={product.imageUrl ? { uri: product.imageUrl } : require('../assets/p1.png')}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* INFO */}
        <View style={styles.infoCard}>
          <Text style={styles.productTitle}>{product.title}</Text>

          {/* PRICE */}
          <View style={styles.priceRow}>
            {discountedPrice ? (
              <>
                <Text style={styles.discountedPrice}>{discountedPrice.toFixed(0)} ₸</Text>
                <Text style={styles.originalPrice}>{product.price} ₸</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{product.discount}%</Text>
                </View>
              </>
            ) : (
              <Text style={styles.price}>{product.price} ₸</Text>
            )}
          </View>

          {/* AI PRICE INSIGHT */}
          {priceInsight && priceInsight.history.length > 0 && (
            <View style={styles.insightContainer}>
              {priceInsight.goodDeal && (
                <View style={styles.goodDealBadge}>
                  <Feather name="trending-down" size={14} color="#166534" />
                  <Text style={styles.goodDealText}>Тиімді баға!</Text>
                </View>
              )}
              <View style={styles.insightRow}>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Орташа</Text>
                  <Text style={styles.insightValue}>{priceInsight.averagePrice.toFixed(0)} ₸</Text>
                </View>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Ең төмен</Text>
                  <Text style={styles.insightValue}>{priceInsight.lowestPrice.toFixed(0)} ₸</Text>
                </View>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Тренд</Text>
                  <View style={styles.trendRow}>
                    <Feather
                      name={priceInsight.trend === 'UP' ? 'trending-up' : priceInsight.trend === 'DOWN' ? 'trending-down' : 'minus'}
                      size={14}
                      color={priceInsight.trend === 'UP' ? '#EF4444' : priceInsight.trend === 'DOWN' ? '#22C55E' : '#94A3B8'}
                    />
                    <Text style={[
                      styles.trendText,
                      { color: priceInsight.trend === 'UP' ? '#EF4444' : priceInsight.trend === 'DOWN' ? '#22C55E' : '#94A3B8' }
                    ]}>
                      {priceInsight.changePercentage > 0 ? '+' : ''}{priceInsight.changePercentage}%
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.insightAiBadge}>
                <Feather name="cpu" size={10} color="#4AB7B6" />
                <Text style={styles.insightAiText}>AI баға талдауы</Text>
              </View>
            </View>
          )}

          {/* DESCRIPTION */}
          {product.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Сипаттамасы</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          ) : null}

          {/* DETAILS */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Мәліметтер</Text>
            {product.unit ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Өлшем бірлігі</Text>
                <Text style={styles.detailValue}>{product.unit}</Text>
              </View>
            ) : null}
            {product.weight ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Салмағы</Text>
                <Text style={styles.detailValue}>{product.weight}</Text>
              </View>
            ) : null}
            {product.barcode ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Штрих-код</Text>
                <Text style={styles.detailValue}>{product.barcode}</Text>
              </View>
            ) : null}
          </View>

          {/* STOCK */}
          <View style={styles.stockRow}>
            <Feather
              name={product.active && product.stock > 0 ? 'check-circle' : 'x-circle'}
              size={18}
              color={product.active && product.stock > 0 ? '#22C55E' : '#EF4444'}
            />
            <Text style={[styles.stockText, { color: product.active && product.stock > 0 ? '#22C55E' : '#EF4444' }]}>
              {product.active && product.stock > 0 ? `Қоймада бар (${product.stock} дана)` : 'Қоймада жоқ'}
            </Text>
          </View>
        </View>

        {/* AI: FREQUENTLY BOUGHT TOGETHER */}
        {related.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Feather name="cpu" size={14} color="#4AB7B6" />
              <Text style={styles.relatedTitle}>Бірге сатып алатындар</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
              {related.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.relatedCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.push('ProductScreen', { productId: item.id, storeId })}
                >
                  <Image
                    source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/p1.png')}
                    style={styles.relatedImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.relatedName} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.relatedPrice}>{item.price} ₸</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ADD TO CART */}
      <View style={styles.footer}>
        {cartMessage ? (
          <Text style={styles.cartMessage}>{cartMessage}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.addToCartBtn, (!product.active || product.stock === 0) && styles.disabledBtn]}
          onPress={handleAddToCart}
          disabled={addingToCart || !product.active || product.stock === 0}
          activeOpacity={0.8}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Feather name="shopping-cart" size={20} color="#FFF" />
              <Text style={styles.addToCartText}>Себетке қосу</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#94A3B8', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1E293B', flex: 1, marginHorizontal: 10 },
  iconBtn: { padding: 5 },
  scrollContent: { paddingBottom: 120 },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: { width: '80%', height: '80%' },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  productTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 10 },
  price: { fontSize: 24, fontWeight: '800', color: '#4AB7B6' },
  discountedPrice: { fontSize: 24, fontWeight: '800', color: '#4AB7B6' },
  originalPrice: { fontSize: 16, color: '#94A3B8', textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  discountText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: 14, color: '#475569', lineHeight: 22 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailKey: { fontSize: 14, color: '#64748B' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  stockText: { fontSize: 14, fontWeight: '500' },

  // AI Price Insight
  insightContainer: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  goodDealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 8,
  },
  goodDealText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between' },
  insightItem: { alignItems: 'center', flex: 1 },
  insightLabel: { fontSize: 10, color: '#64748B', marginBottom: 2, textTransform: 'uppercase' },
  insightValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText: { fontSize: 13, fontWeight: '700' },
  insightAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  insightAiText: { fontSize: 10, color: '#4AB7B6', fontWeight: '500' },

  // Related Products
  relatedSection: {
    marginHorizontal: 15,
    marginTop: 16,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  relatedTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  relatedScroll: { gap: 10, paddingRight: 15 },
  relatedCard: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  relatedImage: { width: '100%', height: 70, borderRadius: 8, marginBottom: 6 },
  relatedName: { fontSize: 11, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  relatedPrice: { fontSize: 13, fontWeight: '800', color: '#4AB7B6' },

  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 10,
  },
  cartMessage: { textAlign: 'center', color: '#4AB7B6', fontWeight: '500', marginBottom: 8 },
  addToCartBtn: {
    backgroundColor: '#4AB7B6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  disabledBtn: { backgroundColor: '#CBD5E1' },
  addToCartText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
