import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView,
  Platform, 
  StatusBar 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';

export default function ProfileScreen({ navigation }: any) { // navigation қосылды
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const MenuEntry = ({ icon, title, color = '#1E293B', onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '10' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.menuText, { color }]}>{title}</Text>
      <Feather name="chevron-right" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Шапка профиля */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=' + (user?.email || 'User') + '&background=27AE60&color=fff' }} 
              style={styles.avatar} 
            />
          </View>
          <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Пайдаланушы'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
        </View>

        {/* --- БИЗНЕСКЕ ӨТУ БӨЛІМІ --- */}
        <View style={styles.menuSection}>
  <Text style={styles.sectionTitle}>Режим</Text>
  <MenuEntry 
    icon="briefcase" 
    title="Бизнес режимге өту" 
    color="#27AE60" 
    onPress={() => {
      // НАЗАР АУДАР: Навигациямен бірге "ADMIN" режимін қосамыз
      navigation.navigate('BusinessMain', { screen: 'BusinessHome', params: { forceRole: 'ADMIN' } });
    }} 
  />
</View>

        {/* Статистика */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Сатып алу</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.5к</Text>
            <Text style={styles.statLabel}>Бонустар</Text>
          </View>
        </View>

        {/* Меню настроек */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Аккаунт</Text>
          <MenuEntry icon="user" title="Жеке деректер" />
          <MenuEntry icon="shopping-bag" title="Тапсырыстар тарихы" onPress={() => navigation.navigate('Orders')} />
          <MenuEntry icon="bar-chart-2" title="Шығын аналитикасы" onPress={() => navigation.navigate('Analytics')} />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Баптаулар</Text>
          <MenuEntry icon="bell" title="Хабарландырулар" />
          <MenuEntry icon="shield" title="Қауіпсіздік" />
        </View>

        {/* Кнопка выхода */}
        <View style={[styles.menuSection, { marginBottom: 120 }]}>
          <MenuEntry 
            icon="log-out" 
            title="Аккаунттан шығу" 
            color="#EF4444" 
            onPress={() => logout()} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF' },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  userName: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  userEmail: { fontSize: 14, color: '#64748B', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'space-between' },
  statCard: { backgroundColor: '#FFF', width: '48%', padding: 15, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#4AB7B6' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  menuSection: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 8 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500' },
});