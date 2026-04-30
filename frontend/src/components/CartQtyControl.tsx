import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';
import type { CartItem } from '../types/api';

interface Props {
  productId: string;
  /** Optional explicit storeId. When omitted, uses locationStore.activeStoreId. */
  storeId?: string;
  /** Optimistic metadata for the first add (so the UI doesn't flash empty). */
  optimistic?: Partial<CartItem>;
  /** Compact style for grid cards. */
  size?: 'sm' | 'md';
  /** Container override. */
  style?: ViewStyle;
  /** Called after every successful mutation (refresh hooks, toasts...). */
  onChange?: (newQuantity: number) => void;
}

const COLORS = {
  primary: '#E63946',
  primarySoft: '#FFF0F0',
  text: '#1A1226',
  border: '#FDDCDC',
  surface: '#FFFFFF',
  muted: '#94A3B8',
};

/**
 * Inline – N + control bound to the Zustand cart store.
 * Hidden initial state shows a single + button; once quantity > 0 it expands
 * into a pill with – qty +.
 */
export function CartQtyControl({
  productId,
  storeId: storeIdProp,
  optimistic,
  size = 'md',
  style,
  onChange,
}: Props) {
  const fallbackStoreId = useLocationStore((s) => s.activeStoreId);
  const storeId = storeIdProp ?? fallbackStoreId ?? null;

  // Subscribe to just this product's cart entry.
  const item = useCartStore((s) =>
    s.cart?.items?.find((it) => it.productId === productId) ?? null,
  );
  const addItem = useCartStore((s) => s.addItem);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const [busy, setBusy] = React.useState(false);
  const qty = item?.quantity ?? 0;
  const dim = size === 'sm' ? 28 : 34;
  const navigation = useNavigation<any>();

  if (!storeId) {
    // No active store yet — instead of hiding (which leaves the user
    // wondering why "+" isn't there), surface a tap target that takes
    // them to the map to pick a store.
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Дүкен таңдау"
        testID={`cart-pickstore-${productId}`}
        style={[
          styles.pickStore,
          { height: dim, borderRadius: dim / 2 },
          style,
        ]}
        onPress={() => navigation.navigate('Map')}
      >
        <Feather name="map-pin" size={size === 'sm' ? 12 : 14} color={COLORS.primary} />
        <Text style={styles.pickStoreText} numberOfLines={1}>
          Дүкен
        </Text>
      </TouchableOpacity>
    );
  }

  const guard = async (fn: () => Promise<void>, nextQty: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      onChange?.(nextQty);
    } finally {
      setBusy(false);
    }
  };

  const inc = () =>
    guard(async () => {
      await addItem(storeId, productId, 1, optimistic);
    }, qty + 1);

  const dec = () =>
    guard(async () => {
      if (!item) return;
      if (qty <= 1) {
        await removeItem(storeId, item.id);
      } else {
        await updateItem(storeId, item.id, qty - 1);
      }
    }, Math.max(0, qty - 1));

  if (qty === 0) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Себетке қосу"
        testID={`cart-add-${productId}`}
        style={[
          styles.addBtn,
          { width: dim, height: dim, borderRadius: dim / 2 },
          style,
        ]}
        onPress={inc}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Feather name="plus" size={size === 'sm' ? 14 : 18} color="#FFF" />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.pill,
        { height: dim, borderRadius: dim / 2 },
        style,
      ]}
      testID={`cart-qty-${productId}`}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Азайту"
        testID={`cart-dec-${productId}`}
        style={[styles.pillBtn, { width: dim, height: dim }]}
        onPress={dec}
        disabled={busy}
      >
        <Feather name="minus" size={size === 'sm' ? 14 : 16} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={styles.qty} testID={`cart-qty-text-${productId}`}>
        {qty}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Қосу"
        testID={`cart-inc-${productId}`}
        style={[styles.pillBtn, { width: dim, height: dim }]}
        onPress={inc}
        disabled={busy}
      >
        <Feather name="plus" size={size === 'sm' ? 14 : 16} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 2,
  },
  pillBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  qty: {
    minWidth: 18,
    textAlign: 'center',
    fontWeight: '800',
    color: COLORS.text,
    fontSize: 13,
  },
  pickStore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickStoreText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 11,
  },
});

export default CartQtyControl;
