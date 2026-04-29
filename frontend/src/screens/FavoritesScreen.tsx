import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useFavoritesStore } from '../store/favoritesStore';
import * as ProductsApi from '../api/products';
import type { Product } from '../types/api';
import SkeletonBlock from '../components/SkeletonBlock';
import { ProductCardImage } from '../components/ProductImage';

export default function FavoritesScreen({ navigation }: any) {
  const { favorites, toggleFavorite } = useFavoritesStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const skeletonItems = Array.from({ length: 4 }, (_, index) => ({ id: `favorite-skeleton-${index}` }));

  const loadFavorites = useCallback(async () => {
    if (favorites.length === 0) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const loaded = await ProductsApi.getProductsBatch(favorites);
      setProducts(loaded);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [favorites.join(',')]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const removeItem = (id: string, name: string) => {
    Alert.alert(
      'Өшіру',
      `"${name}" таңдаулылардан өшіресіз бе?`,
      [
        { text: 'Болдырмау', style: 'cancel' },
        {
          text: 'Өшіру',
          style: 'destructive',
          onPress: () => {
            setProducts((prev) => prev.filter((product) => product.id !== id));
            toggleFavorite(id);
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => `${Math.round(price)} ₸`;

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProductScreen', { productId: item.id })}
    >
      <ProductCardImage
        uri={item.imageUrl}
        title={item.title}
        containerStyle={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.id, item.title)}
        >
          <Feather name="trash-2" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderSkeletonItem = ({ item }: { item: { id: string } }) => (
    <View key={item.id} style={styles.card}>
      <SkeletonBlock width={70} height={70} borderRadius={12} />
      <View style={styles.info}>
        <SkeletonBlock height={14} style={styles.skeletonLine} />
        <SkeletonBlock width="55%" height={14} style={styles.skeletonLine} />
      </View>
      <SkeletonBlock width={24} height={24} borderRadius={12} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Таңдаулылар</Text>
        <Text style={styles.count}>{favorites.length} тауар</Text>
      </View>

      {loading && products.length === 0 ? (
        <FlatList
          data={skeletonItems}
          renderItem={renderSkeletonItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
        />
      ) : favorites.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="heart" size={80} color="#CBD5E1" />
          <Text style={styles.emptyText}>Таңдаулылар тізімі бос</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Main', { screen: 'Categories' })}
          >
            <Text style={styles.browseButtonText}>Сатып алуға көшу</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 0,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  count: { fontSize: 14, color: '#64748B', marginTop: 4 },
  list: { padding: 15 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  image: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#F1F5F9' },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  price: { fontSize: 15, fontWeight: '700', color: '#27AE60', marginTop: 4 },
  skeletonLine: { marginBottom: 10 },
  actions: { alignItems: 'center' },
  removeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { fontSize: 18, color: '#64748B', marginTop: 20, fontWeight: '500' },
  browseButton: { marginTop: 20, backgroundColor: '#27AE60', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  browseButtonText: { color: '#FFF', fontWeight: '600' },
});
