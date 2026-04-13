import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: Логотип и Уведомления */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextMain}>Aqyldy</Text>
          <Text style={styles.logoTextSub}>Sebet</Text>
        </View>
        <View style={styles.headerIcons}>
           <TouchableOpacity style={styles.langBtn}>
              <Text style={styles.langText}>Қазақша</Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.iconCircle}>
              <Feather name="bell" size={20} color="#EF4444" />
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Приветствие */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Қайырлы күн!</Text>
          <Text style={styles.userName}>{user?.username || 'Пайдаланушы'}</Text>
        </View>

        {/* Кнопка поиска (как в категориях) */}
        <TouchableOpacity 
          style={styles.searchButton} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Search')}
        >
          <Feather name="search" size={20} color="#94A3B8" />
          <Text style={styles.searchPlaceholder}>Қалаған затыңызды іздеңіз</Text>
        </TouchableOpacity>

        {/* Сетка быстрых сервисов (Тот самый старый стиль) */}
        <View style={styles.grid}>
          <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#DCFCE7' }]}>
            <View style={styles.cardIcon}>
               <Feather name="shopping-cart" size={24} color="#166534" />
            </View>
            <Text style={styles.cardTitle}>Дүкендер</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#E0F2FE' }]}>
            <View style={styles.cardIcon}>
               <Feather name="map-pin" size={24} color="#075985" />
            </View>
            <Text style={styles.cardTitle}>Карта</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#FEE2E2' }]}>
            <View style={styles.cardIcon}>
               <Feather name="percent" size={24} color="#991B1B" />
            </View>
            <Text style={styles.cardTitle}>Акциялар</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#FEF9C3' }]} onPress={() => navigation.navigate('Orders')}>
            <View style={styles.cardIcon}>
               <Feather name="clock" size={24} color="#854D0E" />
            </View>
            <Text style={styles.cardTitle}>Тарихы</Text>
          </TouchableOpacity>
        </View>

        {/* Промо-блок (Минималистичный) */}
        <View style={styles.promoBanner}>
          <View>
            <Text style={styles.promoTitle}>Смарт Сауда</Text>
            <Text style={styles.promoSub}>Тиімді бағаларды тап</Text>
          </View>
          <Feather name="trending-up" size={40} color="#27AE60" />
        </View>

        {/* Кнопка логаута (внизу, чтобы не мешала) */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
           <Feather name="log-out" size={18} color="#94A3B8" />
           <Text style={styles.logoutText}>Жүйеден шығу</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Floating AI Chatbot button */}
      <TouchableOpacity
        style={styles.chatFab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Chatbot')}
      >
        <Feather name="message-circle" size={26} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 15 
  },
  logoContainer: { flexDirection: 'row' },
  logoTextMain: { fontSize: 24, fontWeight: '900', color: '#FDAA5D' },
  logoTextSub: { fontSize: 24, fontWeight: '900', color: '#4AB7B6' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  langBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  langText: { color: '#64748B', fontWeight: '500', marginRight: 4 },
  iconCircle: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 12 },
  
  scrollContent: { paddingBottom: 100 },
  
  welcomeSection: { paddingHorizontal: 20, marginTop: 25 },
  greeting: { fontSize: 16, color: '#64748B' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },

  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 55,
  },
  searchPlaceholder: { marginLeft: 10, color: '#94A3B8', fontSize: 16 },

  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 15, 
    marginTop: 25,
    justifyContent: 'space-between'
  },
  gridCard: {
    width: '46%',
    height: 120,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    marginHorizontal: '2%',
    justifyContent: 'space-between'
  },
  cardIcon: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

  promoBanner: {
    marginHorizontal: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  promoTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  promoSub: { fontSize: 14, color: '#64748B', marginTop: 4 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingBottom: 20
  },
  logoutText: { marginLeft: 8, color: '#94A3B8', fontWeight: '600' },

  chatFab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#4AB7B6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#4AB7B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    zIndex: 100,
  },
});