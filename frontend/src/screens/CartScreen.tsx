import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useIsFocused } from '@react-navigation/native';
import { useCartStore } from '../store/cartStore';
import { getFrequentlyBoughtTogether } from '../api/recommendations';
import type { RecommendedProduct } from '../types/api';
import SkeletonBlock from '../components/SkeletonBlock';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const palette = {
  background: '#F2F6F7',
  surface: '#FFFFFF',
  surfaceSoft: '#EEF7F7',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#DBE7E7',
  mint: '#2BAE9A',
  mintSoft: '#DFF5F1',
  rose: '#EF4444',
  roseSoft: '#FEF2F2',
};

function PressCard({ children, style, onPress, activeOpacity = 0.92, delay = 0 }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedTouchableOpacity
      entering={FadeInDown.delay(delay).duration(340)}
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
  );
}

export default function CartScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const { cart, storeId, loading, error, fetchCart, updateItem, removeItem, clearCart } = useCartStore();

  const cartItems = useMemo(() => cart?.items ?? [], [cart]);
  const [cartRecs, setCartRecs] = useState<RecommendedProduct[]>([]);
  const skeletonRows = useMemo(() => Array.from({ length: 3 }, (_, index) => index), []);

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

  useEffect(() => {
    if (cartItems.length > 0) {
      const firstProductId = cartItems[0].productId;
      getFrequentlyBoughtTogether(firstProductId, 6)
        .then(setCartRecs)
        .catch(() => {});
    } else {
      setCartRecs([]);
    }
  }, [cartItems]);

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
    Alert.alert('Өшіру', 'Тауарды себеттен өшіресіз бе?', [
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
    ]);
  };

  const handleClear = () => {
    if (!storeId || cartItems.length === 0) return;
    Alert.alert('Себетті тазалау', 'Барлық тауарларды себеттен өшіресіз бе?', [
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
    ]);
  };

  const handleCheckout = () => {
    if (!storeId || cartItems.length === 0) return;
    navigation.navigate('PaymentScreen', { storeId, total: cart?.total ?? 0 });
  };

  const totalPrice = cart?.total ?? 0;

  const renderItem = (item: any, index: number) => (
    <Animated.View key={item.id} entering={FadeInDown.delay(70 + index * 35).duration(300)}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/p1.png')}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productTitle || item.title}
          </Text>
          <Text style={styles.unitPrice}>{item.price} ₸</Text>

          <View style={styles.controls}>
            <TouchableOpacity onPress={() => handleUpdateQty(item.id, item.quantity - 1)} style={styles.qtyBtn}>
              <Feather name="minus" size={16} color={palette.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => handleUpdateQty(item.id, item.quantity + 1)} style={styles.qtyBtn}>
              <Feather name="plus" size={16} color={palette.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rightCol}>
          <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeBtn}>
            <Feather name="trash-2" size={17} color={palette.rose} />
          </TouchableOpacity>
          <Text style={styles.lineTotal}>{Number(item.lineTotal).toFixed(0)} ₸</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="chevron-left" size={22} color={palette.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Себет</Text>
          <Text style={styles.headerSubtitle}>{cartItems.length} тауар</Text>
        </View>

        <TouchableOpacity
          onPress={handleClear}
          style={[styles.headerBtn, cartItems.length === 0 && styles.headerBtnDisabled]}
          disabled={cartItems.length === 0}
        >
          <Feather name="trash-2" size={18} color={cartItems.length > 0 ? palette.rose : '#A7B5C7'} />
        </TouchableOpacity>
      </View>

      {error ? (
        <Animated.View entering={FadeIn.duration(240)} style={styles.errorBanner}>
          <Feather name="alert-circle" size={16} color="#B91C1C" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </Animated.View>
      ) : null}

      {loading && cartItems.length === 0 ? (
        <ScrollView contentContainerStyle={styles.scrollList}>
          {skeletonRows.map((item) => (
            <View key={item} style={styles.card}>
              <SkeletonBlock width={78} height={78} borderRadius={14} />
              <View style={styles.infoContainer}>
                <SkeletonBlock height={14} style={styles.cartSkeletonLine} />
                <SkeletonBlock width="38%" height={12} style={styles.cartSkeletonLine} />
                <SkeletonBlock width={92} height={30} borderRadius={10} />
              </View>
              <View style={styles.rightCol}>
                <SkeletonBlock width={22} height={22} borderRadius={11} />
                <SkeletonBlock width={58} height={16} />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : !storeId ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="shopping-bag" size={56} color="#9DB2C8" />
          </View>
          <Text style={styles.emptyTitle}>Алдымен дүкен таңдаңыз</Text>
          <Text style={styles.emptyDesc}>Категориялардан тауар ашып, себетке қосыңыз.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.browseBtnText}>Дүкенге өту</Text>
          </TouchableOpacity>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="shopping-cart" size={56} color="#9DB2C8" />
          </View>
          <Text style={styles.emptyTitle}>Себет бос</Text>
          <Text style={styles.emptyDesc}>Қалаған тауарды таңдап, осы жерге қосыңыз.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.browseBtnText}>Тауар таңдау</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.ScrollView
          entering={FadeIn.duration(260)}
          contentContainerStyle={styles.scrollList}
          showsVerticalScrollIndicator={false}
        >
          {cartItems.map((item, index) => renderItem(item, index))}

          {cartRecs.length > 0 && (
            <Animated.View entering={FadeInDown.delay(160).duration(320)} style={styles.cartRecsSection}>
              <View style={styles.cartRecsHeader}>
                <View style={styles.aiBadge}>
                  <Feather name="cpu" size={12} color={palette.mint} />
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
                <Text style={styles.cartRecsTitle}>Сізге ұнауы мүмкін</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cartRecsScroll}>
                {cartRecs.map((item) => (
                  <PressCard
                    key={item.id}
                    style={styles.cartRecCard}
                    onPress={() => navigation.navigate('ProductScreen', { productId: item.id, storeId })}
                  >
                    <Image
                      source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/p1.png')}
                      style={styles.cartRecImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.cartRecName} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.cartRecPrice}>{item.price} ₸</Text>
                  </PressCard>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </Animated.ScrollView>
      )}

      {cartItems.length > 0 && (
        <Animated.View entering={FadeInDown.delay(120).duration(320)} style={styles.footer}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Жалпы сома</Text>
            <Text style={styles.totalPrice}>{Number(totalPrice).toFixed(0)} ₸</Text>
          </View>

          <TouchableOpacity
            style={[styles.checkoutBtn, loading && styles.disabledBtn]}
            onPress={handleCheckout}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.checkoutText}>Төлеу</Text>}
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: palette.roseSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  errorBannerText: {
    flex: 1,
    color: '#B91C1C',
    fontWeight: '600',
    fontSize: 13,
  },
  scrollList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 180,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#0B4B4A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imageContainer: {
    width: 78,
    height: 78,
    borderRadius: 14,
    backgroundColor: palette.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8ECEB',
  },
  productImage: {
    width: 58,
    height: 58,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cartSkeletonLine: {
    marginBottom: 10,
  },
  productName: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  unitPrice: {
    color: palette.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 11,
    backgroundColor: '#F3F7F7',
    borderWidth: 1,
    borderColor: '#D9E6E8',
    padding: 3,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  qtyText: {
    marginHorizontal: 12,
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 78,
    paddingVertical: 4,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF4F4',
    borderWidth: 1,
    borderColor: '#FFD7D7',
  },
  lineTotal: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAF0F8',
    marginBottom: 14,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    color: palette.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  browseBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 20,
    backgroundColor: palette.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    shadowColor: '#0B4B4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 6,
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    color: palette.textMuted,
    fontSize: 13,
  },
  totalPrice: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
  },
  checkoutBtn: {
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.mint,
  },
  disabledBtn: {
    backgroundColor: '#A9BCCC',
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  cartRecsSection: {
    marginTop: 14,
  },
  cartRecsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.mintSoft,
    borderWidth: 1,
    borderColor: '#C8ECE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  aiBadgeText: {
    color: '#167B6F',
    fontSize: 11,
    fontWeight: '800',
  },
  cartRecsTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  cartRecsScroll: {
    gap: 10,
    paddingRight: 16,
    paddingBottom: 4,
  },
  cartRecCard: {
    width: 126,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 10,
    shadowColor: '#0B4B4A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 2,
  },
  cartRecImage: {
    width: '100%',
    height: 70,
    borderRadius: 10,
    marginBottom: 7,
    backgroundColor: '#F7FAFA',
  },
  cartRecName: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    minHeight: 30,
  },
  cartRecPrice: {
    color: palette.mint,
    fontSize: 13,
    fontWeight: '900',
  },
});
