import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import FastImage from 'react-native-fast-image';
import { useFavoritesStore } from '../store/favoritesStore';
import { api } from '../api/client';
import { MOCK_PRODUCTS } from '../constants/mockProducts';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - (20 * 2) - 15) / 2;

export default function ProductListScreen({ route, navigation }: any) {
  const { subCategoryName } = route?.params || { subCategoryName: 'Тауарлар' };
  
  const [realProducts, setRealProducts] = useState<any[]>([]); // Типті нақтыладық
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/products');
        setRealProducts(res.data || []);
      } catch (error) {
        console.log('Деректерді алу мүмкін болмады:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = [
    ...realProducts.filter((p: any) => p.subcategory === subCategoryName),
    ...MOCK_PRODUCTS.filter((p: any) => p.subcategory === subCategoryName)
  ];

  const renderProductItem = ({ item }: { item: any }) => {
    const isFav = isFavorite(item.id);

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductScreen', { productId: item.id })}      
      >     
        <TouchableOpacity 
          style={styles.favoriteBtn} 
          onPress={() => toggleFavorite(item.id)}
        >
          <Image 
            source={isFav 
              ? require('../assets/icons/heart.png') 
              : require('../assets/icons/love.png')
            } 
            style={styles.heartIcon} 
          />
        </TouchableOpacity>

        <View style={styles.imageWrapper}>
          <FastImage 
            style={styles.productImage}
            source={
              typeof item.image === 'string' 
                ? { uri: item.image, priority: FastImage.priority.normal } 
                : item.image
            }
            defaultSource={require('../assets/p1.png')}
            resizeMode={FastImage.resizeMode.contain}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.productTitle} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>{item.price} ₸</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={32} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subCategoryName}</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <Feather name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4AB7B6" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          // keyExtractor-дағы id қатесін осылай түзейміз:
          keyExtractor={(item: any, index: number) => (item.id ? item.id.toString() : index.toString())}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Бұл бөлімде әзірге тауарлар жоқ</Text>
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
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  backBtn: { marginLeft: -10, padding: 5 },
  searchBtn: { padding: 5 },
  listPadding: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 5 },
  productCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: 'center',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 4,
  },
  heartIcon: { width: 20, height: 20 },
  imageWrapper: { width: '100%', height: 100, marginBottom: 10 },
  productImage: { width: '100%', height: '100%' },
  infoContainer: { alignItems: 'center', width: '100%' },
  productTitle: { fontSize: 12, fontWeight: '500', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#4AB7B6' },
  // ИНЛАЙН СТИЛЬДЕРДІ ОСЫ ЖЕРГЕ КӨШІРДІК (ESLint үшін):
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
  }
});
