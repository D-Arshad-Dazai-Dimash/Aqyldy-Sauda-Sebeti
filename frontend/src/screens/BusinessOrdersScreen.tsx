import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useIsFocused } from '@react-navigation/native';
import { api } from '../api/client';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Барлығы' },
  { key: 'CREATED', label: 'Жаңа' },
  { key: 'CONFIRMED', label: 'Расталған' },
  { key: 'SHIPPED', label: 'Жолда' },
  { key: 'DELIVERED', label: 'Жеткізілді' },
  { key: 'CANCELLED', label: 'Болдырылмады' },
];

const STATUS_META: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  CREATED:   { color: '#F59E0B', bg: '#FEF3C7', icon: 'clock',        label: 'Жаңа' },
  CONFIRMED: { color: '#3B82F6', bg: '#EFF6FF', icon: 'check-circle', label: 'Расталды' },
  SHIPPED:   { color: '#8B5CF6', bg: '#F5F3FF', icon: 'truck',        label: 'Жолда' },
  DELIVERED: { color: '#22C55E', bg: '#F0FDF4', icon: 'package',      label: 'Жеткізілді' },
  CANCELLED: { color: '#EF4444', bg: '#FEF2F2', icon: 'x-circle',     label: 'Болдырылмады' },
  PAID:      { color: '#3B82F6', bg: '#EFF6FF', icon: 'credit-card',  label: 'Төленді' },
};

function getStatusMeta(status: string) {
  return STATUS_META[status?.toUpperCase()] ?? { color: '#64748B', bg: '#F1F5F9', icon: 'circle', label: status ?? '—' };
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Бүгін ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Кеше ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={[styles.skeletonLine, { width: '40%', height: 14, marginBottom: 8 }]} />
      <View style={[styles.skeletonLine, { width: '25%', height: 12, marginBottom: 16 }]} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={[styles.skeletonLine, { width: '30%', height: 22 }]} />
        <View style={[styles.skeletonLine, { width: '20%', height: 22, borderRadius: 10 }]} />
      </View>
    </View>
  );
}

export default function BusinessOrdersScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      // Always load ALL to compute counts, filter client-side
      const res = await api.get('/api/admin/orders', { params: { size: 100 } });
      setOrders(res.data?.content || []);
    } catch {
      setError('Тапсырыстарды жүктеу мүмкін болмады');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) fetchOrders();
  }, [isFocused, fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(true);
  }, [fetchOrders]);

  // Computed stats
  const activeCount = orders.filter(o => ['CREATED', 'CONFIRMED', 'SHIPPED'].includes(o.status?.toUpperCase())).length;
  const todayRevenue = orders
    .filter(o => {
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    })
    .reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0);

  // Count per status for filter chips
  const countPerStatus = orders.reduce<Record<string, number>>((acc, o) => {
    const s = o.status?.toUpperCase() ?? '';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status?.toUpperCase() === filter);

  const renderItem = ({ item }: { item: any }) => {
    const meta = getStatusMeta(item.status);
    const paymentIcon = item.paymentMethod === 'CASH' ? 'dollar-sign' : 'credit-card';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('BusinessOrderDetail', { orderId: item.id })}
      >
        {/* Colored left accent bar */}
        <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />

        <View style={styles.cardInner}>
          {/* Top row: order id + status badge */}
          <View style={styles.cardRow}>
            <View>
              <Text style={styles.orderId}>№ {item.id?.slice(0, 8).toUpperCase()}</Text>
              <View style={styles.dateRow}>
                <Feather name="calendar" size={11} color="#94A3B8" />
                <Text style={styles.orderDate}> {formatDate(item.createdAt)}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
              <Feather name={meta.icon as any} size={12} color={meta.color} />
              <Text style={[styles.statusText, { color: meta.color }]}>  {meta.label}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Bottom row: amount + payment + arrow */}
          <View style={styles.cardRow}>
            <View>
              <Text style={styles.amountLabel}>Жалпы сома</Text>
              <Text style={styles.amountValue}>{Number(item.totalAmount ?? 0).toLocaleString('ru-RU')} ₸</Text>
            </View>
            <View style={styles.paymentRow}>
              <View style={styles.paymentBadge}>
                <Feather name={paymentIcon} size={12} color="#64748B" />
                <Text style={styles.paymentText}>
                  {item.paymentMethod === 'CASH' ? ' Қолма-қол' : ' Карта'}
                </Text>
              </View>
              <View style={styles.arrowBtn}>
                <Feather name="chevron-right" size={16} color="#4AB7B6" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Тапсырыстар</Text>
          <Text style={styles.headerSub}>{orders.length} тапсырыс барлығы</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchOrders()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="refresh-cw" size={18} color="#4AB7B6" />
        </TouchableOpacity>
      </View>

      {/* ─── Stats row ─── */}
      {!loading && !error && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Feather name="activity" size={18} color="#3B82F6" />
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Белсенді</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Feather name="list" size={18} color="#27AE60" />
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Барлық</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="trending-up" size={18} color="#F59E0B" />
            <Text style={styles.statValue}>{todayRevenue > 0 ? todayRevenue.toLocaleString('ru-RU') + ' ₸' : '—'}</Text>
            <Text style={styles.statLabel}>Бүгін</Text>
          </View>
        </View>
      )}

      {/* ─── Filter chips ─── */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(i) => i.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item: f }) => {
          const cnt = f.key === 'ALL' ? orders.length : (countPerStatus[f.key] ?? 0);
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {f.label}
              </Text>
              {cnt > 0 && (
                <View style={[styles.chipBadge, isActive && styles.chipBadgeActive]}>
                  <Text style={[styles.chipBadgeText, isActive && styles.chipBadgeTextActive]}>{cnt}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* ─── Content ─── */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={styles.list}
          renderItem={() => <SkeletonCard />}
        />
      ) : error ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="wifi-off" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Жүктеу қатесі</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders()}>
            <Feather name="refresh-cw" size={16} color="#FFF" />
            <Text style={styles.retryBtnText}>  Қайта жүктеу</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4AB7B6" colors={['#4AB7B6']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Feather name="inbox" size={36} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Тапсырыс жоқ</Text>
              <Text style={styles.emptyText}>
                {filter === 'ALL' ? 'Әзірге бірде-бір тапсырыс жоқ' : 'Бұл мәртебеде тапсырыс жоқ'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  statCardMiddle: {
    borderWidth: 1.5,
    borderColor: '#27AE6020',
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2, textAlign: 'center' },

  // Filter chips
  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#E6F8F7',
    borderColor: '#4AB7B6',
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#2D9B9A' },
  chipBadge: {
    marginLeft: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chipBadgeActive: { backgroundColor: '#4AB7B6' },
  chipBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  chipBadgeTextActive: { color: '#FFF' },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 120 },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardAccent: {
    width: 5,
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  orderDate: { fontSize: 12, color: '#94A3B8' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  amountLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  amountValue: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F8F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty / error
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', maxWidth: 240 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#27AE60',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // Skeleton
  skeletonLine: {
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
});
