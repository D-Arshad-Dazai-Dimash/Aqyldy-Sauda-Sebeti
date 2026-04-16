import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { getOrderById, cancelOrder } from '../api/orders';

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch {
        // order not found — empty state shown below
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('kk-KZ', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={30} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Тапсырыс мәліметі</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4AB7B6" style={{ flex: 1 }} />
      ) : !order ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={60} color="#CBD5E1" />
          <Text style={styles.errorText}>Тапсырыс табылмады</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.orderIdText}>Тапсырыс #{order.id?.slice(0, 8).toUpperCase()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(order.status) + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor(order.status) }]}>
                  {statusLabel(order.status)}
                </Text>
              </View>
            </View>
            <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
          </View>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Тауарлар</Text>
              {order.items.map((item: any, index: number) => (
                <View key={item.id ?? index} style={styles.itemRow}>
                  <Image
                    source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/p1.png')}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.title ?? item.productTitle ?? '—'}</Text>
                    <Text style={styles.itemQty}>{item.quantity} × {Number(item.price ?? 0).toFixed(0)} ₸</Text>
                  </View>
                  <Text style={styles.itemTotal}>{Number(item.lineTotal ?? (item.price * item.quantity) ?? 0).toFixed(0)} ₸</Text>
                </View>
              ))}
            </View>
          )}

          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Жалпы сома</Text>
            <Text style={styles.totalAmount}>{Number(order.totalAmount ?? 0).toFixed(0)} ₸</Text>
          </View>

          {/* Cancel button for CREATED / PAID */}
          {(order.status?.toUpperCase() === 'CREATED' || order.status?.toUpperCase() === 'PAID') && (
            <TouchableOpacity
              style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
              disabled={cancelling}
              onPress={() => {
                Alert.alert(
                  'Тапсырысты болдырмау',
                  'Тапсырысты болдырмауға сенімдісіз бе?',
                  [
                    { text: 'Жоқ', style: 'cancel' },
                    {
                      text: 'Иә, болдырмау',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          setCancelling(true);
                          await cancelOrder(orderId);
                          setOrder((prev: any) => ({ ...prev, status: 'CANCELLED' }));
                          Alert.alert('Дайын', 'Тапсырыс болдырылмады');
                        } catch (e: any) {
                          Alert.alert('Қате', e?.response?.data?.message || 'Болдырмау мүмкін болмады');
                        } finally {
                          setCancelling(false);
                        }
                      },
                    },
                  ],
                );
              }}
            >
              {cancelling ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.cancelBtnText}>Тапсырысты болдырмау</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
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
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  content: { padding: 16, paddingBottom: 60 },
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderIdText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 13, fontWeight: '700' },
  dateText: { fontSize: 13, color: '#94A3B8' },
  section: {
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemImage: { width: 48, height: 48, borderRadius: 10 },
  itemInfo: { flex: 1, marginHorizontal: 12 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  itemQty: { fontSize: 13, color: '#64748B', marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  totalCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  totalLabel: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  totalAmount: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  cancelBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { marginTop: 16, fontSize: 18, color: '#94A3B8', fontWeight: '500' },
});
