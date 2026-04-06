import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useIsFocused } from '@react-navigation/native';
import { useCartStore } from '../store/cartStore';

export default function CartScreen({ navigation }: any) {
  const isFocused = useIsFocused();

  const { cart, storeId, loading, fetchCart, updateItem, removeItem, clearCart } = useCartStore();
  const cartItems = cart?.items ?? [];

  const load = useCallback(() => {
    if (storeId) {
      fetchCart(storeId);
    }
  }, [storeId, fetchCart]);

  useEffect(() => {
    if (isFocused) {
      load();
    }
  }, [isFocused, load]);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (!storeId) return;
    if (newQty < 1) {
      handleRemove(itemId);
      return;
    }
    try {
      await updateItem(storeId, itemId, newQty);
    } catch (e: any) {
      Alert.alert('Қате', e?.message || 'Жаңарту мүмкін болмады');
    }
  };

  const handleRemove = (itemId: string) => {
    if (!storeId) return;
    Alert.alert(
      'Өшіру',
      'Тауарды себеттен өшіресіз бе?',
      [
        { text: 'Болдырмау', style: 'cancel' },
        {
          text: 'Өшіру',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItem(storeId, itemId);
            } catch (e: any) {
              Alert.alert('Қате', e?.message || 'Өшіру мүмкін болмады');
            }
          },
        },
      ]
    );
  };

  const handleClear = () => {
    if (!storeId || cartItems.length === 0) return;
    Alert.alert(
      'Себетті тазалау',
      'Барлық тауарларды себеттен өшіресіз бе?',
      [
        { text: 'Болдырмау', style: 'cancel' },
        {
          text: 'Тазалау',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart(storeId);
            } catch (e: any) {
              Alert.alert('Қате', e?.message || 'Тазалау мүмкін болмады');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (!storeId || cartItems.length === 0) return;
    navigation.navigate('PaymentScreen', { storeId, total: cart?.total ?? 0 });
  };

  const totalPrice = cart?.total ?? 0;

  const renderItem = (item: any) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/p1.png')}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={2}>{item.productTitle || item.title}</Text>
        <Text style={styles.unitPrice}>{item.price} ₸</Text>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => handleUpdateQty(item.id, item.quantity - 1)}
            style={styles.qtyBtn}
          >
            <Feather name="minus" size={16} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => handleUpdateQty(item.id, item.quantity + 1)}
            style={styles.qtyBtn}
          >
            <Feather name="plus" size={16} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rightCol}>
        <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeBtn}>
          <Feather name="trash-2" size={18} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.lineTotal}>{Number(item.lineTotal).toFixed(0)} ₸</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={30} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Себет</Text>
        <TouchableOpacity onPress={handleClear}>
          <Feather name="trash-2" size={24} color={cartItems.length > 0 ? '#EF4444' : '#CBD5E1'} />
        </TouchableOpacity>
      </View>

      {loading && cartItems.length === 0 ? (
        <ActivityIndicator size="large" color="#4AB7B6" style={{ flex: 1 }} />
      ) : !storeId ? (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={80} color="#CBD5E1" />
          <Text style={styles.emptyText}>Алдымен тауар таңдаңыз</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.browseBtnText}>Дүкенге өту</Text>
          </TouchableOpacity>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={80} color="#CBD5E1" />
          <Text style={styles.emptyText}>Себет бос</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.browseBtnText}>Тауар таңдау</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollList}>
          {cartItems.map(renderItem)}
        </ScrollView>
      )}

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Жалпы:</Text>
            <Text style={styles.totalPrice}>{Number(totalPrice).toFixed(0)} ₸</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, loading && styles.disabledBtn]}
            onPress={handleCheckout}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.checkoutText}>Төлеу</Text>
            )}
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
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
  scrollList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 160 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  imageContainer: {
    width: 75,
    height: 75,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productImage: { width: 55, height: 55 },
  infoContainer: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  unitPrice: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    alignSelf: 'flex-start',
    padding: 4,
  },
  qtyBtn: { padding: 5 },
  qtyText: { marginHorizontal: 12, fontWeight: '700', fontSize: 15, color: '#1E293B' },
  rightCol: { alignItems: 'flex-end', justifyContent: 'space-between', height: 75, paddingVertical: 4 },
  removeBtn: { padding: 4 },
  lineTotal: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  footer: {
    position: 'absolute',
    bottom: 80, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 10,
  },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  totalLabel: { fontSize: 16, color: '#64748B' },
  totalPrice: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  checkoutBtn: {
    backgroundColor: '#4AB7B6',
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  disabledBtn: { backgroundColor: '#CBD5E1' },
  checkoutText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
