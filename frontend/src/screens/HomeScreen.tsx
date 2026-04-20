import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { getPersonalRecommendations, getPopularProducts } from '../api/recommendations';
import type { RecommendedProduct } from '../types/api';
import SkeletonBlock from '../components/SkeletonBlock';
import { useHeaderLayout } from '../utils/useHeaderLayout';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Premium palette ───────────────────────────────────────────────────────────
const P = {
  bg:        '#F7F8FC',
  surface:   '#FFFFFF',
  navy:      '#0F172A',
  ink:       '#1E293B',
  muted:     '#64748B',
  faint:     '#CBD5E1',
  border:    '#E2E8F0',
  teal:      '#0EA5E9',
  tealLight: '#E0F2FE',
  emerald:   '#10B981',
  emeraldL:  '#D1FAE5',
  amber:     '#F59E0B',
  amberL:    '#FEF3C7',
  rose:      '#F43F5E',
  roseL:     '#FFE4E6',
  purple:    '#8B5CF6',
  purpleL:   '#EDE9FE',
  gold:      '#FBBF24',
};

// ─── Animated Pressable with scale effect ──────────────────────────────────────
function PressCard({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      onPress={onPress}
    >
      <Animated.View style={[style, animStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Quick service card ────────────────────────────────────────────────────────
function ServiceCard({
  icon,
  label,
  iconColor,
  bgColor,
  onPress,
  delay,
}: {
  icon: string;
  label: string;
  iconColor: string;
  bgColor: string;
  onPress: () => void;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(14)}>
      <PressCard onPress={onPress} style={[styles.serviceCard, { backgroundColor: bgColor }]}>
        <View style={[styles.serviceIconWrap, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
          <Feather name={icon} size={22} color={iconColor} />
        </View>
        <Text style={[styles.serviceLabel, { color: iconColor }]}>{label}</Text>
      </PressCard>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { topPadding, contentTopOffset } = useHeaderLayout();
  const user = useAuthStore((s) => s.user);
  const language = useLanguageStore((s) => s.language);
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const recommendationSkeletons = Array.from({ length: 4 }, (_, i) => i);

  const t = language === 'kk'
    ? {
        lang: 'KZ',
        languageLabel: 'Тіл',
        languageChanged: 'Тіл қазақшаға ауыстырылды',
        notifications: 'Хабарландырулар',
        noNotifications: 'Жаңа хабарландырулар жоқ.',
        greetingSmall: 'Қайырлы күн 👋',
        greetingFallback: 'Пайдаланушы',
        greetingSub: 'Бүгін не сатып алғыңыз келеді?',
        searchPlaceholder: 'Қалаған затыңызды іздеңіз…',
        quickFeatures: 'Жылдам мүмкіндіктер',
        stores: 'Дүкендер',
        map: 'Карта',
        promos: 'Акциялар',
        history: 'Тарихы',
        smartAnalytics: 'Смарт Аналитика',
        trackExpenses: 'Шығындарыңызды бақылаңыз',
        specialOffer: 'ЕРЕКШЕ ҰСЫНЫС',
        smartShopping: 'Смарт Сауда',
        aiDeal: 'AI арқылы тиімді бағаларды тауып ал',
        recommended: 'Сізге ұсынылады',
        viewAll: 'Барлығы →',
        recError: 'Ұсыныстарды жүктеу мүмкін болмады',
        retry: 'Қайта көру',
      }
    : {
        lang: 'RU',
        languageLabel: 'Язык',
        languageChanged: 'Язык переключен на русский',
        notifications: 'Уведомления',
        noNotifications: 'Новых уведомлений нет.',
        greetingSmall: 'Добрый день 👋',
        greetingFallback: 'Пользователь',
        greetingSub: 'Что хотите купить сегодня?',
        searchPlaceholder: 'Найдите нужный товар…',
        quickFeatures: 'Быстрые возможности',
        stores: 'Магазины',
        map: 'Карта',
        promos: 'Акции',
        history: 'История',
        smartAnalytics: 'Смарт-аналитика',
        trackExpenses: 'Контролируйте свои расходы',
        specialOffer: 'СПЕЦПРЕДЛОЖЕНИЕ',
        smartShopping: 'Умные покупки',
        aiDeal: 'Находите выгодные цены с AI',
        recommended: 'Рекомендуем вам',
        viewAll: 'Все →',
        recError: 'Не удалось загрузить рекомендации',
        retry: 'Повторить',
      };

  // Scroll-based header opacity
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const headerBgStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
    };
  });

  const loadRecommendations = useCallback(async () => {
    try {
      setRecsLoading(true);
      setRecsError(null);
      let recs = await getPersonalRecommendations(8);
      if (recs.length === 0) recs = await getPopularProducts(8);
      setRecommendations(recs);
    } catch {
      setRecsError(t.recError);
    } finally {
      setRecsLoading(false);
    }
  }, [t.recError]);

  useEffect(() => { loadRecommendations(); }, [loadRecommendations]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>

      {/* ── Floating header ─────────────────────────────────────────── */}
      <Animated.View style={[styles.header, headerBgStyle, { paddingTop: topPadding }]}>
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.logoRow}>
          <View style={styles.logoAccent} />
          <Text style={styles.logoA}>Aqyldy</Text>
          <Text style={styles.logoB}> Sebet</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerRight}>
          <TouchableOpacity
            style={styles.langPill}
            onPress={async () => {
              await toggleLanguage();
              Alert.alert(t.languageLabel, t.languageChanged);
            }}
          >
            <Feather name="globe" size={13} color={P.muted} />
            <Text style={styles.langText}>{t.lang}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('NotificationsTab')}
          >
            <Feather name="bell" size={19} color={P.ink} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* ── Scrollable content ──────────────────────────────────────── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: contentTopOffset }]}
      >

        {/* Hero greeting */}
        <View style={styles.heroSection}>
          <Animated.Text entering={FadeInDown.delay(150).springify()} style={styles.greetSmall}>
            {t.greetingSmall}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(220).springify()} style={styles.greetName}>
            {user?.name || user?.username || t.greetingFallback}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(280).springify()} style={styles.greetSub}>
            {t.greetingSub}
          </Animated.Text>
        </View>

        {/* Search bar */}
        <Animated.View entering={FadeInDown.delay(320).springify()}>
          <PressCard
            onPress={() => navigation.navigate('Search')}
            style={styles.searchBar}
          >
            <View style={styles.searchIcon}>
              <Feather name="search" size={18} color={P.teal} />
            </View>
            <Text style={styles.searchText}>{t.searchPlaceholder}</Text>
            <View style={styles.searchKbd}>
              <Feather name="sliders" size={14} color={P.muted} />
            </View>
          </PressCard>
        </Animated.View>

        {/* ── Services grid ─────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Animated.Text entering={FadeIn.delay(370)} style={styles.sectionTitle}>
            {t.quickFeatures}
          </Animated.Text>
        </View>

        <View style={styles.servicesGrid}>
          <ServiceCard icon="shopping-bag"  label={t.stores} iconColor={P.teal}    bgColor={P.tealLight}   onPress={() => navigation.navigate('Search')}    delay={400} />
          <ServiceCard icon="map-pin"       label={t.map} iconColor={P.purple}  bgColor={P.purpleL} onPress={() => navigation.navigate('Map')} delay={450} />
          <ServiceCard icon="tag"           label={t.promos} iconColor={P.rose}    bgColor={P.roseL}       onPress={() => navigation.navigate('Promotions')} delay={500} />
          <ServiceCard icon="clock"         label={t.history} iconColor={P.amber}   bgColor={P.amberL}      onPress={() => navigation.navigate('Orders')} delay={550} />
        </View>

        {/* ── AI Analytics banner ───────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(600).springify().damping(14)}>
          <PressCard onPress={() => navigation.navigate('Analytics')} style={styles.analyticsBanner}>
            {/* Decorative circles */}
            <View style={styles.bannerCircle1} />
            <View style={styles.bannerCircle2} />

            <View style={styles.bannerLeft}>
              <View style={styles.aiBadge}>
                <Feather name="zap" size={11} color="#FFF" />
                <Text style={styles.aiBadgeText}>AI POWERED</Text>
              </View>
              <Text style={styles.bannerTitle}>{t.smartAnalytics}</Text>
              <Text style={styles.bannerSub}>{t.trackExpenses}</Text>
            </View>

            <View style={styles.bannerRight}>
              <View style={styles.bannerIconWrap}>
                <Feather name="bar-chart-2" size={28} color={P.teal} />
              </View>
              <View style={styles.bannerArrow}>
                <Feather name="arrow-right" size={16} color={P.navy} />
              </View>
            </View>
          </PressCard>
        </Animated.View>

        {/* ── Promo strip ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(660).springify().damping(14)}>
          <PressCard onPress={() => navigation.navigate('SmartShopping')} style={styles.promoBanner}>
            <View>
              <Text style={styles.promoEyebrow}>{t.specialOffer}</Text>
              <Text style={styles.promoTitle}>{t.smartShopping}</Text>
              <Text style={styles.promoSub}>{t.aiDeal}</Text>
            </View>
            <View style={styles.promoIconWrap}>
              <Feather name="trending-up" size={30} color={P.emerald} />
            </View>
          </PressCard>
        </Animated.View>

        {/* ── AI Recommendations ──────────────────────────────────── */}
        {(recommendations.length > 0 || recsLoading || recsError) && (
          <View style={styles.recsSection}>
            <Animated.View
              entering={FadeInDown.delay(700).springify()}
              style={styles.recsSectionHeader}
            >
              <View style={styles.recsTitleRow}>
                <View style={styles.recsIconWrap}>
                  <Feather name="cpu" size={14} color="#FFF" />
                </View>
                <Text style={styles.recsSectionTitle}>{t.recommended}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={styles.recsViewAll}>{t.viewAll}</Text>
              </TouchableOpacity>
            </Animated.View>

            {recsError && !recsLoading && recommendations.length === 0 ? (
              <View style={styles.recsErrorWrap}>
                <Text style={styles.recsErrorText}>{recsError}</Text>
                <TouchableOpacity style={styles.recsRetryBtn} onPress={loadRecommendations}>
                  <Text style={styles.recsRetryText}>{t.retry}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recsScroll}
            >
              {recsLoading && !recommendations.length
                ? recommendationSkeletons.map((i) => (
                    <View key={i} style={styles.recCard}>
                      <SkeletonBlock height={100} borderRadius={12} />
                      <SkeletonBlock height={12} style={{ marginTop: 10, marginBottom: 5 }} />
                      <SkeletonBlock width="60%" height={12} style={{ marginBottom: 10 }} />
                      <SkeletonBlock width="45%" height={16} />
                    </View>
                  ))
                : recommendations.map((item, idx) => {
                    const discounted = item.discount
                      ? item.price - (item.price * item.discount) / 100
                      : null;
                    return (
                      <Animated.View
                        key={item.id}
                        entering={FadeInDown.delay(720 + idx * 60).springify().damping(16)}
                      >
                        <PressCard
                          onPress={() =>
                            navigation.navigate('ProductScreen', { productId: item.id })
                          }
                          style={styles.recCard}
                        >
                          {item.discount ? (
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountBadgeText}>-{item.discount}%</Text>
                            </View>
                          ) : null}
                          <Image
                            source={
                              item.imageUrl
                                ? { uri: item.imageUrl }
                                : require('../assets/p1.png')
                            }
                            style={styles.recImage}
                            resizeMode="contain"
                          />
                          <Text style={styles.recTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          {discounted ? (
                            <View style={styles.recPriceRow}>
                              <Text style={styles.recPrice}>{discounted.toFixed(0)} ₸</Text>
                              <Text style={styles.recOldPrice}>{item.price} ₸</Text>
                            </View>
                          ) : (
                            <Text style={styles.recPrice}>{item.price} ₸</Text>
                          )}
                        </PressCard>
                      </Animated.View>
                    );
                  })}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 16 }} />
      </Animated.ScrollView>

      {/* ── Floating AI Chat FAB ─────────────────────────────────────── */}
      <Animated.View entering={ZoomIn.delay(800).springify()} style={styles.fabWrap}>
        <PressCard onPress={() => navigation.navigate('Chatbot')} style={styles.chatFab}>
          <Feather name="message-circle" size={25} color="#FFF" />
        </PressCard>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.bg },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 8,
    elevation: 0,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoAccent: {
    width: 6,
    height: 22,
    borderRadius: 3,
    backgroundColor: P.teal,
    marginRight: 8,
  },
  logoA: { fontSize: 22, fontWeight: '900', color: P.ink, letterSpacing: -0.5 },
  logoB: { fontSize: 22, fontWeight: '900', color: P.teal, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: P.surface,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  langText: { fontSize: 12, fontWeight: '600', color: P.muted },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.surface,
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: P.rose,
    borderWidth: 1.5,
    borderColor: P.bg,
  },

  // Scroll
  scrollContent: { paddingTop: 0, paddingBottom: 110 },

  // Hero
  heroSection: { paddingHorizontal: 22, marginTop: 8, marginBottom: 22 },
  greetSmall: { fontSize: 15, color: P.muted, fontWeight: '500', marginBottom: 4 },
  greetName: {
    fontSize: 30,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  greetSub: { fontSize: 15, color: P.muted, marginTop: 6 },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.surface,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    borderRadius: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  searchIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: P.tealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchText: { flex: 1, fontSize: 15, color: P.faint },
  searchKbd: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: P.bg,
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section label
  sectionHeader: { paddingHorizontal: 22, marginTop: 28, marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: P.muted, letterSpacing: 1, textTransform: 'uppercase' },

  // Services
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 10,
  },
  serviceCard: {
    width: (SCREEN_W - 48) / 2,
    borderRadius: 20,
    padding: 18,
    justifyContent: 'space-between',
    height: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  serviceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceLabel: { fontSize: 15, fontWeight: '700' },

  // Analytics banner
  analyticsBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: P.navy,
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: P.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(14,165,233,0.12)',
    top: -30,
    right: 40,
  },
  bannerCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139,92,246,0.1)',
    bottom: -20,
    right: 10,
  },
  bannerLeft: { gap: 5 },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  aiBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  bannerRight: { alignItems: 'center', gap: 10 },
  bannerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(14,165,233,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Promo banner
  promoBanner: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: P.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: P.emeraldL,
    shadowColor: P.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  promoEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: P.emerald,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  promoTitle: { fontSize: 17, fontWeight: '800', color: P.ink, letterSpacing: -0.3 },
  promoSub: { fontSize: 13, color: P.muted, marginTop: 3 },
  promoIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: P.emeraldL,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Recommendations
  recsSection: { marginTop: 28, paddingBottom: 8 },
  recsSectionHeader: {
    paddingHorizontal: 22,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recsIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: P.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recsSectionTitle: { fontSize: 16, fontWeight: '800', color: P.ink },
  recsViewAll: { fontSize: 13, fontWeight: '600', color: P.teal },
  recsErrorWrap: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  recsErrorText: { color: '#991B1B', fontWeight: '600', marginBottom: 8 },
  recsRetryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recsRetryText: { color: '#FFFFFF', fontWeight: '700' },
  recsScroll: { paddingHorizontal: 18, paddingVertical: 10, gap: 12 },
  recCard: {
    width: 150,
    backgroundColor: P.surface,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: P.rose,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 5,
  },
  discountBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  recImage: { width: '100%', height: 100, borderRadius: 12, marginBottom: 10 },
  recTitle: { fontSize: 12, fontWeight: '600', color: P.ink, marginBottom: 6, lineHeight: 17 },
  recPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recPrice: { fontSize: 15, fontWeight: '800', color: P.teal },
  recOldPrice: { fontSize: 11, color: P.faint, textDecorationLine: 'line-through' },



  // FAB
  fabWrap: {
    position: 'absolute',
    bottom: 92,
    right: 20,
    zIndex: 100,
  },
  chatFab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: P.teal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: P.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
});