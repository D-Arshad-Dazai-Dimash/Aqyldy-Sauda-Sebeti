import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useIsFocused } from '@react-navigation/native'; // ҚОСТЫҚ
import { api } from '../api/client';

export default function CartScreen({ navigation, route }: any) {
      const isFocused = useIsFocused(); // Экранның белсенді екенін тексереді

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // storeId-ні әзірше '1' деп қалдырамыз немесе навигациядан аламыз
  const storeId = route.params?.storeId || '1';

  const fetchCart = useCallback(async () => {
    try {
      // Бұл жерде api/client ішіндегі IP қолданылады (192.168.0.147)
      const res = await api.get(`/api/cart?storeId=${storeId}`);
      setCartItems(res.data.items || []);
    } catch (e) {
      console.log('Fetch Cart Error:', e);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // Экранға әр кірген сайын (isFocused өзгергенде) себетті жаңартамыз
  useEffect(() => {
    if (isFocused) {
      fetchCart();
    }
  }, [isFocused, fetchCart]);

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      await api.put(`/api/cart/items/${itemId}?storeId=${storeId}`, { quantity: newQty });
      fetchCart();
    } catch (e) {
      console.log('Update Qty Error:', e);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await api.delete(`/api/cart/items/${itemId}?storeId=${storeId}`);
      fetchCart();
    } catch (e) {
      console.log('Remove Item Error:', e);
    }
  };

  // Жалпы соманы есептеу
  const totalPrice = cartItems.reduce((total, item: any) => 
    total + (item.product.price * item.quantity), 0
  );

  const renderItem = (item: any) => (
    <View key={item.id} style={styles.card}>
      <TouchableOpacity 
        style={styles.checkbox} 
        onPress={() => removeItem(item.id)}
      >
        <Feather name="check-square" size={24} color="#4AB7B6" />
      </TouchableOpacity>
      
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.product.image }} 
          style={styles.productImage} 
          defaultSource={require('../assets/p1.png')}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product.name}
        </Text>
        
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
            <Feather name="minus" size={16} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
            <Feather name="plus" size={16} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>{item.product.price * item.quantity}₸</Text>
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
        <TouchableOpacity onPress={() => Alert.alert('Себетті тазалау?')}>
          <Feather name="trash-2" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4AB7B6" style={{flex: 1}} />
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={80} color="#CBD5E1" />
          <Text style={styles.emptyText}>Себет бос</Text>
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
            <Text style={styles.totalPrice}>{totalPrice}₸</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn}>
            <Text style={styles.checkoutText}>Төлеуге өту</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 18, color: '#94A3B8' },
  scrollList: { paddingHorizontal: 20, paddingBottom: 150 },
  card: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  checkbox: { marginRight: 10 },
  imageContainer: {
    width: 80, height: 80, borderRadius: 20, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0'
  },
  productImage: { width: 60, height: 60, resizeMode: 'contain' },
  infoContainer: { flex: 1, marginLeft: 15 },
  productName: { fontSize: 14, fontWeight: '500', color: '#1E293B', marginBottom: 8 },
  controls: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9',
    borderRadius: 10, alignSelf: 'flex-start', padding: 4
  },
  qtyBtn: { padding: 4 },
  qtyText: { marginHorizontal: 12, fontWeight: '600' },
  priceContainer: { justifyContent: 'flex-end', height: '100%', paddingBottom: 5 },
  priceText: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    paddingHorizontal: 20, paddingBottom: 30, backgroundColor: '#FFF',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9'
  },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#64748B' },
  totalPrice: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  checkoutBtn: {
    backgroundColor: '#4AB7B6', height: 60, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', elevation: 4
  },
  checkoutText: { color: '#FFF', fontSize: 18, fontWeight: '700' }
});