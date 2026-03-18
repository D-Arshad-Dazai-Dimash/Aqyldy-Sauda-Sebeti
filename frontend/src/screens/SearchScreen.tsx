import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { FilterModal } from '../components/FilterModal'; // Сүзгі компонентін ұмытпаймыз

// @ts-ignore
import VerifiedIcon from '../assets/icons/verified.svg'; // SVG импорттау

// ТЕСТТІК МӘЛІМЕТТЕР (Backend келгендей)
const MOCK_STORES_RESULTS = [
  {
    id: '1',
    name: 'Magnum',
    logo: require('../assets/magnum-logo.png'), 
    isVerified: true,
    totalProducts: 325,
    products: [
      { id: 'p1', name: 'Колбаса Narlen', price: '1900 ₸' },
      { id: 'p2', name: 'Докторская', price: '2900 ₸' },
      { id: 'p3', name: 'Папа может', price: '1870 ₸' },
      { id: 'p4', name: 'Колбаса Сливочная', price: '2100 ₸' },
    ],
  },
  {
    id: '2',
    name: 'Small',
    logo: require('../assets/magnum-logo.png'), 
    isVerified: true,
    totalProducts: 150,
    products: [
      { id: 'p5', name: 'Сүт', price: '450 ₸' },
      { id: 'p6', name: 'Айран', price: '380 ₸' },
    ],
  },
];

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState(['Nestle', 'Греческий йогурт', 'Дубайский шоколад', 'Cola']);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // ФИЛЬТР КҮЙЛЕРІ (STATE)
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [priceRange, setPriceRange] = useState([500, 10000]);
  const [selectedStores, setSelectedStores] = useState<string[]>(['Magnum']);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) 
        ? prev.filter((id) => id !== productId) 
        : [...prev, productId]
    );
  };

  const toggleStore = (store: string) => {
    setSelectedStores(prev => 
      prev.includes(store) ? prev.filter(s => s !== store) : [...prev, store]
    );
  };

  const removeHistoryItem = (item: string) => {
    setHistory(history.filter((h) => h !== item));
  };

  const clearHistory = () => setHistory([]);

  // --- ІЗДЕУ НӘТИЖЕЛЕРІН ШЫҒАРАТЫН ФУНКЦИЯ (МАГАЗИНДЕР ОСЫ ЖЕРДЕ) ---
  const renderSearchResults = () => {
    return (
      <ScrollView style={styles.resultsBody} showsVerticalScrollIndicator={false}>
        {MOCK_STORES_RESULTS.map((store) => (
          <View key={store.id} style={styles.storeCard}>
            
            {/* 1. ДҮКЕННІҢ HEADER-І (ОСЫ ЖЕРДІ TouchableOpacity-ГЕ ОРАДЫҚ) */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('StoreScreen', { storeId: store.id })}
              style={styles.storeHeaderRow}
            >
              <View style={styles.storeInfoMain}>
                <Image source={store.logo} style={styles.storeLogo} resizeMode="cover" />
                <View style={styles.storeTitleCol}>
                  <View style={styles.storeNameRow}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    {/* SVG ГАЛОЧКА ОСЫ ЖЕРДЕ */}
                    {store.isVerified && (
                      <VerifiedIcon width={16} height={16} style={styles.verifyIcon} />
                    )}
                  </View>
                  <Text style={styles.productCountText}>{store.totalProducts} өнім</Text>
                </View>
              </View>
              {/* Оң жақтағы стрелка */}
              <View style={styles.arrowBtn}>
                <Feather name="chevron-right" size={24} color="#64748B" />
              </View>
            </TouchableOpacity>

            {/* 2. ТАУАРЛАРДЫҢ КВАДРАТЫ (110x110) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsScroll}>
              {store.products.map((product) => {
                const isFav = favorites.includes(product.id);
                return (
                  <View key={product.id} style={styles.productSquare}>
                    
                    {/* ЖҮРЕКШЕ БАТЫРМАСЫ (Сенің PNG суреттеріңмен) */}
                    <TouchableOpacity 
                      style={styles.favoriteBtn} 
                      onPress={() => toggleFavorite(product.id)}
                    >
                      <Image 
                        source={isFav 
                          ? require('../assets/icons/heart.png') 
                          : require('../assets/icons/love.png')
                        } 
                        style={styles.heartIcon} 
                        resizeMode="contain" 
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER ПЕН ІЗДЕУ ЖОЛАҒЫ */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={32} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.activeSearchInputContainer}>
          <Feather name="search" size={20} color="#000" style={styles.searchIcon} />
          <TextInput 
            autoFocus 
            placeholder="Іздеу" 
            style={styles.activeSearchInput}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
          />
          {/* ФИЛЬТР БАТЫРМАСЫ */}
          <TouchableOpacity onPress={() => setIsFilterVisible(true)}>
            <Feather name="sliders" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ШАРТТЫ ТАҢДАУ */}
      {searchQuery.length > 0 ? renderSearchResults() : (
        <View style={styles.searchBody}>
          <View style={styles.historyTitleRow}>
            <Text style={styles.historyTitle}>Соңғы іздегеніңіз</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearAllText}>Тазалау</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyTags}>
            {history.map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => removeHistoryItem(item)}>
                  <Feather name="x" size={16} color="#94A3B8" style={styles.xIcon} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ФИЛЬТР КОМПОНЕНТІ */}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 10 : 40, 
    paddingBottom: 10,
  },
  backBtn: { marginRight: 10 },
  activeSearchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00449C',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: { marginRight: 10 },
  activeSearchInput: { flex: 1, fontSize: 16, color: '#000', fontWeight: '500', paddingVertical: 0 },
  
  searchBody: { paddingHorizontal: 25, marginTop: 30 },
  historyTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  historyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  clearAllText: { color: '#00449C', fontWeight: '600', fontSize: 14 },
  historyTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  tagText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  xIcon: { marginLeft: 8 },

  resultsBody: { paddingHorizontal: 20, marginTop: 25 },
  storeCard: { marginBottom: 30 },
  storeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  storeInfoMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  storeLogo: { width: 50, height: 50, borderRadius: 12, marginRight: 15, backgroundColor: '#F1F5F9' },
  storeTitleCol: { justifyContent: 'center' },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  storeName: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginRight: 8 },
  verifyIcon: { marginLeft: 6, marginTop: 1 },
  productCountText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  arrowBtn: { padding: 5, marginLeft: 10 },

  productsScroll: { gap: 15, paddingRight: 20 },
  productSquare: {
    width: 110,
    height: 110,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    borderRadius: 10,
    padding: 3,
  },
  heartIcon: { width: 22, height: 22 }
});