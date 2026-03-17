import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';

export default function ProfileScreen() {
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
            <TouchableOpacity style={styles.editBadge}>
              <Feather name="camera" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Пользователь'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
        </View>

        {/* Статистика (Карточки) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Покупок</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.5к</Text>
            <Text style={styles.statLabel}>Бонусов</Text>
          </View>
        </View>

        {/* Меню настроек */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Аккаунт</Text>
          <MenuEntry icon="user" title="Личные данные" />
          <MenuEntry icon="shopping-bag" title="История заказов" />
          <MenuEntry icon="credit-card" title="Способы оплаты" />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Настройки</Text>
          <MenuEntry icon="bell" title="Уведомления" />
          <MenuEntry icon="shield" title="Безопасность" />
          <MenuEntry icon="help-circle" title="Поддержка" />
        </View>

        {/* Кнопка выхода */}
        <View style={[styles.menuSection, { marginBottom: 100 }]}>
          <MenuEntry 
            icon="log-out" 
            title="Выйти из аккаунта" 
            color="#EF4444" 
            onPress={() => logout()} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF' },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4AB7B6', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  userName: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  userEmail: { fontSize: 14, color: '#64748B', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 20, justifyContent: 'space-between' },
  statCard: { backgroundColor: '#FFF', width: '48%', padding: 15, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#4AB7B6' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  menuSection: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 8 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500' },
});