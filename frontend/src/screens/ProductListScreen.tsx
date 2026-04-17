import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  Pressable,
  TextInput,
  ActivityIndicator,
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
import { useFavoritesStore } from '../store/favoritesStore';
import { api } from '../api/client';
import SkeletonBlock from '../components/SkeletonBlock';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - (20 * 2) - 15) / 2;

const P = {
  bg: '#F7F8FC',
  surface: '#FFFFFF',
  ink: '#1E293B',
  muted: '#64748B',
  faint: '#94A3B8',
  border: '#E2E8F0',
  teal: '#0EA5E9',
  rose: '#F43F5E',
};

function PressCard({ children, onPress, style }: any) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      onPress={onPress}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function ProductListScreen({ route, navigation }: any) {
  const { subCategoryName, categoryId } = route?.params || { subCategoryName: 'Тауарлар' };

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const skeletonItems = Array.from({ length: 6 }, (_, index) => ({ id: `skeleton-${index}` }));

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: any = { active: true };
        if (categoryId) params.categoryId = categoryId;
        if (subCategoryName) params.subCategory = subCategoryName;
        const res = await api.get('/api/products', { params });
        setProducts(res.data?.content || []);
      } catch {
        setError('Тауарларды жүктеу мүмкін болмады');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId, subCategoryName]);

  const visibleProducts = products.filter((p) =>
    (p?.title ?? '').toLowerCase().includes(query.trim().toLowerCase())
  );

  const renderProductItem = ({ item, index }: { item: any; index: number }) => {
    const isFav = isFavorite(item.id);

    return (
      <Animated.View entering={FadeInDown.delay(index * 35).springify().damping(14)}>
        <PressCard
          style={styles.productCard}
          onPress={() => navigation.navigate('ProductScreen', { productId: item.id })}
        >
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={() => toggleFavorite(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="heart" size={16} color={isFav ? P.rose : P.faint} />
          </TouchableOpacity>

          <View style={styles.imageWrapper}>
            <Image
              style={styles.productImage}
              source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/p1.png')}
              resizeMode="contain"
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.productPrice}>{item.price} ₸</Text>
          </View>
        </PressCard>
      </Animated.View>
    );
  };

  const renderSkeletonItem = () => (
    <View style={styles.productCard}>
      <View style={styles.favoriteBtn}>
        <SkeletonBlock width={16} height={16} borderRadius={8} />
      </View>
      <View style={styles.imageWrapper}>
        <SkeletonBlock height={100} borderRadius={18} />
      </View>
      <View style={styles.infoContainer}>
        <SkeletonBlock height={12} style={styles.skeletonTitle} />
        <SkeletonBlock width="60%" height={12} style={styles.skeletonPrice} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={P.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{subCategoryName}</Text>
        <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate('Search')}>
          <Feather name="search" size={20} color={P.ink} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.searchInlineWrap}>
        <View style={styles.searchInlineBox}>
          <Feather name="search" size={15} color={P.teal} style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Тауар іздеу..."
            placeholderTextColor={P.faint}
            style={styles.searchInlineInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Feather name="x" size={14} color={P.muted} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.countText}>{visibleProducts.length} тауар</Text>
      </Animated.View>

      {loading ? (
        <FlatList
          data={skeletonItems}
          renderItem={renderSkeletonItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listPadding}
          scrollEnabled={false}
        />
      ) : error ? (
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={42} color={P.faint} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Артқа қайту</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleProducts}
          renderItem={renderProductItem}
          keyExtractor={(item: any, index: number) => (item.id ? item.id.toString() : index.toString())}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {query.trim().length > 0 ? (
                <>
                  <Feather name="search" size={38} color={P.faint} />
                  <Text style={styles.emptyText}>Сұраныс бойынша тауар табылмады</Text>
                </>
              ) : (
                <Text style={styles.emptyText}>Бұл бөлімде әзірге тауарлар жоқ</Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 6 : 8,
    paddingBottom: 10,
    backgroundColor: P.bg,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: P.ink, flex: 1, textAlign: 'center' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchInlineWrap: { paddingHorizontal: 20, marginBottom: 8 },
  searchInlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.surface,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInlineInput: { flex: 1, fontSize: 14, color: P.ink, paddingVertical: 0 },
  countText: { fontSize: 12, color: P.muted, fontWeight: '600', paddingLeft: 2 },

  listPadding: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 8 },
  productCard: {
    width: ITEM_WIDTH,
    backgroundColor: P.surface,
    borderRadius: 18,
    padding: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.border,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: 9,
    padding: 6,
    borderWidth: 1,
    borderColor: P.border,
  },
  imageWrapper: { width: '100%', height: 100, marginBottom: 10 },
  productImage: { width: '100%', height: '100%' },
  infoContainer: { width: '100%' },
  productTitle: { fontSize: 12, fontWeight: '600', color: P.ink, lineHeight: 17, marginBottom: 6 },
  productPrice: { fontSize: 15, fontWeight: '800', color: P.teal },
  skeletonTitle: { marginBottom: 8 },
  skeletonPrice: { alignSelf: 'center' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 12,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: P.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: P.faint,
    fontSize: 15,
    textAlign: 'center',
  },
});
