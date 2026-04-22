import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useI18n } from '../i18n/useI18n';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const palette = {
  background: '#F4F9F8',
  surface: '#FFFFFF',
  surfaceSoft: '#E8F5F3',
  text: '#0A1E1D',
  textMuted: '#5A7A78',
  border: '#CCE8E5',
  mint: '#1A9A88',
  mintDark: '#0D6B5C',
  mintSoft: '#D4F0EB',
  rose: '#E63946',
  roseSoft: '#FFF0F0',
  gold: '#D97706',
  goldSoft: '#FEF3C7',
  dark: '#0A2E2C',
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
  const { t } = useI18n();
  const isFocused = useIsFocused();
  const { cart, storeId, loading, error, fetchCart, updateItem, removeItem, clearCart } = useCartStore();

  const cartItems = useMemo(() => cart?.items ?? [], [cart]);
  const [cartRecs, setCartRecs] = useState<RecommendedProduct[]>([]);
  const skeletonRows = useMemo(() => Array.from({ length: 3 }, (_, index) => index), []);
  const lastRecProductRef = useRef<string | null>(null);
  const recRequestRef = useRef(0);

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
    const firstProductId = cartItems[0]?.productId;
    if (!firstProductId) {
      lastRecProductRef.current = null;
      setCartRecs([]);
      return;
    }

    if (lastRecProductRef.current === firstProductId) {
      return;
    }

    lastRecProductRef.current = firstProductId;
    const requestId = recRequestRef.current + 1;
    recRequestRef.current = requestId;

    getFrequentlyBoughtTogether(firstProductId, 6)
      .then((data) => {
        if (recRequestRef.current === requestId) {
          setCartRecs(data);
        }
      })
      .catch(() => {
        if (recRequestRef.current === requestId) {
          setCartRecs([]);
        }
      });
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
      Alert.alert(t('Қате', 'Ошибка'), e?.message || t('Жаңарту мүмкін болмады', 'Не удалось обновить'));
    }
  };

  const handleRemove = (itemId: string) => {
    if (!storeId) return;
    Alert.alert(t('Өшіру', 'Удаление'), t('Тауарды себеттен өшіресіз бе?', 'Удалить товар из корзины?'), [
      { text: t('Болдырмау', 'Отмена'), style: 'cancel' },
      {
        text: t('Өшіру', 'Удалить'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeItem(storeId, itemId);
          } catch (e: any) {
            Alert.alert(t('Қате', 'Ошибка'), e?.message || t('Өшіру мүмкін болмады', 'Не удалось удалить'));
          }
        },
      },
    ]);
  };

  const handleClear = () => {
    if (!storeId || cartItems.length === 0) return;
    Alert.alert(t('Себетті тазалау', 'Очистить корзину'), t('Барлық тауарларды себеттен өшіресіз бе?', 'Удалить все товары из корзины?'), [
      { text: t('Болдырмау', 'Отмена'), style: 'cancel' },
      {
        text: t('Тазалау', 'Очистить'),
        style: 'destructive',
        onPress: async () => {
          try {
            await clearCart(storeId);
          } catch (e: any) {
            Alert.alert(t('Қате', 'Ошибка'), e?.message || t('Тазалау мүмкін болмады', 'Не удалось очистить'));
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

  const renderItem = (item: any, index: number) => {
    const unitPrice = Number.isFinite(Number(item.price)) ? Number(item.price) : 0;
    const lineTotal = Number.isFinite(Number(item.lineTotal))
      ? Number(item.lineTotal)
      : unitPrice * Number(item.quantity ?? 0);

    return (
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
          <Text style={styles.unitPrice}>{unitPrice.toFixed(0)} ₸</Text>

          <View style={styles.controls}>
            <TouchableOpacity onPress={() => handleUpdateQty(item.id, item.quantity - 1)} style={styles.qtyBtn}>
              <Feather name="minus" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => handleUpdateQty(item.id, item.quantity + 1)} style={styles.qtyBtn}>
              <Feather name="plus" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rightCol}>
          <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeBtn}>
            <Feather name="trash-2" size={17} color={palette.rose} />
          </TouchableOpacity>
          <Text style={styles.lineTotal}>{lineTotal.toFixed(0)} ₸</Text>
        </View>
      </View>
    </Animated.View>
  );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="chevron-left" size={22} color={palette.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t('Себет', 'Корзина')}</Text>
          <Text style={styles.headerSubtitle}>{cartItems.length} {t('тауар', 'товаров')}</Text>
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
          <Text style={styles.emptyTitle}>{t('Алдымен дүкен таңдаңыз', 'Сначала выберите магазин')}</Text>
          <Text style={styles.emptyDesc}>{t('Категориялардан тауар ашып, себетке қосыңыз.', 'Откройте товары в категориях и добавьте в корзину.')}</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.browseBtnText}>{t('Дүкенге өту', 'Перейти к магазину')}</Text>
          </TouchableOpacity>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="shopping-cart" size={56} color="#9DB2C8" />
          </View>
          <Text style={styles.emptyTitle}>{t('Себет бос', 'Корзина пуста')}</Text>
          <Text style={styles.emptyDesc}>{t('Қалаған тауарды таңдап, осы жерге қосыңыз.', 'Выберите товары и добавьте их сюда.')}</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.browseBtnText}>{t('Тауар таңдау', 'Выбрать товары')}</Text>
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
                <Text style={styles.cartRecsTitle}>{t('Сізге ұнауы мүмкін', 'Вам может понравиться')}</Text>
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
                    <Text style={styles.cartRecPrice}>{Number(item.price ?? 0).toFixed(0)} ₸</Text>
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
            <Text style={styles.totalLabel}>{t('Жалпы сома', 'Итого')}</Text>
            <Text style={styles.totalPrice}>{Number(totalPrice).toFixed(0)} ₸</Text>
          </View>

          <TouchableOpacity
            style={[styles.checkoutBtn, loading && styles.disabledBtn]}
            onPress={handleCheckout}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.checkoutText}>{t('Төлеу', 'Оплатить')}</Text>}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: palette.background,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(10,30,29,0.08)',
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnDisabled: {
    opacity: 0.4,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: palette.text,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
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
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 190,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderLeftWidth: 3,
    borderLeftColor: palette.mint,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 13,
    marginBottom: 10,
    shadowColor: palette.mintDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: palette.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  productImage: {
    width: 62,
    height: 62,
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
    marginBottom: 3,
    lineHeight: 19,
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
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 3,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.mint,
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
    height: 80,
    paddingVertical: 4,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.roseSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  lineTotal: {
    color: palette.gold,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surfaceSoft,
    borderWidth: 2,
    borderColor: palette.border,
    marginBottom: 16,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    color: palette.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },
  browseBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 24,
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
    bottom: 86,
    backgroundColor: palette.dark,
    borderRadius: 22,
    padding: 16,
    shadowColor: palette.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  totalPrice: {
    color: '#FFCA28',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  checkoutBtn: {
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.mint,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  disabledBtn: {
    backgroundColor: '#3A5A58',
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  cartRecsSection: {
    marginTop: 16,
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
    borderColor: '#A8DDD7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  aiBadgeText: {
    color: palette.mintDark,
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
