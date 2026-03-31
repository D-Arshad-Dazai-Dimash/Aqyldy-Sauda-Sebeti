import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Image, Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { api } from '../api/client';

export default function BusinessInventoryScreen({ route, navigation }: any) {
  const [activeTab, setActiveTab] = useState<'inStock' | 'outOfStock'>('inStock');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/products', { params: { size: 100 } });
      setAllProducts(res.data?.content || []);
    } catch (e) {
      console.log('Inventory fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const unsubscribe = navigation.addListener('focus', fetchProducts);
    return unsubscribe;
  }, [navigation, fetchProducts]);

  const inStock = allProducts.filter((p) => p.stock > 0);
  const outOfStock = allProducts.filter((p) => p.stock === 0);

  const updateStock = async (item: any, delta: number) => {
    const newStock = (item.stock ?? 0) + delta;
    if (newStock < 0) return;

    setUpdatingId(item.id);
    try {
      await api.put(`/api/admin/products/${item.id}`, {
        title: item.title,
        description: item.description,
        price: item.price,
        barcode: item.barcode,
        stock: newStock,
        discount: item.discount,
        imageUrl: item.imageUrl,
        unit: item.unit,
        weight: item.weight,
        active: item.active,
        categoryIds: item.categoryIds ?? [],
      });
      // Optimistic update
      setAllProducts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, stock: newStock } : p))
      );
    } catch (e: any) {
      Alert.alert('Қате', e?.response?.data?.detail || 'Жаңарту мүмкін болмады');
    } finally {
      setUpdatingId(null);
    }
  };

  const canGoBack = navigation.canGoBack();
  const displayList = activeTab === 'inStock' ? inStock : outOfStock;

  const ProductItem = ({ item }: { item: any }) => {
    const isUpdating = updatingId === item.id;
    return (
      <View style={[styles.productCard, activeTab === 'inStock' ? styles.shadowGreen : styles.shadowRed]}>
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/p1.png')}
          style={styles.productImage}
          resizeMode="contain"
        />

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.title}</Text>
          {item.barcode ? (
            <Text style={styles.productBarcode}>barcode: {item.barcode}</Text>
          ) : null}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{item.price} ₸</Text>
        </View>

        <View style={styles.stockContainer}>
          <Text style={styles.stockLabel}>Қоймада: {item.stock}</Text>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#4AB7B6" />
          ) : (
            <View style={styles.counterRow}>
              <TouchableOpacity onPress={() => updateStock(item, -1)} style={styles.counterBtn}>
                <Feather name="minus" size={12} color="#64748B" />
              </TouchableOpacity>
              <View style={styles.counterDivider} />
              <TouchableOpacity onPress={() => updateStock(item, 1)} style={styles.counterBtn}>
                <Feather name="plus" size={12} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={26} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 26 }} />
        )}
        <Text style={styles.headerTitle}>Түгендеу</Text>
        <TouchableOpacity onPress={fetchProducts}>
          <Feather name="refresh-cw" size={22} color="#4AB7B6" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('inStock')}>
          <Text style={[styles.tabText, activeTab === 'inStock' && styles.activeTabText]}>
            Қоймада бар ({inStock.length})
          </Text>
          {activeTab === 'inStock' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('outOfStock')}>
          <Text style={[styles.tabText, activeTab === 'outOfStock' && styles.activeTabText]}>
            Қоймада жоқ ({outOfStock.length})
          </Text>
          {activeTab === 'outOfStock' && (
            <View style={[styles.activeIndicator, { backgroundColor: '#F04444' }]} />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4AB7B6" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={displayList}
          renderItem={({ item }) => <ProductItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="package" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                {activeTab === 'inStock' ? 'Қоймада тауар жоқ' : 'Бітіп қалған тауар жоқ'}
              </Text>
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
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingTop: 10,
  },
  tab: { alignItems: 'center', paddingVertical: 5 },
  tabText: { fontSize: 16, color: '#94A3B8', fontWeight: '700' },
  activeTabText: { color: '#1E293B' },
  activeIndicator: { width: 40, height: 3, backgroundColor: '#8ED13D', marginTop: 5, borderRadius: 2 },
  listPadding: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 15,
    marginBottom: 20,
    elevation: 8,
  },
  shadowGreen: {
    shadowColor: '#52E342',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  shadowRed: {
    shadowColor: '#F04444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  productImage: { width: 45, height: 45, borderRadius: 12 },
  productInfo: { flex: 2.2, marginLeft: 12 },
  productName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  productBarcode: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  priceContainer: { flex: 1, alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceText: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  stockContainer: { flex: 1.5, alignItems: 'flex-end' },
  stockLabel: { fontSize: 10, color: '#1E293B', marginBottom: 6, fontWeight: '600' },
  counterRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center' },
  counterBtn: { paddingVertical: 5, paddingHorizontal: 8 },
  counterDivider: { width: 1, height: 12, backgroundColor: '#CBD5E1' },
});
