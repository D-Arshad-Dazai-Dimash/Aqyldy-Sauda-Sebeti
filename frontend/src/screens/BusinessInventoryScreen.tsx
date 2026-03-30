import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Image, Platform, StatusBar, Dimensions
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const {  } = Dimensions.get('window');

// Мысал деректер
const MOCK_PRODUCTS = Array(10).fill({
  id: '1', name: 'Таңғы ас', code: 'PRD: 001', barcode: '5901234123457', price: '1290 ₸', stock: 21, image: require('../assets/breakfast.png') 
}).map((item, index) => ({ ...item, id: `p${index}` }));

const OUT_OF_STOCK = Array(5).fill({
  id: '4', name: 'Lactel сүті', code: 'PRD: 006', barcode: '2343221567689', price: '840 ₸', stock: 0, image: require('../assets/milk.png')
}).map((item, index) => ({ ...item, id: `o${index}` }));

export default function BusinessInventoryScreen({ route, navigation }: any) {
  const [activeTab, setActiveTab] = useState<'inStock' | 'outOfStock'>('inStock');

  // Dashboard-тан келген параметрді тыңдау
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params]);

  // Навигация тарихын тексеру (Артқа батырмасы үшін)
  const canGoBack = navigation.canGoBack();

  const updateStock = (id: string, delta: number) => {
    console.log(`Update ${id} by ${delta}`);
  };

  const ProductItem = ({ item, isInStock }: { item: any, isInStock: boolean }) => (
    <View style={[
      styles.productCard,
      isInStock ? styles.shadowGreen : styles.shadowRed
    ]}>
      <Image source={item.image} style={styles.productImage} resizeMode="contain" />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCode}>{item.code}</Text>
        <Text style={styles.productBarcode}>barcode: {item.barcode}</Text>
      </View>

      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{item.price}</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Feather name="edit" size={14} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stockContainer}>
        <Text style={styles.stockLabel}>Қоймада: {item.stock}</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity onPress={() => updateStock(item.id, -1)} style={styles.counterBtn}>
            <Feather name="minus" size={12} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.counterDivider} />
          <TouchableOpacity onPress={() => updateStock(item.id, 1)} style={styles.counterBtn}>
            <Feather name="plus" size={12} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* 1. HEADER */}
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={26} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 26 }} /> // Мәзірден кіргенде бос орын қалдырамыз
        )}
        <Text style={styles.headerTitle}>Түгендеу</Text>
        <TouchableOpacity>
          <Feather name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 2. TABS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('inStock')}
        >
          <Text style={[styles.tabText, activeTab === 'inStock' && styles.activeTabText]}>
            Қоймада бар
          </Text>
          {activeTab === 'inStock' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('outOfStock')}
        >
          <Text style={[styles.tabText, activeTab === 'outOfStock' && styles.activeTabText]}>
            Қоймада жоқ
          </Text>
          {activeTab === 'outOfStock' && <View style={[styles.activeIndicator, { backgroundColor: '#F04444' }]} />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'inStock' ? MOCK_PRODUCTS : OUT_OF_STOCK}
        renderItem={({ item }) => (
          <ProductItem item={item} isInStock={activeTab === 'inStock'} />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />
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
    paddingTop: 10
  },
  tab: { alignItems: 'center', paddingVertical: 5 },
  tabText: { fontSize: 18, color: '#94A3B8', fontWeight: '700' },
  activeTabText: { color: '#1E293B' },
  activeIndicator: { 
    width: 40, 
    height: 3, 
    backgroundColor: '#8ED13D', 
    marginTop: 5, 
    borderRadius: 2 
  },

  listPadding: { paddingHorizontal: 20, paddingBottom: 100 },

  // --- ҚАНЫҚ КӨЛЕҢКЕЛЕР ---
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 15,
    marginBottom: 25,
    // Android үшін
    elevation: 10,
  },
  shadowGreen: {
    shadowColor: '#52E342', 
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6, // Өте қанық көлеңке
    shadowRadius: 15, 
  },
  shadowRed: {
    shadowColor: '#F04444', 
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6, 
    shadowRadius: 15,
  },

  productImage: { width: 45, height: 45, borderRadius: 12 },
  productInfo: { flex: 2.2, marginLeft: 12 },
  productName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  productCode: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  productBarcode: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },

  priceContainer: { flex: 1, alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceText: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  editBtn: { marginLeft: 5 },

  stockContainer: { flex: 1.5, alignItems: 'flex-end' },
  stockLabel: { fontSize: 10, color: '#1E293B', marginBottom: 4, fontWeight: '600' },
  counterRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center' },
  counterBtn: { paddingVertical: 5, paddingHorizontal: 8 },
  counterDivider: { width: 1, height: 12, backgroundColor: '#CBD5E1' },
});