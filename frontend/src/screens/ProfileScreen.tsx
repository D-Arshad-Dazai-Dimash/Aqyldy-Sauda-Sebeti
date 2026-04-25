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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { getMyOrders } from '../api/orders';
import { useHeaderLayout } from '../utils/useHeaderLayout';
import type { RootStackParamList } from '../types/navigation';
import { palette } from '../config/palette';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function PressCard({ children, style, onPress, activeOpacity = 0.92, delay = 0 }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(360)}>
      <AnimatedTouchableOpacity
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
    </Animated.View>
  );
}

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

export default function ProfileScreen({ navigation }: Props) {
  const { contentTopOffset } = useHeaderLayout();
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
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingTop: contentTopOffset }]}
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
              <Text style={styles.rolePillText}>
                {role === 'ADMIN' || role === 'ROLE_ADMIN'
                  ? 'Admin'
                  : role === 'MERCHANT' || role === 'ROLE_MERCHANT'
                    ? 'Сатушы'
                    : 'Клиент'}
              </Text>
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

        {(role === 'ADMIN' || role === 'ROLE_ADMIN' || role === 'MERCHANT' || role === 'ROLE_MERCHANT') && (
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
            onPress={() => navigation.navigate('PersonalData')}
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
            onPress={() => navigation.navigate('NotificationsTab')}
            delay={280}
          />
          <MenuEntry
            icon="lock"
            title="PIN-кодты өзгерту"
            subtitle="Жылдам кіру PIN-кодын жаңарту"
            onPress={() => navigation.navigate('ChangePin')}
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
    paddingTop: 0,
    paddingBottom: 130,
  },
  heroCard: {
    backgroundColor: palette.dark,
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: palette.dark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3,
    backgroundColor: palette.gold,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(43,174,154,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(43,174,154,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rolePillText: {
    color: '#7DE8DA',
    fontSize: 12,
    fontWeight: '700',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.4,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statValue: {
    color: '#FFCA28',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: '#7B9B99',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
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
    borderLeftWidth: 3,
    borderLeftColor: palette.mint,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: palette.mintDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 11,
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
    color: palette.text,
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
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderLeftWidth: 3,
    borderLeftColor: palette.rose,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  logoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE4E4',
    marginRight: 10,
  },
  logoutText: {
    flex: 1,
    color: palette.rose,
    fontSize: 15,
    fontWeight: '800',
  },
});
