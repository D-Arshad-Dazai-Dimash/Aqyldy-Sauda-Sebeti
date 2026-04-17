import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
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
import { useIsFocused } from '@react-navigation/native';
import { getMyOrders } from '../api/orders';
import { useI18n } from '../i18n/useI18n';
import { getApiErrorMessage } from '../utils/validation';
import { useHeaderLayout } from '../utils/useHeaderLayout';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const P = {
  bg: '#F3F8F7',
  surface: '#FFFFFF',
  dark: '#0A2422',
  text: '#0A1E1D',
  muted: '#527673',
  border: '#CAE5E1',
  teal: '#1A9A88',
  tealDark: '#0D6B5C',
  tealSoft: '#D6F0EB',
};

function statusConfig(status: string) {
  switch (status?.toUpperCase()) {
    case 'CREATED':   return { color: '#D97706', bg: '#FEF3C7', icon: 'clock' as const };
    case 'CONFIRMED': return { color: '#2563EB', bg: '#EFF6FF', icon: 'check-circle' as const };
    case 'SHIPPED':   return { color: '#7C3AED', bg: '#EDE9FE', icon: 'truck' as const };
    case 'DELIVERED': return { color: '#059669', bg: '#D1FAE5', icon: 'package' as const };
    case 'CANCELLED': return { color: '#DC2626', bg: '#FEE2E2', icon: 'x-circle' as const };
    case 'PAID':      return { color: '#2563EB', bg: '#EFF6FF', icon: 'credit-card' as const };
    default:          return { color: '#64748B', bg: '#F1F5F9', icon: 'help-circle' as const };
  }
}

function OrderCard({ item, language, t, onPress, delay }: any) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cfg = statusConfig(item.status);

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(language === 'kk' ? 'kk-KZ' : 'ru-RU', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const statusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CREATED':   return t('Қабылданды', 'Создан');
      case 'CONFIRMED': return t('Расталды', 'Подтверждён');
      case 'SHIPPED':   return t('Жолда', 'В пути');
      case 'DELIVERED': return t('Жеткізілді', 'Доставлен');
      case 'CANCELLED': return t('Болдырылмады', 'Отменён');
      case 'PAID':      return t('Төленді', 'Оплачен');
      default:          return status ?? '—';
    }
  };

  return (
    <AnimatedTouchableOpacity
      entering={FadeInDown.delay(delay).duration(320)}
      style={[styles.card, anim]}
      activeOpacity={0.9}
      onPressIn={() => { scale.value = withSpring(0.98, { damping: 14, stiffness: 240 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 240 }); }}
      onPress={onPress}
    >
      {/* Left accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />

      <View style={styles.cardBody}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderId}>
              #{item.id?.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {statusLabel(item.status)}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.totalLabel}>{t('Жалпы сома', 'Итого')}</Text>
            <Text style={styles.totalAmount}>{Number(item.totalAmount ?? 0).toFixed(0)} ₸</Text>
          </View>
          <View style={styles.arrowWrap}>
            <Feather name="arrow-right" size={16} color={P.teal} />
          </View>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
}

export default function OrdersScreen({ navigation }: any) {
  const { topPadding, contentTopOffset } = useHeaderLayout();
  const { t, language } = useI18n();
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(getApiErrorMessage(e, language === 'kk' ? 'Тапсырыстарды жүктеу мүмкін болмады' : 'Не удалось загрузить заказы'));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (isFocused) fetchOrders();
  }, [isFocused, fetchOrders]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Dark header */}
      <Animated.View entering={FadeIn.duration(260)} style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={P.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('Тапсырыстарым', 'Мои заказы')}</Text>
          {!loading && orders.length > 0 && (
            <Text style={styles.headerSub}>{orders.length} {t('тапсырыс', 'заказов')}</Text>
          )}
        </View>
        <TouchableOpacity onPress={fetchOrders} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={17} color={P.text} />
        </TouchableOpacity>
      </Animated.View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={P.teal} />
          <Text style={styles.loadingText}>{t('Жүктелуде...', 'Загрузка...')}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Feather name="wifi-off" size={36} color={P.teal} />
          </View>
          <Text style={styles.emptyTitle}>{t('Қосылым қатесі', 'Ошибка подключения')}</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={fetchOrders}>
            <Feather name="refresh-cw" size={15} color="#FFF" />
            <Text style={styles.actionBtnText}>{t('Қайталау', 'Повторить')}</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Feather name="shopping-bag" size={36} color={P.teal} />
          </View>
          <Text style={styles.emptyTitle}>{t('Тапсырыстар жоқ', 'Заказов пока нет')}</Text>
          <Text style={styles.emptyText}>{t('Бірінші тапсырысыңызды беріңіз', 'Сделайте свой первый заказ')}</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Categories')}>
            <Feather name="grid" size={15} color="#FFF" />
            <Text style={styles.actionBtnText}>{t('Тауар таңдау', 'Выбрать товары')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={({ item, index }) => (
            <OrderCard
              item={item}
              language={language}
              t={t}
              delay={index * 45}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingTop: contentTopOffset }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.bg },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(10,30,29,0.08)',
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: P.text, letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: P.muted, marginTop: 2 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(10,30,29,0.08)',
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },

  list: { padding: 14, paddingTop: 0, paddingBottom: 80 },

  card: {
    flexDirection: 'row',
    backgroundColor: P.surface,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: P.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: P.border,
  },
  cardAccent: { width: 4, borderRadius: 0 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderId: { fontSize: 16, fontWeight: '800', color: P.text, letterSpacing: -0.3 },
  orderDate: { fontSize: 12, color: P.muted, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#EDF3F2', marginBottom: 10 },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 11, color: P.muted, marginBottom: 1 },
  totalAmount: { fontSize: 20, fontWeight: '900', color: P.text, letterSpacing: -0.4 },
  arrowWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: P.tealSoft,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: P.border,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: P.tealSoft, borderWidth: 2, borderColor: P.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: P.text, letterSpacing: -0.3, marginBottom: 6 },
  emptyText: { fontSize: 13, color: P.muted, textAlign: 'center', lineHeight: 18, marginBottom: 4 },
  loadingText: { fontSize: 14, color: P.muted, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 18, backgroundColor: P.teal,
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14,
  },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
