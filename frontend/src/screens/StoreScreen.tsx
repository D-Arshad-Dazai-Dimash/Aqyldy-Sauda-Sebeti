import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import Collapsible from 'react-native-collapsible';
import { useFavoritesStore } from '../store/favoritesStore';
import { useCartStore } from '../store/cartStore';
import { useStoreCatalogStore } from '../store/storeCatalogStore';
import * as StoresApi from '../api/stores';
import type { Store, InventoryItem } from '../types/api';
// @ts-ignore
import VerifiedIcon from '../assets/icons/verified.svg';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;
const SORT_CYCLE: StoresApi.StoreProductsSort[] = ['titleAsc', 'priceAsc', 'priceDesc'];

const SORT_LABELS: Record<StoresApi.StoreProductsSort, string> = {
  titleAsc: 'А-Я',
  priceAsc: 'Баға ↑',
  priceDesc: 'Баға ↓',
};

const P = {
  bg: '#F7F8FC', surface: '#FFFFFF', navy: '#0F172A', ink: '#1E293B',
  muted: '#64748B', faint: '#CBD5E1', border: '#E2E8F0',
  teal: '#0EA5E9', tealL: '#E0F2FE', rose: '#F43F5E', roseL: '#FFE4E6',
  emerald: '#10B981', emeraldL: '#D1FAE5', amber: '#F59E0B',
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

export default function StoreScreen({ route, navigation }: any) {
  const storeId: string = route.params?.storeId;

  const getCatalogState = useStoreCatalogStore((s) => s.getStateForStore);
  const patchCatalogState = useStoreCatalogStore((s) => s.patchState);
  const clearExpiredCatalog = useStoreCatalogStore((s) => s.clearExpired);
  const snapshot = getCatalogState(storeId);

  const scrollRef = useRef<ScrollView>(null);
  const lastScrollY = useRef(snapshot.scrollOffset);
  const restoredScrollRef = useRef(false);

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<InventoryItem[]>(snapshot.items);
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [page, setPage] = useState(snapshot.page);
  const [pageSize] = useState(snapshot.pageSize);
  const [query, setQuery] = useState(snapshot.query);
  const [inStockOnly, setInStockOnly] = useState(snapshot.inStockOnly);
  const [sort, setSort] = useState<StoresApi.StoreProductsSort>(snapshot.sort);
  const [totalPages, setTotalPages] = useState(snapshot.totalPages || 1);
  const [totalElements, setTotalElements] = useState(snapshot.totalElements || snapshot.items.length);

  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const addItem = useCartStore((s) => s.addItem);

  const loadStore = useCallback(async () => {
    setLoadingStore(true);
    setStoreError(null);
    try {
      if (!storeId) throw new Error('Дүкен ID табылмады');
      const storeData = await StoresApi.getStore(storeId);
      setStore(storeData);
    } catch (e: any) {
      setStoreError(e?.response?.data?.detail || e?.message || 'Failed to load store');
    } finally {
      setLoadingStore(false);
    }
  }, [storeId]);

  const loadProducts = useCallback(async () => {
    if (!storeId) return;
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const pageData = await StoresApi.getStoreProductsPaged(storeId, {
        page,
        size: pageSize,
        query,
        inStockOnly,
        sort,
      });
      setProducts(pageData.content);
      setTotalPages(pageData.totalPages || 1);
      setTotalElements(pageData.totalElements || pageData.content.length);

      patchCatalogState(storeId, {
        page: pageData.number,
        pageSize,
        query,
        inStockOnly,
        sort,
        totalPages: pageData.totalPages || 1,
        totalElements: pageData.totalElements || pageData.content.length,
        items: pageData.content,
      });
    } catch (e: any) {
      setProductsError(e?.response?.data?.detail || 'Failed to load products');
      setProducts([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoadingProducts(false);
    }
  }, [storeId, page, pageSize, query, inStockOnly, sort, patchCatalogState]);

  useEffect(() => {
    clearExpiredCatalog(20 * 60 * 1000);
    loadStore();
  }, [clearExpiredCatalog, loadStore]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (loadingStore || loadingProducts || restoredScrollRef.current) return;
    if (snapshot.scrollOffset <= 0) return;

    restoredScrollRef.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: snapshot.scrollOffset, animated: false });
    });
  }, [loadingStore, loadingProducts, snapshot.scrollOffset]);

  const rememberScroll = (y: number) => {
    lastScrollY.current = y;
    patchCatalogState(storeId, { scrollOffset: y });
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setPage(0);
  };

  const handleToggleStock = () => {
    setInStockOnly((prev) => !prev);
    setPage(0);
  };

  const cycleSort = () => {
    setSort((prev) => {
      const idx = SORT_CYCLE.indexOf(prev);
      const next = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
      return next;
    });
    setPage(0);
  };

  const renderPaginationControls = () => (
    <View style={styles.paginationRow}>
      <TouchableOpacity
        style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
        disabled={page === 0 || loadingProducts}
        onPress={() => setPage((prev) => Math.max(0, prev - 1))}
      >
        <Feather name="chevron-left" size={16} color={page === 0 ? P.faint : P.ink} />
        <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>Алдыңғы</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pageBtn, (page + 1 >= totalPages) && styles.pageBtnDisabled]}
        disabled={page + 1 >= totalPages || loadingProducts}
        onPress={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
      >
        <Text style={[styles.pageBtnText, (page + 1 >= totalPages) && styles.pageBtnTextDisabled]}>Келесі</Text>
        <Feather name="chevron-right" size={16} color={page + 1 >= totalPages ? P.faint : P.ink} />
      </TouchableOpacity>
    </View>
  );

  const handleAddToCart = async (productId: string) => {
    const product = products.find((entry) => entry.productId === productId);
    try {
      await addItem(storeId, productId, 1, {
        productId,
        productTitle: product?.productTitle,
        price: product?.price,
        imageUrl: product?.imageUrl,
      });
    } catch {}
  };

  const formatPrice = (price: number) => `${Math.round(price)} ₸`;

  const renderProductItem = ({ item, index }: { item: InventoryItem; index: number }) => {
    const isFav = isFavorite(item.productId);
    return (
      <Animated.View entering={FadeInDown.delay(index * 45).springify().damping(14)}>
        <PressCard
          style={styles.productCard}
          onPress={() => {
            patchCatalogState(storeId, {
              scrollOffset: lastScrollY.current,
              page,
              pageSize,
              query,
              inStockOnly,
              sort,
              totalPages,
              totalElements,
              items: products,
            });
            navigation.navigate('ProductScreen', { productId: item.productId, storeId });
          }}
        >
          <TouchableOpacity
            style={styles.favBtn}
            onPress={() => toggleFavorite(item.productId)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Feather name="heart" size={15} color={isFav ? P.rose : P.faint} />
          </TouchableOpacity>
          <View style={styles.cardImageWrap}>
            <Image
              source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/p1.png')}
              style={styles.cardImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.productTitle}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => handleAddToCart(item.productId)}
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            >
              <Feather name="plus" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </PressCard>
      </Animated.View>
    );
  };

  if (loadingStore) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={P.teal} />
        </View>
      </SafeAreaView>
    );
  }

  if (storeError || !store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="chevron-left" size={24} color={P.ink} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{storeError || 'Дүкен табылмады'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadStore}>
            <Text style={styles.retryText}>Қайталау</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color={P.ink} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Search')}>
          <Feather name="search" size={20} color={P.ink} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => {
          lastScrollY.current = e.nativeEvent.contentOffset.y;
        }}
        onScrollEndDrag={(e) => rememberScroll(e.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(e) => rememberScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >

        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.topPanel}>
          <View style={styles.topPanelCircle1} />
          <View style={styles.topPanelCircle2} />

          {/* STORE HERO */}
          <View style={styles.storeHero}>
            <View style={styles.storeAvatarWrap}>
              <Feather name="shopping-bag" size={24} color={P.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.storeNameRow}>
                <Text style={styles.storeName}>{store.name}</Text>
                <VerifiedIcon width={20} height={20} />
              </View>
              <Text style={styles.storeType}>Супермаркет</Text>
              <View style={styles.storeAddrRow}>
                <Feather name="map-pin" size={12} color={P.muted} style={{ marginRight: 4 }} />
                <Text style={styles.storeAddr}>{store.address}</Text>
              </View>
            </View>
          </View>

          {/* STATS ROW */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>Тауар</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statBadge}>
                <Feather name="check-circle" size={13} color={P.emerald} />
                <Text style={[styles.statValue, { color: P.emerald, marginLeft: 4 }]}>Ашық</Text>
              </View>
              <Text style={styles.statLabel}>Жұмыс режимі</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: P.amber }]}>4.8 ★</Text>
              <Text style={styles.statLabel}>Рейтинг</Text>
            </View>
          </View>
        </Animated.View>

        {/* DETAILS COLLAPSE */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.detailsCard}>
          <TouchableOpacity
            style={styles.detailsHeader}
            onPress={() => setIsAboutExpanded(!isAboutExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.detailsHeaderLeft}>
              <Feather name="info" size={16} color={P.teal} style={{ marginRight: 8 }} />
              <Text style={styles.detailsHeaderText}>Дүкен туралы</Text>
            </View>
            <Feather name={isAboutExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={P.muted} />
          </TouchableOpacity>
          <Collapsible collapsed={!isAboutExpanded}>
            <View style={styles.detailsBody}>
              <Text style={styles.detailsText}>{store.address}</Text>
              <View style={styles.detailsChip}>
                <Feather name="package" size={12} color={P.teal} style={{ marginRight: 4 }} />
                <Text style={styles.detailsChipText}>{products.length} тауар қол жетімді</Text>
              </View>
            </View>
          </Collapsible>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(190).springify()} style={styles.controlsCard}>
          <View style={styles.searchWrap}>
            <Feather name="search" size={15} color={P.teal} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Тауар іздеу..."
              placeholderTextColor={P.faint}
              value={query}
              onChangeText={handleQueryChange}
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleQueryChange('')}>
                <Feather name="x" size={14} color={P.muted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterChip, inStockOnly && styles.filterChipActive]}
              onPress={handleToggleStock}
              activeOpacity={0.85}
            >
              <Feather name="check-circle" size={13} color={inStockOnly ? '#FFF' : P.muted} />
              <Text style={[styles.filterChipText, inStockOnly && styles.filterChipTextActive]}>Тек бар</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterChip} onPress={cycleSort} activeOpacity={0.85}>
              <Feather name="sliders" size={13} color={P.muted} />
              <Text style={styles.filterChipText}>{SORT_LABELS[sort]}</Text>
            </TouchableOpacity>

            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{totalElements} тауар</Text>
            </View>
          </View>
        </Animated.View>

        {/* SECTION LABEL */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>Тауарлар</Text>
          <Text style={styles.sectionSubText}>Бет {page + 1} / {Math.max(totalPages, 1)}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(210).springify()}>
          {renderPaginationControls()}
        </Animated.View>

        {productsError ? (
          <View style={styles.productsErrorBox}>
            <Text style={styles.productsErrorText}>Тауарлар жүктелмеді. Қайта көріңіз.</Text>
            <TouchableOpacity style={styles.productsRetryBtn} onPress={loadProducts}>
              <Text style={styles.productsRetryText}>Қайталау</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* PRODUCTS GRID */}
        {loadingProducts ? (
          <View style={styles.pageLoadingBox}>
            <ActivityIndicator size="small" color={P.teal} />
            <Text style={styles.pageLoadingText}>Бет жүктелуде...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="package" size={40} color={P.faint} />
            <Text style={styles.emptyText}>
              {(query || inStockOnly) ? 'Сүзгіге сай тауар табылмады' : 'Тауарлар жоқ'}
            </Text>
            {(query || inStockOnly) ? (
              <TouchableOpacity
                style={styles.resetFiltersBtn}
                onPress={() => {
                  setQuery('');
                  setInStockOnly(false);
                  setPage(0);
                }}
              >
                <Text style={styles.resetFiltersText}>Сүзгіні тазалау</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <>
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.productId}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              scrollEnabled={false}
              contentContainerStyle={styles.gridContent}
            />

            <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.bottomPaginationWrap}>
              {renderPaginationControls()}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.bg, paddingTop: Platform.OS === 'android' ? 0 : 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 4 : (StatusBar.currentHeight ?? 0) + 6,
    paddingBottom: 8,
  },
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
  scrollContent: { paddingHorizontal: 14, paddingBottom: 50 },

  topPanel: {
    backgroundColor: P.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.border,
    padding: 14,
    marginTop: 2,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  topPanelCircle1: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(14,165,233,0.08)',
    top: -24,
    right: 18,
  },
  topPanelCircle2: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(245,158,11,0.08)',
    bottom: -18,
    right: -6,
  },

  // Store hero
  storeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  storeAvatarWrap: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: P.tealL,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: P.border,
  },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  storeName: { fontSize: 19, fontWeight: '800', color: P.ink, letterSpacing: -0.3 },
  storeType: { fontSize: 12, color: P.muted, marginBottom: 3 },
  storeAddrRow: { flexDirection: 'row', alignItems: 'center' },
  storeAddr: { fontSize: 12, color: P.muted, flex: 1 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statBadge: { flexDirection: 'row', alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: P.ink },
  statLabel: { fontSize: 11, color: P.muted, marginTop: 3 },
  statDivider: { width: 1, height: 28, backgroundColor: P.border },

  // Details
  detailsCard: {
    backgroundColor: P.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.border,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14,
  },
  detailsHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  detailsHeaderText: { fontSize: 15, fontWeight: '700', color: P.ink },
  detailsBody: { padding: 14, paddingTop: 0, gap: 8 },
  detailsText: { fontSize: 14, color: P.muted, lineHeight: 20 },
  detailsChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: P.tealL, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  detailsChipText: { fontSize: 12, color: P.teal, fontWeight: '600' },

  // Catalog controls
  controlsCard: {
    backgroundColor: P.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.border,
    padding: 12,
    marginBottom: 14,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 12,
    paddingHorizontal: 11,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: P.ink, paddingVertical: 0 },
  filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  filterChip: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: P.teal,
    borderColor: P.teal,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: P.muted },
  filterChipTextActive: { color: '#FFF' },
  countPill: {
    marginLeft: 'auto',
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: P.tealL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countPillText: { fontSize: 12, fontWeight: '700', color: P.teal },

  // Section label
  sectionLabel: { marginBottom: 10 },
  sectionLabelText: { fontSize: 13, fontWeight: '700', color: P.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionSubText: { fontSize: 12, color: P.faint, marginTop: 3 },

  // Pagination
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  bottomPaginationWrap: { marginTop: 4, marginBottom: 4 },
  pageBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pageBtnDisabled: { backgroundColor: '#F8FAFC' },
  pageBtnText: { fontSize: 13, color: P.ink, fontWeight: '700' },
  pageBtnTextDisabled: { color: P.faint },

  // Grid
  gridRow: { justifyContent: 'space-between' },
  gridContent: { paddingBottom: 10 },
  productCard: {
    width: CARD_W,
    backgroundColor: P.surface,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  favBtn: {
    position: 'absolute', top: 10, right: 10, zIndex: 5,
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: P.border,
  },
  cardImageWrap: { height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cardImage: { width: '100%', height: '100%', borderRadius: 10 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: P.ink, lineHeight: 17, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { fontSize: 15, fontWeight: '800', color: P.teal },
  addBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: P.teal,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: P.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 15, color: P.rose, marginBottom: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: P.teal, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700' },
  productsErrorBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  productsErrorText: { flex: 1, color: '#B91C1C', fontSize: 12, fontWeight: '600' },
  productsRetryBtn: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsRetryText: { color: '#7F1D1D', fontSize: 12, fontWeight: '700' },
  pageLoadingBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  pageLoadingText: { fontSize: 13, color: P.muted, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 15, color: P.faint, fontWeight: '600' },
  resetFiltersBtn: {
    marginTop: 2,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: P.tealL,
    borderWidth: 1,
    borderColor: P.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetFiltersText: { fontSize: 12, fontWeight: '700', color: P.teal },
});
