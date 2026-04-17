import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
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
import { getPersonalRecommendations, getPopularProducts } from '../api/recommendations';
import type { RecommendedProduct } from '../types/api';
import { useI18n } from '../i18n/useI18n';
import SkeletonBlock from '../components/SkeletonBlock';
import { useHeaderLayout } from '../utils/useHeaderLayout';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const P = {
  bg: '#F0F9FF',
  surface: '#FFFFFF',
  dark: '#0A1628',
  darkCard: '#0D2137',
  text: '#0A1628',
  textLight: '#FFFFFF',
  muted: '#64748B',
  teal: '#2BAE9A',
  tealDark: '#1A7A6E',
  tealSoft: '#E6FAF7',
  tealBorder: '#C0EDE6',
  violet: '#8B5CF6',
  violetSoft: '#EDE9FE',
  amber: '#F59E0B',
  amberSoft: '#FFFBEB',
  border: '#E2EDF5',
};

function ProductCard({
  item,
  onPress,
  delay,
  storeId,
}: {
  item: RecommendedProduct;
  onPress: () => void;
  delay: number;
  storeId?: string;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const disc = Number(item.discount ?? 0);
  const price = Number(item.price ?? 0);
  const finalPrice = disc > 0 ? price - price * disc / 100 : price;

  return (
    <AnimatedTouchableOpacity
      entering={FadeInDown.delay(delay).duration(300)}
      style={[styles.productCard, anim]}
      activeOpacity={0.9}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 14, stiffness: 240 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 240 }); }}
      onPress={onPress}
    >
      {disc > 0 && (
        <View style={styles.discPill}>
          <Text style={styles.discPillText}>-{disc}%</Text>
        </View>
      )}
      <View style={styles.productImgWrap}>
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/p1.png')}
          style={styles.productImg}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.productName} numberOfLines={2}>{item.title}</Text>
      {disc > 0 && (
        <Text style={styles.oldPrice}>{price.toFixed(0)} ₸</Text>
      )}
      <Text style={styles.productPrice}>{finalPrice.toFixed(0)} ₸</Text>
    </AnimatedTouchableOpacity>
  );
}

export default function SmartShoppingScreen({ navigation }: any) {
  const { topPadding, contentTopOffset } = useHeaderLayout();
  const { t } = useI18n();
  const [personal, setPersonal] = useState<RecommendedProduct[]>([]);
  const [popular, setPopular] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [personalData, popularData] = await Promise.allSettled([
        getPersonalRecommendations(12),
        getPopularProducts(16),
      ]);
      setPersonal(personalData.status === 'fulfilled' ? personalData.value : []);
      setPopular(popularData.status === 'fulfilled' ? popularData.value : []);
    } catch {
      setError(t('Жүктелмеді', 'Не удалось загрузить'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const renderSection = (
    items: RecommendedProduct[],
    title: string,
    subtitle: string,
    icon: string,
    iconColor: string,
    iconBg: string,
    baseDelay: number,
  ) => (
    <Animated.View entering={FadeInDown.delay(baseDelay).duration(340)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: iconBg }]}>
          <Feather name={icon as any} size={16} color={iconColor} />
        </View>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>{subtitle}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hScroll}
      >
        {items.map((item, i) => (
          <ProductCard
            key={item.id}
            item={item}
            delay={baseDelay + i * 30}
            onPress={() => navigation.navigate('ProductScreen', { productId: item.id })}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Hero header — dark */}
      <View style={[styles.hero, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={P.text} />
        </TouchableOpacity>

        <View style={styles.heroCenter}>
          <View style={styles.aiBadge}>
            <Feather name="cpu" size={12} color={P.teal} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
          <Text style={styles.heroTitle}>{t('Смарт Сауда', 'Умные покупки')}</Text>
          <Text style={styles.heroSub}>{t('Сіз үшін таңдалған', 'Подобрано специально для вас')}</Text>
        </View>

        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={17} color={P.text} />
        </TouchableOpacity>
      </View>

      {/* Stat chips */}
      <Animated.View entering={FadeInDown.delay(80).duration(300)} style={[styles.chips, { paddingTop: contentTopOffset }]}>
        <View style={styles.chip}>
          <Feather name="star" size={13} color={P.amber} />
          <Text style={styles.chipText}>{t('Дербес', 'Персональные')}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: P.violetSoft, borderColor: '#DDD6FE' }]}>
          <Feather name="trending-up" size={13} color={P.violet} />
          <Text style={[styles.chipText, { color: P.violet }]}>{t('Танымал', 'Популярные')}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: P.tealSoft, borderColor: P.tealBorder }]}>
          <Feather name="zap" size={13} color={P.teal} />
          <Text style={[styles.chipText, { color: P.teal }]}>AI</Text>
        </View>
      </Animated.View>

      {loading ? (
        <ScrollView contentContainerStyle={styles.loadingContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SkeletonBlock width={36} height={36} borderRadius={10} />
              <View style={{ gap: 4 }}>
                <SkeletonBlock width={140} height={15} />
                <SkeletonBlock width={100} height={11} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[styles.productCard, { gap: 8 }]}>
                  <SkeletonBlock width={120} height={110} borderRadius={12} />
                  <SkeletonBlock width={120} height={12} />
                  <SkeletonBlock width={70} height={16} />
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={52} color="#CBD5E1" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>{t('Қайталау', 'Повторить')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {personal.length > 0 && renderSection(
            personal,
            t('Сізге арналған', 'Для вас'),
            t('Сіздің сатып алуларыңызға негізделген', 'На основе ваших покупок'),
            'user',
            P.amber,
            P.amberSoft,
            100,
          )}

          {popular.length > 0 && renderSection(
            popular,
            t('Танымал тауарлар', 'Популярные товары'),
            t('Барлық пайдаланушылар арасында', 'Среди всех покупателей'),
            'trending-up',
            P.violet,
            P.violetSoft,
            200,
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.bg },

  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(10,22,40,0.08)',
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },
  heroCenter: { alignItems: 'center', flex: 1 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(43,174,154,0.2)',
    borderWidth: 1, borderColor: 'rgba(43,174,154,0.4)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
    marginBottom: 6,
  },
  aiBadgeText: { color: P.teal, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: P.text, letterSpacing: -0.5 },
  heroSub: { fontSize: 12, color: P.muted, marginTop: 3 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(10,22,40,0.08)',
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },

  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 72,
    paddingBottom: 12,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: P.amberSoft,
    borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: P.amber },

  scroll: { paddingBottom: 80 },
  loadingContainer: { paddingTop: 72, paddingBottom: 60 },

  section: {
    marginBottom: 8,
    paddingTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: P.text, letterSpacing: -0.3 },
  sectionSub: { fontSize: 11, color: P.muted, marginTop: 1 },

  hScroll: { paddingHorizontal: 16, paddingBottom: 4, gap: 10 },

  productCard: {
    width: 140,
    backgroundColor: P.surface,
    borderRadius: 18,
    padding: 12,
    shadowColor: P.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: P.border,
  },
  discPill: {
    position: 'absolute', top: 8, right: 8, zIndex: 2,
    backgroundColor: '#E63946',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  discPillText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  productImgWrap: {
    backgroundColor: P.tealSoft, borderRadius: 12,
    overflow: 'hidden', marginBottom: 8, paddingVertical: 4,
  },
  productImg: { width: '100%', height: 90 },
  productName: { fontSize: 12, fontWeight: '600', color: P.text, marginBottom: 4, lineHeight: 16 },
  oldPrice: { fontSize: 11, color: P.muted, textDecorationLine: 'line-through', marginBottom: 1 },
  productPrice: { fontSize: 15, fontWeight: '800', color: P.tealDark, letterSpacing: -0.2 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 15, color: P.muted, marginTop: 12 },
  retryBtn: {
    marginTop: 16, backgroundColor: P.teal,
    paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
