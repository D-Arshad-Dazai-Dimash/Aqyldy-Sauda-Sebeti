import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
<<<<<<< HEAD
  Platform, // ҚОСЫЛДЫ
  StatusBar // ҚОСЫЛДЫ
=======
  ActivityIndicator,
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useFavoritesStore } from '../store/favoritesStore';
import * as ProductsApi from '../api/products';
import type { Product } from '../types/api';

export default function FavoritesScreen({ navigation }: any) {
  const { favorites, toggleFavorite } = useFavoritesStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, [favorites]);

<<<<<<< HEAD
  const removeItem = (id: string) => {
    Alert.alert(
      "Өшіру", // Қазақшаға аудардым
      "Бұл тауарды таңдаулылардан өшіресіз бе?",
      [
        { text: "Болдырмау", style: "cancel" },
        { 
          text: "Өшіру", 
          style: "destructive", 
          onPress: () => setFavorites(prev => prev.filter(item => item.id !== id)) 
        }
=======
  const loadFavorites = async () => {
    if (favorites.length === 0) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      // Load each favorite product (could be optimized with a batch endpoint)
      const results = await Promise.allSettled(
        favorites.map((id) => ProductsApi.getProduct(id))
      );
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<Product> => r.status === 'fulfilled')
        .map((r) => r.value);
      setProducts(loaded);
    } catch {
      // Keep whatever we have
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (id: string, name: string) => {
    Alert.alert(
      'Remove',
      `Remove "${name}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => toggleFavorite(id),
        },
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700
      ]
    );
  };

<<<<<<< HEAD
  const addToCart = (itemName: string) => {
    Alert.alert("Себет", `${itemName} себетке қосылды!`);
  };
=======
  const formatPrice = (price: number) => `${Math.round(price)} \u20B8`;
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProductScreen', { productId: item.id })}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
          <Feather name="package" size={24} color="#CBD5E1" />
        </View>
      )}
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
<<<<<<< HEAD
        <Text style={styles.title}>Таңдаулылар</Text>
        <Text style={styles.count}>{favorites.length} тауар</Text>
=======
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.count}>{favorites.length} items</Text>
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4AB7B6" />
        </View>
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
<<<<<<< HEAD
          <Text style={styles.emptyText}>Таңдаулылар тізімі бос</Text>
          <TouchableOpacity style={styles.browseButton}>
            <Text style={styles.browseButtonText}>Сатып алуға көшу</Text>
=======
          <Text style={styles.emptyText}>No favorites yet</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.browseButtonText}>Browse products</Text>
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700
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
    // Android үшін жоғарғы отступ
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: { 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
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
