import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Platform, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { api } from '../api/client';
import { getBusinessAnalytics } from '../api/businessAnalytics';
import { useLanguageStore } from '../store/languageStore';

export default function BusinessDashboard({ navigation }: any) {
  const language = useLanguageStore((s) => s.language);
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, outOfStock: 0 });
  const [analytics, setAnalytics] = useState<{ totalRevenue: number; totalOrders: number } | null>(null);
  const [userName, setUserName] = useState('');

  const t = language === 'kk'
    ? {
        langName: 'Қазақша',
        languageTitle: 'Тіл',
        languageChanged: 'Тіл қазақшаға ауыстырылды',
        loadError: 'Деректерді жүктеу мүмкін болмады',
        retry: 'Қайта көру',
      }
    : {
        langName: 'Русский',
        languageTitle: 'Язык',
        languageChanged: 'Язык переключен на русский',
        loadError: 'Не удалось загрузить данные',
        retry: 'Повторить',
      };

  // Базадан нақты мәліметтерді алу
  const fetchBusinessData = async () => {
    try {
      const storesRes = await api.get('/api/stores/my');
      const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
      const primaryStore = stores[0];

      if (!primaryStore?.id) {
        setProducts([]);
        setStats({ total: 0, outOfStock: 0 });
        setAnalytics(null);
        setError(null);
        return;
      }

      const [inventoryRes, analyticsRes] = await Promise.all([
        api.get('/api/admin/inventory', { params: { storeId: primaryStore.id } }),
        getBusinessAnalytics('MONTH'),
      ]);

      const content = Array.isArray(inventoryRes.data) ? inventoryRes.data : [];
      setProducts(Array.isArray(content) ? content : []);
      setAnalytics({
        totalRevenue: analyticsRes.totalRevenue,
        totalOrders: analyticsRes.totalOrders,
      });
      setError(null);
      const outOfStockCount = (Array.isArray(content) ? content : [])
        .filter((p: any) => (p.stock || p.quantity || 0) === 0).length;
      setStats({ 
        total: Array.isArray(content) ? content.length : 0, 
        outOfStock: outOfStockCount 
      });
    } catch {
      setError(t.loadError);
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
        <Text style={styles.productName}>{item.productTitle || item.title}</Text>
        <Text style={styles.productCode}>ID: {item.productId || item.id}</Text>
        <Text style={styles.productBarcode}>Barcode: {item.barcode || '-'}</Text>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>{item.price} ₸</Text>
      </View>
      <View style={styles.stockContainer}>
        <Text style={styles.stockLabel}>Қоймада: {item.quantity ?? item.stock ?? 0}</Text>
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
            <TouchableOpacity
              style={styles.langSelector}
              onPress={async () => {
                await toggleLanguage();
                Alert.alert(t.languageTitle, t.languageChanged);
              }}
            >
              <Text style={styles.langText}>{t.langName} </Text>
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

        {analytics && (
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Айлық аналитика</Text>
            <Text style={styles.analyticsText}>Тапсырыстар: {analytics.totalOrders}</Text>
            <Text style={styles.analyticsText}>Түсім: {analytics.totalRevenue.toFixed(0)} ₸</Text>
          </View>
        )}

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
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchBusinessData}>
                <Text style={styles.retryText}>{t.retry}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            products.map((item: any) => <ProductItem key={item.productId || item.id} item={item} />)
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
    paddingTop: 0,
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
  seeAllText: { fontSize: 12, color: '#CBD5E1', fontWeight: '700' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: '#991B1B', fontWeight: '600', marginBottom: 8 },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  analyticsCard: {
    backgroundColor: '#E2F8F5',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
  },
  analyticsTitle: { color: '#0F766E', fontWeight: '800', marginBottom: 6, fontSize: 14 },
  analyticsText: { color: '#115E59', fontWeight: '700', fontSize: 13 },
});