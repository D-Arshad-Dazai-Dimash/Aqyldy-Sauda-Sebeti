import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { ProductCardImage } from '../components/ProductImage';
import { CartQtyControl } from '../components/CartQtyControl';
import { searchProducts } from '../api/products';
import type { Product } from '../types/api';
import { useI18n } from '../i18n/useI18n';
import { useHeaderLayout } from '../utils/useHeaderLayout';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const P = {
  bg: '#FFF7F0',
  surface: '#FFFFFF',
  text: '#1A1226',
  muted: '#64748B',
  rose: '#E63946',
  roseDeep: '#C1121F',
  roseSoft: '#FFF0F0',
  amber: '#F59E0B',
  amberSoft: '#FFFBEB',
  border: '#FDDCDC',
  teal: '#2BAE9A',
  tealSoft: '#E6FAF7',
};

function ProductCard({ item, onPress, delay }: { item: Product; onPress: () => void; delay: number }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const disc = Number(item.discount ?? 0);
  const price = Number(item.price ?? 0);
  const finalPrice = price - price * disc / 100;

  return (
    <Animated.View style={styles.cardWrap} entering={FadeInDown.delay(delay).duration(320)}>
      <AnimatedTouchableOpacity
        style={[styles.card, anim]}
        activeOpacity={0.9}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 14, stiffness: 240 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 240 }); }}
        onPress={onPress}
      >
        {/* Discount badge */}
        <View style={styles.discBadge}>
          <Feather name="tag" size={9} color="#FFF" />
          <Text style={styles.discText}>-{disc}%</Text>
        </View>

        {/* Image */}
        <ProductCardImage
          uri={item.imageUrl}
          title={item.title}
          containerStyle={styles.imgWrapper}
        />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.oldPrice}>{price.toFixed(0)} ₸</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>
                -{(price * disc / 100).toFixed(0)} ₸
              </Text>
            </View>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.newPrice} numberOfLines={1}>{finalPrice.toFixed(0)} ₸</Text>
          </View>
          <View style={styles.cartRow}>
            <CartQtyControl
              productId={item.id}
              size="sm"
              optimistic={{ productId: item.id, productTitle: item.title, price: finalPrice, imageUrl: item.imageUrl ?? null }}
            />
          </View>
        </View>
      </AnimatedTouchableOpacity>
    </Animated.View>
  );
}

export default function PromotionsScreen({ navigation }: any) {
  const { topPadding, contentTopOffset } = useHeaderLayout();
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const load = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setLoading(true);
      setError('');
      const res = await searchProducts({ active: true, size: 80 });
      const discounted = (res.content ?? []).filter(p => Number(p.discount ?? 0) > 0);
      discounted.sort((a, b) => Number(b.discount ?? 0) - Number(a.discount ?? 0));

      if (!mountedRef.current) return;
      setProducts(discounted);
    } catch {
      if (!mountedRef.current) return;
      setError(t('Жүктелмеді', 'Не удалось загрузить'));
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void load();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(280)} style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={P.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('Акциялар', 'Акции')}</Text>
          {!loading && (
            <Text style={styles.headerSub}>
              {products.length} {t('тауар', 'товаров')}
            </Text>
          )}
        </View>

        <View style={styles.fireBadge}>
          <Text style={styles.fireEmoji}>🔥</Text>
        </View>
      </Animated.View>

      {/* Banner */}
      <Animated.View entering={FadeInDown.delay(60).duration(300)} style={[styles.banner, { marginTop: contentTopOffset }] }>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerEyebrow}>{t('Тек қазір', 'Только сейчас')}</Text>
          <Text style={styles.bannerTitle}>{t('Жасырын жеңілдіктер', 'Горячие скидки')}</Text>
          <Text style={styles.bannerSub}>{t('Қорлары шектеулі', 'Пока не кончились')}</Text>
        </View>
        <View style={styles.bannerBadge}>
          <Feather name="percent" size={28} color={P.rose} />
        </View>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={P.rose} />
          <Text style={styles.loadingText}>{t('Жүктелуде...', 'Загрузка...')}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={52} color="#CBD5E1" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>{t('Қайталау', 'Повторить')}</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Feather name="tag" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>{t('Акциялар жоқ', 'Акций пока нет')}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item, index }) => (
            <ProductCard
              item={item}
              delay={index * 35}
              onPress={() => navigation.navigate('ProductScreen', { productId: item.id })}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.bg },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: P.roseSoft,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '800', color: P.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: P.muted, marginTop: 1 },
  fireBadge: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: P.amberSoft,
    justifyContent: 'center', alignItems: 'center',
  },
  fireEmoji: { fontSize: 20 },

  banner: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: P.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: P.border,
    shadowColor: P.rose,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  bannerLeft: {},
  bannerEyebrow: { fontSize: 11, fontWeight: '700', color: P.rose, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: P.text, letterSpacing: -0.3 },
  bannerSub: { fontSize: 12, color: P.muted, marginTop: 3 },
  bannerBadge: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: P.roseSoft,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: P.border,
  },

  grid: { padding: 12, paddingBottom: 80 },
  row: { gap: 12, marginBottom: 12 },

  cardWrap: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: P.surface,
    borderRadius: 20,
    padding: 12,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: P.border,
  },
  discBadge: {
    position: 'absolute', top: 10, right: 10, zIndex: 2,
    backgroundColor: P.rose,
    borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  discText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  imgWrapper: {
    backgroundColor: P.roseSoft,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  img: { width: '100%', height: 100 },
  info: {},
  name: { fontSize: 13, fontWeight: '600', color: P.text, marginBottom: 6, lineHeight: 18, minHeight: 36 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  oldPrice: { fontSize: 12, color: P.muted, textDecorationLine: 'line-through' },
  saveBadge: {
    backgroundColor: P.amberSoft, borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  saveText: { fontSize: 10, fontWeight: '700', color: P.amber },
  newPrice: { fontSize: 17, fontWeight: '800', color: P.rose, letterSpacing: -0.3 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 4 },
  cartRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 6 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 14, color: P.muted, marginTop: 12 },
  emptyText: { fontSize: 16, color: P.muted, marginTop: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 16, backgroundColor: P.rose,
    paddingVertical: 12, paddingHorizontal: 28,
    borderRadius: 14,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
