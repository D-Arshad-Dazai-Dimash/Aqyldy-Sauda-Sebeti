import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInRight,
  FadeIn,
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FilterModal } from '../components/FilterModal';
import { useFavoritesStore } from '../store/favoritesStore';
import * as ProductsApi from '../api/products';
import * as StoresApi from '../api/stores';
import type { Product, Store } from '../types/api';
import { safeJsonParse } from '../utils/storage';
import { useI18n } from '../i18n/useI18n';

// @ts-ignore
import VerifiedIcon from '../assets/icons/verified.svg';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 52) / 2;
const STORE_CARD_W = SCREEN_W * 0.72;
const UNIFORM_CHIP_W = 148;
const UNIFORM_CHIP_H = 48;

const P = {
  bg: '#F7F8FC', surface: '#FFFFFF', navy: '#0F172A', ink: '#1E293B',
  muted: '#64748B', faint: '#CBD5E1', border: '#E2E8F0',
  teal: '#0EA5E9', tealL: '#E0F2FE', tealD: '#0284C7',
  rose: '#F43F5E', roseL: '#FFE4E6',
  emerald: '#10B981', emeraldL: '#D1FAE5',
  purple: '#8B5CF6', purpleL: '#EDE9FE',
  amber: '#F59E0B', amberL: '#FEF3C7',
};

// Accent colours cycling per store card
const STORE_ACCENTS = [
  { bg: P.tealL, icon: P.teal, dark: P.tealD },
  { bg: P.purpleL, icon: P.purple, dark: '#7C3AED' },
  { bg: P.emeraldL, icon: P.emerald, dark: '#059669' },
  { bg: P.amberL, icon: P.amber, dark: '#D97706' },
  { bg: P.roseL, icon: P.rose, dark: '#E11D48' },
];

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

const HISTORY_KEY = 'search:history';

export default function SearchScreen({ navigation, route }: any) {
  const { t, language } = useI18n();
  const filterDiscount = route?.params?.filterDiscount ?? false;
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
  const [discountOnly, setDiscountOnly] = useState(Boolean(filterDiscount));

  const quickCategories = language === 'kk'
    ? [
        { label: 'Жақын', icon: 'map-pin' as const },
        { label: 'Ашық', icon: 'clock' as const },
        { label: 'Жеңілдік', icon: 'tag' as const },
        { label: 'Жаңа', icon: 'star' as const },
        { label: 'Үйде', icon: 'home' as const },
      ]
    : [
        { label: 'Рядом', icon: 'map-pin' as const },
        { label: 'Открыто', icon: 'clock' as const },
        { label: 'Скидки', icon: 'tag' as const },
        { label: 'Новое', icon: 'star' as const },
        { label: 'Домой', icon: 'home' as const },
      ];

  const popularQueries = language === 'kk'
    ? ['Сүт', 'Жұмыртқа', 'Нан', 'Ет', 'Су']
    : ['Молоко', 'Яйца', 'Хлеб', 'Мясо', 'Вода'];

  // Load search history and stores on mount
  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      setHistory(safeJsonParse<string[]>(raw, []));
    });
    StoresApi.getStores().then(setStores).catch(() => {});
  }, []);

  useEffect(() => {
    setDiscountOnly(Boolean(filterDiscount));
  }, [filterDiscount]);

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
  }, [searchQuery, priceRange, selectedStores, discountOnly]);

  const performSearch = async (q: string) => {
    setLoading(true);
    try {
      const result = await ProductsApi.searchProducts({ q, active: true, size: 40 });
      // Client-side price filter (backend doesn't have price filter yet)
      let filtered = result.content.filter(
        (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
      );
      if (selectedStores.length > 0) {
        filtered = filtered.filter((p: any) => selectedStores.includes(p.storeName));
      }
      if (discountOnly) {
        filtered = filtered.filter((p: any) => Number(p.discount ?? 0) > 0);
      }
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

  const formatPrice = (price: number) => `${Math.round(price)} ₸`;

  const renderSearchResults = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={P.teal} />
        </View>
      );
    }
    if (products.length === 0) {
      return (
        <View style={styles.centerBox}>
          <View style={styles.emptyIcon}>
            <Feather name="search" size={32} color={P.faint} />
          </View>
          <Text style={styles.emptyTitle}>{t('Табылмады', 'Ничего не найдено')}</Text>
          <Text style={styles.emptySubtitle}>{t('Өзге сөз қолданып көріңіз', 'Попробуйте другой запрос')}</Text>
        </View>
      );
    }

    return (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultsContent}>
        <Text style={styles.resultCount}>{products.length} {t('тауар табылды', 'товаров найдено')}</Text>
        <View style={styles.productGrid}>
          {products.map((product, idx) => {
            const isFav = isFavorite(product.id);
            return (
              <Animated.View key={product.id} entering={FadeInDown.delay(idx * 40).springify().damping(14)}>
                <PressCard
                  onPress={() => navigation.navigate('ProductScreen', { productId: product.id })}
                  style={styles.productCard}
                >
                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavorite(product.id)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Feather name="heart" size={16} color={isFav ? P.rose : P.faint} />
                  </TouchableOpacity>
                  <View style={styles.cardImageWrap}>
                    {product.imageUrl
                      ? <Image source={{ uri: product.imageUrl }} style={styles.cardImage} resizeMode="contain" />
                      : <Feather name="package" size={36} color={P.faint} />
                    }
                  </View>
                  <Text style={styles.cardName} numberOfLines={2}>{product.title}</Text>
                  <Text style={styles.cardPrice}>{formatPrice(product.price)}</Text>
                </PressCard>
              </Animated.View>
            );
          })}
        </View>
        {stores.length > 0 && (
          <View style={styles.storesSection}>
            <Text style={styles.storesSectionTitle}>{t('Дүкендер', 'Магазины')}</Text>
            {stores.map((store, idx) => {
              const accent = STORE_ACCENTS[idx % STORE_ACCENTS.length];
              return (
                <Animated.View key={store.id} entering={FadeInDown.delay(idx * 50).springify()}>
                  <PressCard
                    onPress={() => navigation.navigate('StoreScreen', { storeId: store.id })}
                    style={styles.storeRowFlat}
                  >
                    <View style={[styles.storeIconFlat, { backgroundColor: accent.bg }]}>
                      <Feather name="shopping-bag" size={18} color={accent.icon} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.storeName}>{store.name}</Text>
                      <Text style={styles.storeAddr}>{store.address}</Text>
                    </View>
                    <View style={[styles.storeRowChevron, { backgroundColor: accent.bg }]}>
                      <Feather name="chevron-right" size={15} color={accent.icon} />
                    </View>
                  </PressCard>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ─────────────────────────────────────── */}
      <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="chevron-left" size={22} color={P.ink} />
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <Feather name="search" size={16} color={P.teal} style={{ marginRight: 8 }} />
          <TextInput
            autoFocus
            placeholder={t('Тауар немесе дүкен іздеу…', 'Поиск товара или магазина…')}
            style={styles.input}
            placeholderTextColor={P.faint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <View style={styles.clearBtn}>
                <Feather name="x" size={11} color={P.muted} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setIsFilterVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="sliders" size={18} color={P.ink} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Content ────────────────────────────────────── */}
      {searchQuery.length > 0 ? (
        renderSearchResults()
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.idleContent}>

          {/* Promo hero banner */}
          <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.heroBanner}>
            <View style={styles.heroBannerCircle1} />
            <View style={styles.heroBannerCircle2} />
            <View style={styles.heroBannerLeft}>
              <View style={styles.heroBadge}>
                <Feather name="zap" size={11} color="#FFF" />
                <Text style={styles.heroBadgeText}>{t('СМАРТ ІЗДЕУ', 'УМНЫЙ ПОИСК')}</Text>
              </View>
              <Text style={styles.heroTitle}>{t('Ең жақсы', 'Найдите лучшую')}{'\n'}{t('бағаны табыңыз', 'цену')}</Text>
              <Text style={styles.heroSub}>{t('AI баға талдауымен', 'С AI-анализом цен')}</Text>
            </View>
            <View style={styles.heroBannerRight}>
              <View style={styles.heroIconWrap}>
                <Feather name="trending-up" size={26} color={P.teal} />
              </View>
            </View>
          </Animated.View>

          {/* Search history */}
          {history.length > 0 && (
            <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.historyBlock}>
              <View style={styles.sectionRow}>
                <View style={styles.sectionTitleRow}>
                  <Feather name="clock" size={14} color={P.muted} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>{t('Соңғы іздеулер', 'Недавние запросы')}</Text>
                </View>
                <TouchableOpacity onPress={clearHistory}>
                  <Text style={styles.clearAll}>{t('Тазалау', 'Очистить')}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
                {history.map((item, i) => (
                  <Animated.View key={i} entering={FadeInRight.delay(130 + i * 30).springify()}>
                    <TouchableOpacity style={styles.tag} onPress={() => selectHistoryItem(item)}>
                      <Text style={styles.tagText}>{item}</Text>
                      <TouchableOpacity onPress={() => removeHistoryItem(item)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Feather name="x" size={12} color={P.faint} style={{ marginLeft: 5 }} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Stores section */}
          {stores.length > 0 && (
            <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.storesBlock}>
              <View style={styles.sectionRow}>
                <View style={styles.sectionTitleRow}>
                  <Feather name="shopping-bag" size={14} color={P.muted} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>{t('Дүкендер', 'Магазины')}</Text>
                </View>
                <Text style={styles.storeCount}>{stores.length} {t('дүкен', 'магазинов')}</Text>
              </View>

              {/* Horizontal store cards */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storeCardsScroll}
              >
                {stores.map((store, idx) => {
                  const accent = STORE_ACCENTS[idx % STORE_ACCENTS.length];
                  return (
                    <Animated.View
                      key={store.id}
                      entering={FadeInRight.delay(180 + idx * 60).springify().damping(14)}
                    >
                      <PressCard
                        onPress={() => navigation.navigate('StoreScreen', { storeId: store.id })}
                        style={styles.storeCard}
                      >
                        <View style={[styles.storeCardCircle, { backgroundColor: accent.bg }]} />

                        <View style={styles.storeCardTop}>
                          <View style={[styles.storeCardAvatar, { backgroundColor: accent.bg }]}>
                            <Feather name="shopping-bag" size={22} color={accent.icon} />
                          </View>
                          <View style={[styles.storeCardOpen, { backgroundColor: P.emeraldL }]}>
                            <View style={[styles.openDot, { backgroundColor: P.emerald }]} />
                            <Text style={[styles.openText, { color: P.emerald }]}>{t('Ашық', 'Открыто')}</Text>
                          </View>
                        </View>

                        <Text style={styles.storeCardName} numberOfLines={1}>{store.name}</Text>
                        <View style={styles.storeCardAddrRow}>
                          <Feather name="map-pin" size={11} color={P.muted} style={{ marginRight: 3 }} />
                          <Text style={styles.storeCardAddr} numberOfLines={1}>{store.address}</Text>
                        </View>

                        <View style={styles.storeCardFooter}>
                          <View style={[styles.storeCardVerified, { backgroundColor: accent.bg }]}>
                            <VerifiedIcon width={13} height={13} />
                            <Text style={[styles.storeCardVerifiedText, { color: accent.icon }]}>{t('Верификация', 'Проверено')}</Text>
                          </View>
                          <View style={[styles.storeArrow, { backgroundColor: accent.bg }]}>
                            <Feather name="arrow-right" size={14} color={accent.icon} />
                          </View>
                        </View>
                      </PressCard>
                    </Animated.View>
                  );
                })}
              </ScrollView>

              <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.discoverBlock}>
                <View style={styles.sectionTitleRow}>
                  <Feather name="grid" size={14} color={P.muted} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>{t('Жылдам санаттар', 'Быстрые категории')}</Text>
                </View>
                <View style={styles.quickCatsWrap}>
                  {quickCategories.map((item, idx) => {
                    const accent = STORE_ACCENTS[idx % STORE_ACCENTS.length];
                    return (
                      <Animated.View key={item.label} entering={FadeInDown.delay(250 + idx * 35).springify()}>
                        <TouchableOpacity
                          style={[styles.quickCatChip, { backgroundColor: accent.bg }]}
                          onPress={() => setSearchQuery(item.label)}
                          activeOpacity={0.85}
                        >
                          <Feather name={item.icon} size={14} color={accent.icon} />
                          <Text numberOfLines={1} style={[styles.quickCatText, { color: accent.dark }]}>{item.label}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.discoverBlock}>
                <View style={styles.sectionTitleRow}>
                  <Feather name="trending-up" size={14} color={P.muted} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>{t('Танымал іздеулер', 'Популярные запросы')}</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.popularScroll}
                >
                  {popularQueries.map((query, idx) => (
                    <Animated.View key={query} entering={FadeInRight.delay(330 + idx * 30).springify()}>
                      <TouchableOpacity
                        style={styles.popularChip}
                        onPress={() => setSearchQuery(query)}
                        activeOpacity={0.85}
                      >
                        <Feather name="search" size={12} color={P.teal} style={{ marginRight: 6 }} />
                        <Text numberOfLines={1} style={styles.popularText}>{query}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </ScrollView>
              </Animated.View>
            </Animated.View>
          )}

          {stores.length === 0 && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.noStoresBox}>
              <Feather name="shopping-bag" size={36} color={P.faint} />
              <Text style={styles.noStoresText}>{t('Дүкендер жүктелуде…', 'Загрузка магазинов…')}</Text>
            </Animated.View>
          )}
        </ScrollView>
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
  container: { flex: 1, backgroundColor: P.bg },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 4 : (StatusBar.currentHeight ?? 0) + 6,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: P.bg,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: P.surface,
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.surface,
    borderWidth: 1.5,
    borderColor: P.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  input: { flex: 1, fontSize: 15, color: P.ink, paddingVertical: 0 },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: P.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Idle content ────────────────────────────────────────
  idleContent: { paddingBottom: 50 },

  // Hero banner
  heroBanner: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 22,
    backgroundColor: P.navy,
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: P.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  heroBannerCircle1: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(14,165,233,0.13)',
    top: -30,
    right: 30,
  },
  heroBannerCircle2: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(139,92,246,0.1)',
    bottom: -20,
    right: -5,
  },
  heroBannerLeft: { gap: 5 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: P.teal,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 2,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.6 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.4, lineHeight: 26 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  heroBannerRight: {},
  heroIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(14,165,233,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // History
  historyBlock: { paddingHorizontal: 14, marginBottom: 22 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: P.muted, letterSpacing: 0.7, textTransform: 'uppercase' },
  clearAll: { fontSize: 12, color: P.teal, fontWeight: '600' },
  tagsScroll: { gap: 8, paddingRight: 4 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.surface,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  tagText: { fontSize: 13, color: P.ink, fontWeight: '500' },

  // Stores block
  storesBlock: { paddingHorizontal: 14 },
  storeCount: { fontSize: 12, color: P.muted, fontWeight: '500' },

  // Horizontal store card
  storeCardsScroll: { gap: 12, paddingRight: 14, paddingVertical: 8 },
  storeCard: {
    width: STORE_CARD_W,
    backgroundColor: P.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    overflow: 'hidden',
  },
  storeCardCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -40,
    right: -30,
  },
  storeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  storeCardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeCardOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 11, fontWeight: '700' },
  storeCardName: { fontSize: 17, fontWeight: '800', color: P.ink, letterSpacing: -0.3, marginBottom: 4 },
  storeCardAddrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  storeCardAddr: { fontSize: 12, color: P.muted, flex: 1 },
  storeCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeCardVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  storeCardVerifiedText: { fontSize: 11, fontWeight: '600' },
  storeArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Discovery blocks
  discoverBlock: { marginTop: 16 },
  quickCatsWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCatChip: {
    width: UNIFORM_CHIP_W,
    height: UNIFORM_CHIP_H,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  quickCatText: { flexShrink: 1, fontSize: 13, fontWeight: '700' },
  popularScroll: { gap: 10, paddingTop: 10, paddingBottom: 2, paddingRight: 8 },
  popularChip: {
    width: UNIFORM_CHIP_W,
    height: UNIFORM_CHIP_H,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 0,
    backgroundColor: P.surface,
    borderWidth: 1,
    borderColor: P.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  popularText: { flexShrink: 1, fontSize: 13, fontWeight: '600', color: P.ink },

  // Store rows in search results
  storeRowFlat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  storeIconFlat: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeName: { fontSize: 14, fontWeight: '700', color: P.ink },
  storeAddr: { fontSize: 12, color: P.muted, marginTop: 2 },
  storeRowChevron: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  noStoresBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  noStoresText: { fontSize: 14, color: P.faint, fontWeight: '500' },

  // ── Results ────────────────────────────────────────────
  resultsContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 50 },
  resultCount: { fontSize: 13, color: P.muted, fontWeight: '600', marginBottom: 14, paddingLeft: 2 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: {
    width: CARD_W,
    backgroundColor: P.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 5,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.border,
  },
  cardImageWrap: { height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardImage: { width: '100%', height: '100%', borderRadius: 10 },
  cardName: { fontSize: 12, fontWeight: '600', color: P.ink, marginBottom: 5, lineHeight: 17 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: P.teal },

  storesSection: { marginTop: 28 },
  storesSectionTitle: { fontSize: 12, fontWeight: '700', color: P.muted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 12 },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: P.surface,
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: P.ink },
  emptySubtitle: { fontSize: 14, color: P.muted, marginTop: 4 },
});
