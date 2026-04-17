import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useIsFocused } from '@react-navigation/native';
import { getMyOrders } from '../api/orders';

export default function OrdersScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrders();
      setOrders(data || []);
    } catch {
      setError('Тапсырыстарды жүктеу мүмкін болмады');
    } finally {
      setLoading(false);
    }
  }, []);

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
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.orderId}>Тапсырыс #{item.id?.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
            {statusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.totalLabel}>Жалпы сома:</Text>
        <Text style={styles.totalAmount}>{Number(item.totalAmount ?? 0).toFixed(0)} ₸</Text>
        <Feather name="chevron-right" size={20} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={30} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Тапсырыстарым</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4AB7B6" style={{ flex: 1 }} />
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Feather name="wifi-off" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={fetchOrders}>
            <Text style={styles.browseBtnText}>Қайта көру</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={80} color="#CBD5E1" />
          <Text style={styles.emptyText}>Тапсырыстар жоқ</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.browseBtnText}>Сатып алуға өту</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  list: { padding: 16, paddingBottom: 60 },
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  orderDate: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: { fontSize: 13, fontWeight: '700' },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  totalLabel: { fontSize: 13, color: '#64748B' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginLeft: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyText: { marginTop: 16, fontSize: 18, color: '#94A3B8', fontWeight: '500' },
  browseBtn: {
    marginTop: 20,
    backgroundColor: '#4AB7B6',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  browseBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
