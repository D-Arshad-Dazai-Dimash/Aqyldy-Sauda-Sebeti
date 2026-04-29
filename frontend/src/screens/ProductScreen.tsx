import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Pressable,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import Geolocation from '@react-native-community/geolocation';
import { useFavoritesStore } from '../store/favoritesStore';
import { useCartStore } from '../store/cartStore';
import { api } from '../api/client';
import { productImageSource } from '../components/ProductImage';
import { getNearbyStores } from '../api/stores';
import { getPriceInsight } from '../api/priceInsights';
import { getFrequentlyBoughtTogether } from '../api/recommendations';
import type { Store } from '../types/api';
import type { PriceInsight, RecommendedProduct } from '../types/api';
import SkeletonBlock from '../components/SkeletonBlock';

const P = {
  bg: '#F7F8FC', surface: '#FFFFFF', navy: '#0F172A', ink: '#1E293B',
  muted: '#64748B', faint: '#CBD5E1', border: '#E2E8F0',
  teal: '#0EA5E9', tealL: '#E0F2FE', rose: '#F43F5E', roseL: '#FFE4E6',
  emerald: '#10B981', emeraldL: '#D1FAE5', amber: '#F59E0B', amberL: '#FEF3C7',
};

function PressCard({ children, onPress, style }: any) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      onPress={onPress}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function ProductScreen({ route, navigation }: any) {
  const { productId, storeId: routeStoreId } = route.params;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [priceInsight, setPriceInsight] = useState<PriceInsight | null>(null);
  const [related, setRelated] = useState<RecommendedProduct[]>([]);

  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { addItem, storeId: cartStoreId } = useCartStore();
  const storeId = routeStoreId || cartStoreId;

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Орналасқан жер рұқсаты',
        message: 'Жақын дүкенді табу үшін орналасқан жерге рұқсат қажет',
        buttonPositive: 'Рұқсат беру',
        buttonNegative: 'Бас тарту',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const getCurrentPosition = () =>
    new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });

  const resolveNearestStore = async (): Promise<Store | null> => {
    const allowed = await requestLocationPermission();
    if (!allowed) return null;

    const { latitude, longitude } = await getCurrentPosition();
    const nearby = await getNearbyStores(latitude, longitude, 5000);
    return nearby[0] ?? null;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await api.get(`/api/products/${productId}`);
        setProduct(res.data);
      } catch {
        setLoadError('Тауарды жүктеу мүмкін болмады');
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
    try {
      let effectiveStoreId = storeId;
      if (!effectiveStoreId) {
        setCartMessage('Жақын дүкен ізделуде...');
        const nearest = await resolveNearestStore();
        if (!nearest) {
          setCartMessage('Алдымен дүкенді таңдаңыз');
          setTimeout(() => setCartMessage(''), 2500);
          return;
        }
        effectiveStoreId = nearest.id;
      }

      setAddingToCart(true);
      setCartMessage('Себет жаңартылып жатыр...');
      await addItem(effectiveStoreId, productId, 1, {
        productId,
        productTitle: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
      });
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Feather name="chevron-left" size={24} color={P.ink} />
            </TouchableOpacity>
            <SkeletonBlock width="45%" height={16} />
            <SkeletonBlock width={36} height={36} borderRadius={12} />
          </View>
          <SkeletonBlock height={280} style={{ margin: 18, borderRadius: 24 }} />
          <View style={styles.infoCard}>
            <SkeletonBlock height={22} style={{ marginBottom: 12 }} />
            <SkeletonBlock width="40%" height={28} style={{ marginBottom: 18 }} />
            <SkeletonBlock height={80} borderRadius={14} style={{ marginBottom: 14 }} />
            <SkeletonBlock height={15} style={{ marginBottom: 8 }} />
            <SkeletonBlock width="80%" height={15} style={{ marginBottom: 8 }} />
            <SkeletonBlock width="60%" height={15} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Feather name="alert-circle" size={32} color={P.rose} />
          </View>
          <Text style={styles.errorText}>{loadError || 'Тауар табылмады'}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.replace('ProductScreen', { productId, storeId })}
          >
            <Text style={styles.retryText}>Қайта көру</Text>
          </TouchableOpacity>
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
      <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color={P.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.title}</Text>
        <TouchableOpacity onPress={() => toggleFavorite(product.id)} style={styles.iconBtn}>
          <Feather name="heart" size={20} color={isFav ? P.rose : P.faint} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* IMAGE HERO */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.imageHero}>
          {product.discount ? (
            <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{product.discount}%</Text>
            </Animated.View>
          ) : null}
          <Image
            source={productImageSource({ uri: product.imageUrl, title: product.title })}
            style={styles.productImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* INFO CARD */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.infoCard}>
          <Text style={styles.productTitle}>{product.title}</Text>

          {/* PRICE */}
          <View style={styles.priceRow}>
            {discountedPrice ? (
              <>
                <Text style={styles.discountedPrice}>{discountedPrice.toFixed(0)} ₸</Text>
                <Text style={styles.originalPrice}>{product.price} ₸</Text>
              </>
            ) : (
              <Text style={styles.price}>{product.price} ₸</Text>
            )}
          </View>

          {/* STOCK */}
          <View style={[styles.stockRow, { backgroundColor: product.active && product.stock > 0 ? P.emeraldL : P.roseL }]}>
            <Feather
              name={product.active && product.stock > 0 ? 'check-circle' : 'x-circle'}
              size={16}
              color={product.active && product.stock > 0 ? P.emerald : P.rose}
            />
            <Text style={[styles.stockText, { color: product.active && product.stock > 0 ? P.emerald : P.rose }]}>
              {product.active && product.stock > 0
                ? `Қоймада бар · ${product.stock} дана`
                : 'Қоймада жоқ'}
            </Text>
          </View>
        </Animated.View>

        {/* AI PRICE INSIGHT */}
        {priceInsight && priceInsight.history.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={styles.aiBadge}>
                <Feather name="cpu" size={11} color="#FFF" />
                <Text style={styles.aiBadgeText}>AI БАҒА</Text>
              </View>
              {priceInsight.goodDeal && (
                <View style={styles.goodDealBadge}>
                  <Feather name="trending-down" size={13} color={P.emerald} />
                  <Text style={styles.goodDealText}>Тиімді баға!</Text>
                </View>
              )}
            </View>
            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Орташа</Text>
                <Text style={styles.insightValue}>{priceInsight.averagePrice.toFixed(0)} ₸</Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Ең төмен</Text>
                <Text style={styles.insightValue}>{priceInsight.lowestPrice.toFixed(0)} ₸</Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Тренд</Text>
                <View style={styles.trendRow}>
                  <Feather
                    name={priceInsight.trend === 'UP' ? 'trending-up' : priceInsight.trend === 'DOWN' ? 'trending-down' : 'minus'}
                    size={14}
                    color={priceInsight.trend === 'UP' ? P.rose : priceInsight.trend === 'DOWN' ? P.emerald : P.faint}
                  />
                  <Text style={[styles.trendText, {
                    color: priceInsight.trend === 'UP' ? P.rose : priceInsight.trend === 'DOWN' ? P.emerald : P.faint,
                  }]}>
                    {priceInsight.changePercentage > 0 ? '+' : ''}{priceInsight.changePercentage}%
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* DESCRIPTION */}
        {product.description ? (
          <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.section}>
            <Text style={styles.sectionLabel}>Сипаттамасы</Text>
            <Text style={styles.description}>{product.description}</Text>
          </Animated.View>
        ) : null}

        {/* DETAILS */}
        {(product.unit || product.weight || product.barcode) ? (
          <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.detailsCard}>
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
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailKey}>Штрих-код</Text>
                <Text style={styles.detailValue}>{product.barcode}</Text>
              </View>
            ) : null}
          </Animated.View>
        ) : null}

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <View style={styles.relatedAiBadge}>
                <Feather name="cpu" size={12} color="#FFF" />
              </View>
              <Text style={styles.relatedTitle}>Бірге сатып алатындар</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScroll}
            >
              {related.map((item, idx) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(320 + idx * 50).springify()}>
                  <PressCard
                    style={styles.relatedCard}
                    onPress={() => navigation.push('ProductScreen', { productId: item.id, storeId })}
                  >
                    <Image
                      source={productImageSource({ uri: item.imageUrl, title: item.title })}
                      style={styles.relatedImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.relatedName} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.relatedPrice}>{item.price} ₸</Text>
                  </PressCard>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>

      {/* FOOTER — ADD TO CART */}
      <View style={styles.footer}>
        {cartMessage ? (
          <Animated.Text entering={FadeIn.duration(200)} style={styles.cartMessage}>
            {cartMessage}
          </Animated.Text>
        ) : null}

        <TouchableOpacity
          style={styles.chooseStoreBtn}
          onPress={() => navigation.navigate('Map')}
          activeOpacity={0.85}
        >
          <Feather name="map-pin" size={16} color={P.teal} />
          <Text style={styles.chooseStoreText}>
            {storeId ? 'Басқа дүкенді көру' : 'Дүкен таңдау'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addToCartBtn, (!product.active || product.stock === 0) && styles.disabledBtn]}
          onPress={handleAddToCart}
          disabled={addingToCart || !product.active || product.stock === 0}
          activeOpacity={0.85}
        >
          {addingToCart
            ? <ActivityIndicator size="small" color="#FFF" />
            : (
              <>
                <Feather name="shopping-cart" size={20} color="#FFF" />
                <Text style={styles.addToCartText}>Себетке қосу</Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
    paddingTop: 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: P.roseL, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  errorText: { color: P.muted, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: P.teal, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14,
  },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 4 : (StatusBar.currentHeight ?? 0) + 6,
    paddingBottom: 8,
    backgroundColor: P.bg,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: P.ink, flex: 1, marginHorizontal: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: P.surface, borderWidth: 1, borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  scrollContent: { paddingBottom: 130 },

  // Image hero
  imageHero: {
    backgroundColor: P.surface,
    marginHorizontal: 14,
    marginTop: 2,
    borderRadius: 22,
    height: 252,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  discountBadge: {
    position: 'absolute', top: 14, right: 14, zIndex: 5,
    backgroundColor: P.rose, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  discountBadgeText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  productImage: { width: '75%', height: '75%' },

  // Info card
  infoCard: {
    backgroundColor: P.surface,
    borderRadius: 20,
    marginHorizontal: 14,
    marginTop: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  productTitle: { fontSize: 18, fontWeight: '800', color: P.ink, letterSpacing: -0.25, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  price: { fontSize: 24, fontWeight: '800', color: P.teal },
  discountedPrice: { fontSize: 24, fontWeight: '800', color: P.teal },
  originalPrice: { fontSize: 16, color: P.faint, textDecorationLine: 'line-through' },
  stockRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  stockText: { fontSize: 13, fontWeight: '600' },

  // AI Insight
  insightCard: {
    backgroundColor: P.navy,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    shadowColor: P.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: P.teal, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  goodDealBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: P.emeraldL, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  goodDealText: { fontSize: 12, fontWeight: '700', color: P.emerald },
  insightRow: { flexDirection: 'row', alignItems: 'center' },
  insightItem: { flex: 1, alignItems: 'center' },
  insightDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  insightLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase' },
  insightValue: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText: { fontSize: 14, fontWeight: '700' },

  // Description
  section: {
    backgroundColor: P.surface,
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: P.border,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: P.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  description: { fontSize: 14, color: '#475569', lineHeight: 22 },

  // Details table
  detailsCard: {
    backgroundColor: P.surface,
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: P.border,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: P.border,
  },
  detailKey: { fontSize: 14, color: P.muted },
  detailValue: { fontSize: 14, fontWeight: '700', color: P.ink },

  // Related
  relatedSection: { marginTop: 20 },
  relatedHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, marginBottom: 14,
  },
  relatedAiBadge: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: P.teal, justifyContent: 'center', alignItems: 'center',
  },
  relatedTitle: { fontSize: 15, fontWeight: '800', color: P.ink },
  relatedScroll: { paddingHorizontal: 18, paddingVertical: 8, gap: 10 },
  relatedCard: {
    width: 130,
    backgroundColor: P.surface,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  relatedImage: { width: '100%', height: 80, borderRadius: 10, marginBottom: 8 },
  relatedName: { fontSize: 11, fontWeight: '600', color: P.ink, marginBottom: 5, lineHeight: 16 },
  relatedPrice: { fontSize: 13, fontWeight: '800', color: P.teal },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: P.surface,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  cartMessage: {
    textAlign: 'center', color: P.teal, fontWeight: '600',
    fontSize: 13, marginBottom: 8,
  },
  chooseStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 14,
    paddingVertical: 11,
    marginBottom: 10,
    backgroundColor: P.surface,
  },
  chooseStoreText: { color: P.teal, fontSize: 14, fontWeight: '700' },
  addToCartBtn: {
    backgroundColor: P.teal,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 10,
    shadowColor: P.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledBtn: {
    backgroundColor: P.faint,
    shadowColor: 'transparent',
    elevation: 0,
  },
  addToCartText: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  skeletonSpacing: { marginBottom: 12 },
});
