import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';
import { getMyOrders } from '../api/orders';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const palette = {
  background: '#F2F6F7',
  surface: '#FFFFFF',
  cardSoft: '#EEF7F7',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#DBE7E7',
  mint: '#2BAE9A',
  mintSoft: '#DFF5F1',
  rose: '#EF4444',
};

function PressCard({ children, style, onPress, activeOpacity = 0.92, delay = 0 }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedTouchableOpacity
      entering={FadeInDown.delay(delay).duration(360)}
      activeOpacity={activeOpacity}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 14, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      }}
      onPress={onPress}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    getMyOrders()
      .then((orders) => setOrderCount(orders?.length ?? 0))
      .catch(() => {});
  }, []);

  const displayName = useMemo(() => {
    return user?.name || user?.email?.split('@')[0] || 'Пайдаланушы';
  }, [user]);

  const MenuEntry = ({ icon, title, subtitle, color = palette.text, onPress, delay = 0 }: any) => (
    <PressCard delay={delay} style={styles.menuItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}14` }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuText, { color }]}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubText}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={18} color="#94A3B8" />
    </PressCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(420)} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatarRing}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2BAE9A&color=fff`,
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.rolePill}>
              <Feather name="shield" size={14} color={palette.mint} />
              <Text style={styles.rolePillText}>{role === 'ADMIN' || role === 'ROLE_ADMIN' ? 'Admin' : 'Клиент'}</Text>
            </View>
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{orderCount}</Text>
              <Text style={styles.statLabel}>Тапсырыс</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue} numberOfLines={1}>
                {user?.phone || '—'}
              </Text>
              <Text style={styles.statLabel}>Телефон</Text>
            </View>
          </View>
        </Animated.View>

        {(role === 'ADMIN' || role === 'ROLE_ADMIN') && (
          <Animated.View entering={FadeInDown.delay(100).duration(360)} style={styles.section}>
            <Text style={styles.sectionTitle}>Режим</Text>
            <MenuEntry
              icon="briefcase"
              title="Бизнес режимге өту"
              subtitle="Сатушы панелі"
              color={palette.mint}
              onPress={() => navigation.navigate('BusinessMain', { screen: 'BusinessHome' })}
              delay={120}
            />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(160).duration(360)} style={styles.section}>
          <Text style={styles.sectionTitle}>Аккаунт</Text>
          <MenuEntry
            icon="user"
            title="Жеке деректер"
            subtitle="Профиль деректерін басқару"
            onPress={() => Alert.alert('Жақын арада', 'Бұл мүмкіндік жақын арада қосылады.')}
            delay={180}
          />
          <MenuEntry
            icon="shopping-bag"
            title="Тапсырыстар тарихы"
            subtitle="Сіздің сатып алуларыңыз"
            onPress={() => navigation.navigate('Orders')}
            delay={220}
          />
          <MenuEntry
            icon="bar-chart-2"
            title="Шығын аналитикасы"
            subtitle="Айлық статистика"
            onPress={() => navigation.navigate('Analytics')}
            delay={260}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(360)} style={styles.section}>
          <Text style={styles.sectionTitle}>Баптаулар</Text>
          <MenuEntry
            icon="bell"
            title="Хабарландырулар"
            subtitle="Жүйе және акция жаңалықтары"
            onPress={() => Alert.alert('Хабарландырулар', 'Жаңа хабарландырулар жоқ.')}
            delay={280}
          />
          <MenuEntry
            icon="shield"
            title="Қауіпсіздік"
            subtitle="Құпия сөз және қорғаныс"
            onPress={() => Alert.alert('Қауіпсіздік', 'Бұл мүмкіндік жақын арада қосылады.')}
            delay={320}
          />
          <MenuEntry
            icon="message-circle"
            title="AI Көмекші"
            subtitle="Жеке смарт көмек"
            color={palette.mint}
            onPress={() => navigation.navigate('Chatbot')}
            delay={360}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360).duration(360)} style={[styles.section, styles.logoutWrap]}>
          <PressCard delay={380} style={styles.logoutCard} onPress={() => logout()}>
            <View style={styles.logoutIcon}>
              <Feather name="log-out" size={18} color={palette.rose} />
            </View>
            <Text style={styles.logoutText}>Аккаунттан шығу</Text>
            <Feather name="arrow-right" size={16} color={palette.rose} />
          </PressCard>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingTop: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 130,
  },
  heroCard: {
    backgroundColor: palette.surface,
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#0B4B4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    backgroundColor: palette.mintSoft,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.mintSoft,
    borderWidth: 1,
    borderColor: '#C8ECE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rolePillText: {
    color: '#167B6F',
    fontSize: 12,
    fontWeight: '700',
  },
  userName: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  userEmail: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.cardSoft,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DBECEB',
  },
  statValue: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: '#7B8A9E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    shadowColor: '#0B4B4A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuSubText: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  logoutWrap: {
    marginBottom: 14,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD7D7',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    marginRight: 10,
  },
  logoutText: {
    flex: 1,
    color: palette.rose,
    fontSize: 15,
    fontWeight: '800',
  },
});
