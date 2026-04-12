import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
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

export default function BusinessOrdersScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { size: 50 };
      if (filter !== 'ALL') params.status = filter;
      const res = await api.get('/api/admin/orders', { params });
      setOrders(res.data?.content || []);
    } catch (e) {
      console.log('Admin orders fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isFocused) fetchOrders();
  }, [isFocused, fetchOrders]);

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('kk-KZ', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CREATED': return '#F59E0B';
      case 'CONFIRMED': return '#3B82F6';
      case 'SHIPPED': return '#8B5CF6';
      case 'DELIVERED': return '#22C55E';
      case 'CANCELLED': return '#EF4444';
      case 'PAID': return '#3B82F6';
      default: return '#64748B';
    }
  };

  const statusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CREATED': return 'Қабылданды';
      case 'CONFIRMED': return 'Расталды';
      case 'SHIPPED': return 'Жолда';
      case 'DELIVERED': return 'Жеткізілді';
      case 'CANCELLED': return 'Болдырылмады';
      case 'PAID': return 'Төленді';
      default: return status ?? '—';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('BusinessOrderDetail', { orderId: item.id })}
    >
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.orderId}>#{item.id?.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
            {statusLabel(item.status)}
          </Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.totalLabel}>Сома:</Text>
        <Text style={styles.totalAmount}>{Number(item.totalAmount ?? 0).toFixed(0)} ₸</Text>
        <Feather name="chevron-right" size={20} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Тапсырыстар</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <Feather name="refresh-cw" size={22} color="#4AB7B6" />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(i) => i.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#4AB7B6" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>Тапсырыс жоқ</Text>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#4AB7B6' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFF' },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  orderDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: '#94A3B8', marginRight: 6 },
  totalAmount: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94A3B8', fontWeight: '500' },
});
