import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { productImageSource } from '../components/ProductImage';
import { useShoppingListStore } from '../store/shoppingListStore';
import { useCartStore } from '../store/cartStore';

export default function ShoppingListScreen({ navigation, route }: any) {
  const selectedStoreId: string | undefined = route?.params?.storeId;

  const {
    items,
    loaded,
    loading,
    load,
    toggleChecked,
    setCheckedForIds,
    updateQuantity,
    removeItem,
    clearPurchased,
    clearAll,
  } = useShoppingListStore();

  const addToCart = useCartStore((s) => s.addItem);
  const [buyingStoreId, setBuyingStoreId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(() => {
    if (!selectedStoreId) return items;
    return items.filter((it) => it.storeId === selectedStoreId);
  }, [items, selectedStoreId]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filteredItems>();
    filteredItems.forEach((item) => {
      const key = item.storeId || 'unknown';
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([storeId, list]) => ({
      storeId,
      list,
      unchecked: list.filter((it) => !it.checked),
    }));
  }, [filteredItems]);

  const totalUnchecked = filteredItems.filter((it) => !it.checked).length;

  const buyGroup = async (storeId: string, groupItems: typeof filteredItems) => {
    if (storeId === 'unknown') {
      Alert.alert('Ескерту', 'Бұл тауарларға дүкен таңдалмаған');
      return;
    }

    const targets = groupItems.filter((it) => !it.checked);
    if (targets.length === 0) return;

    setBuyingStoreId(storeId);
    const purchasedIds: string[] = [];

    try {
      for (const item of targets) {
        await addToCart(storeId, item.productId, item.quantity, {
          productId: item.productId,
          productTitle: item.title,
          price: item.price,
          imageUrl: item.imageUrl,
        });
        purchasedIds.push(item.id);
      }
      await setCheckedForIds(purchasedIds, true);
      Alert.alert('Дайын', 'Таңдалған тауарлар себетке қосылды');
    } catch {
      Alert.alert('Қате', 'Себетке қосу кезінде қате шықты');
    } finally {
      setBuyingStoreId(null);
    }
  };

  const onClearAll = () => {
    if (filteredItems.length === 0) return;
    Alert.alert('Тізімді тазалау', 'Барлық позиция өшіріледі. Растайсыз ба?', [
      { text: 'Жоқ', style: 'cancel' },
      { text: 'Иә', style: 'destructive', onPress: () => clearAll() },
    ]);
  };

  if (!loaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color="#4AB7B6" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={22} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Text style={styles.title}>Сатып алу тізімі</Text>
          <Text style={styles.subTitle}>Қалдық: {totalUnchecked}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('ScanScreen', { mode: 'shoppingList' })}
          style={[styles.iconBtn, { marginRight: 6 }, filteredItems.length === 0 && styles.iconBtnDisabled]}
          disabled={filteredItems.length === 0}
        >
          <Feather name="maximize" size={18} color={filteredItems.length === 0 ? '#CBD5E1' : '#4AB7B6'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClearAll} style={styles.iconBtn}>
          <Feather name="trash-2" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.center}>
          <Feather name="clipboard" size={56} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Тізім бос</Text>
          <Text style={styles.emptyText}>Дүкен экранынан тізімге тауар қосыңыз</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {groups.map((group) => (
            <View key={group.storeId} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>
                  {group.storeId === 'unknown' ? 'Дүкенсіз позициялар' : `Дүкен: ${group.storeId}`}
                </Text>
                <TouchableOpacity
                  disabled={buyingStoreId === group.storeId || group.unchecked.length === 0}
                  onPress={() => buyGroup(group.storeId, group.list)}
                  style={[
                    styles.buyBtn,
                    (group.unchecked.length === 0 || buyingStoreId === group.storeId) && styles.buyBtnDisabled,
                  ]}
                >
                  {buyingStoreId === group.storeId ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buyBtnText}>Дүкенде сатып алу</Text>
                  )}
                </TouchableOpacity>
              </View>

              {group.list.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <TouchableOpacity onPress={() => toggleChecked(item.id)} style={styles.checkboxWrap}>
                    <Feather
                      name={item.checked ? 'check-square' : 'square'}
                      size={20}
                      color={item.checked ? '#4AB7B6' : '#94A3B8'}
                    />
                  </TouchableOpacity>

                  <Image
                    source={productImageSource({ uri: item.imageUrl, title: item.title })}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, item.checked && styles.checkedText]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemPrice}>{Math.round(item.price)} ₸</Text>
                  </View>

                  <View style={styles.qtyWrap}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} style={styles.qtyBtn}>
                      <Feather name="minus" size={14} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>
                      {(item.collectedQuantity ?? 0) > 0
                        ? `${item.collectedQuantity}/${item.quantity}`
                        : item.quantity}
                    </Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                      <Feather name="plus" size={14} color="#1E293B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                      <Feather name="x" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}

          <TouchableOpacity style={styles.clearPurchasedBtn} onPress={clearPurchased}>
            <Text style={styles.clearPurchasedText}>Сатып алынғандарды тазалау</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  iconBtnDisabled: { opacity: 0.4 },
  title: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  subTitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  emptyTitle: { marginTop: 10, fontSize: 18, fontWeight: '700', color: '#1E293B' },
  emptyText: { marginTop: 6, color: '#94A3B8', textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 24, gap: 12 },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  groupTitle: { fontSize: 13, color: '#1E293B', fontWeight: '700' },
  buyBtn: {
    backgroundColor: '#4AB7B6',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnDisabled: { opacity: 0.5 },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkboxWrap: { padding: 4 },
  itemImage: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F8FAFC' },
  itemTitle: { color: '#1E293B', fontWeight: '600', fontSize: 14 },
  checkedText: { textDecorationLine: 'line-through', color: '#94A3B8' },
  itemPrice: { color: '#4AB7B6', fontWeight: '700', marginTop: 3 },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { minWidth: 18, textAlign: 'center', color: '#1E293B', fontWeight: '700' },
  deleteBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  clearPurchasedBtn: {
    marginTop: 6,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearPurchasedText: { color: '#64748B', fontWeight: '700' },
});
