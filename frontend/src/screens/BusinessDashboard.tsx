import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, Platform, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { api } from '../api/client';

export default function BusinessDashboard({ navigation }: any) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, outOfStock: 0 });
  const [userName, setUserName] = useState('');

  // Базадан нақты мәліметтерді алу
  const fetchBusinessData = async () => {
    try {
      const res = await api.get('/api/products', { params: { size: 20 } });
      const content = res.data?.content || [];
      setProducts(content);
      const outOfStockCount = content.filter((p: any) => p.stock === 0).length;
      setStats({ total: content.length, outOfStock: outOfStockCount });
    } catch {
      // silent — dashboard shows empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
    api.get('/api/me').then(r => setUserName(r.data?.name || '')).catch(() => {});
    // Экранға қайта оралғанда тізімді жаңарту
    const unsubscribe = navigation.addListener('focus', fetchBusinessData);
    return unsubscribe;
  }, [navigation]);

  const ProductItem = ({ item }: { item: any }) => (
    <View style={styles.productRow}>
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/p1.png')}
        style={styles.productImage}
        resizeMode="contain"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.title}</Text>
        <Text style={styles.productCode}>ID: {item.id}</Text>
        <Text style={styles.productBarcode}>Barcode: {item.barcode}</Text>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>{item.price} ₸</Text>
      </View>
      <View style={styles.stockContainer}>
        <Text style={styles.stockLabel}>Қоймада: {item.stock}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>Aqyldy<Text style={{color: '#4AB7B6'}}>Sebet</Text></Text>
            <Text style={styles.welcomeText}>Қош келдіңіз</Text>
            <Text style={styles.userName}>{userName || 'Бизнес'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.langSelector} onPress={() => Alert.alert('Тіл', 'Қазіргі уақытта тек қазақ тілі қолданылады.')}>
              <Text style={styles.langText}>Қазақша </Text>
              <Feather name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Profile' })}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200' }} 
                style={styles.avatar} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. STATS */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#8ED13D' }]}>
            <Text style={styles.statTitle}>Толық өнімдер саны</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F04444' }]}>
            <Text style={styles.statTitle}>Қоймада жоқ өнімдер</Text>
            <Text style={styles.statValue}>{stats.outOfStock}</Text>
          </View>
        </View>

        {/* 3. ADD BUTTON - Камераны ашады */}
        <TouchableOpacity 
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('BusinessScan')}
        >
          <Feather name="plus" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Жаңа өнім қосу</Text>
        </TouchableOpacity>

        {/* 4. PRODUCTS LIST */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Өнімдер тізімі</Text>
          {loading ? (
            <ActivityIndicator color="#4AB7B6" />
          ) : (
            products.map((item: any) => <ProductItem key={item.id} item={item} />)
          )}
          <TouchableOpacity onPress={() => navigation.navigate('BusinessInventory')}>
            <Text style={styles.seeAllText}>барлық өнімдер →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Стильдерің өзгеріссіз қалады (styles файлына тиіспейміз)
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, alignItems: 'flex-start' },
  logoText: { fontSize: 22, fontWeight: '900', color: '#FDAA5D', letterSpacing: -0.5 },
  welcomeText: { fontSize: 16, color: '#94A3B8', marginTop: 10, fontWeight: '500' },
  userName: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginTop: 2 },
  headerRight: { alignItems: 'flex-end', justifyContent: 'space-between', height: 80 },
  langSelector: { flexDirection: 'row', alignItems: 'center' },
  langText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  avatar: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#FFF' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { 
    width: '48%', 
    padding: 18, 
    borderRadius: 24, 
    height: 140, 
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  statTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  statValue: { color: '#FFF', fontSize: 36, fontWeight: '900' },

  addButton: { 
    backgroundColor: '#52E342', // LinearGradient қолданбасақ, осы түс жақын
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 30,
    elevation: 5,
    shadowColor: '#52E342',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 }
  },
  addButtonText: { color: '#FFF', fontSize: 20, fontWeight: '800', marginLeft: 10 },

  sectionCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 28, 
    padding: 20, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.04, 
    shadowRadius: 15 
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 15 },
  
  productRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F8FAFC' 
  },
  productImage: { width: 45, height: 45, borderRadius: 12 },
  productInfo: { flex: 2, marginLeft: 12 },
  productName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  productCode: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  productBarcode: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 1 },

  priceContainer: { flex: 1.2, alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceText: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  editBtn: { marginLeft: 6, padding: 2 },

  stockContainer: { flex: 1.5, alignItems: 'flex-end' },
  stockLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 6, fontWeight: '600' },
  counterRow: { 
    flexDirection: 'row', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 10, 
    alignItems: 'center',
    padding: 2
  },
  counterBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  counterDivider: { width: 1, height: 14, backgroundColor: '#CBD5E1' },

  seeAllBtn: { alignSelf: 'flex-end', marginTop: 15, paddingVertical: 5 },
  seeAllText: { fontSize: 12, color: '#CBD5E1', fontWeight: '700' }
});