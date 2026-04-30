import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { Camera, useCameraDevice, useCodeScanner, type Code } from 'react-native-vision-camera';
import { api } from '../api/client';
import { getStoresForProduct, type ProductStoreAvailability } from '../api/products';
import { useCartStore } from '../store/cartStore';
import { useShoppingListStore } from '../store/shoppingListStore';
import { useLocationStore } from '../store/locationStore';
import { ProductCardImage } from '../components/ProductImage';

type PreviewProduct = {
  id: string;
  title: string;
  price: number;
  discount?: number | null;
  weight?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  categoryName?: string | null;
};

type ToastType = 'success' | 'info' | 'warn';

export default function ScanScreen({ route, navigation }: any) {
  const mode: 'buyer' | 'business' | 'shoppingList' = route.params?.mode || 'buyer';
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [torch, setTorch] = useState<'off' | 'on'>('off');
  const [listModalVisible, setListModalVisible] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  // Buyer-mode confirmation modal: when set, the camera is paused and a
  // product preview is shown with "Add to cart" / "Cancel" buttons.
  const [pendingProduct, setPendingProduct] = useState<PreviewProduct | null>(null);
  const [adding, setAdding] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: ToastType } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Shopping list
  const { items, load: loadList, incrementCollected } = useShoppingListStore();
  const addToCart = useCartStore((s) => s.addItem);
  const setCartStore = useCartStore((s) => s.setStore);
  const activeStoreId = useLocationStore((s) => s.activeStoreId);
  const setActiveStoreId = useLocationStore((s) => s.setActiveStoreId);
  const initLocation = useLocationStore((s) => s.init);

  const totalItems = items.length;
  const checkedCount = items.filter((it) => it.checked).length;

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
    if (mode === 'shoppingList') {
      loadList();
    }
    // Buyer mode needs an activeStoreId to add items to the cart. Trigger
    // the location store init eagerly so the user doesn't have to wait the
    // full GPS timeout the moment they actually scan something.
    if (mode === 'buyer' && !activeStoreId) {
      initLocation().catch(() => { /* non-fatal */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (text: string, type: ToastType = 'success') => {
    setToast({ text, type });
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const handleShoppingListScan = async (barcode: string) => {
    try {
      const res = await api.get(`/api/products/barcode/${barcode}`);
      const product = res.data;
      if (!product) {
        showToast('Тауар табылмады', 'warn');
        setIsActive(true);
        return;
      }

      // Find matching unchecked item in list
      const matchedItem = items.find(
        (it) => it.productId === product.id && !it.checked,
      );

      if (!matchedItem) {
        // Case B: not in list
        Alert.alert(
          'Тізімде жоқ',
          `"${product.title}" сатып алу тізімінде жоқ`,
          [
            {
              text: 'Себетке қосу',
              onPress: async () => {
                try {
                  const fallbackStore =
                    items.find((it) => it.storeId)?.storeId ?? activeStoreId;
                  if (!fallbackStore) {
                    // No store context anywhere — punt to ProductScreen so
                    // the user can pick a store from the catalog flow
                    // instead of crashing addToCart with a null storeId.
                    showToast('Дүкен таңдаңыз', 'warn');
                    navigation.navigate('ProductScreen', { productId: product.id });
                    return;
                  }
                  await addToCart(fallbackStore, product.id, 1, {
                    productId: product.id,
                    productTitle: product.title,
                    price: product.price,
                    imageUrl: product.imageUrl,
                  });
                  showToast(`${product.title} себетке қосылды`, 'info');
                } catch {
                  showToast('Себетке қосу қатесі', 'warn');
                } finally {
                  setIsActive(true);
                }
              },
            },
            {
              text: 'Өткізіп жіберу',
              style: 'cancel',
              onPress: () => setIsActive(true),
            },
          ],
        );
        return;
      }

      // Case C: already fully collected
      const collected = matchedItem.collectedQuantity ?? 0;
      if (matchedItem.checked || collected >= matchedItem.quantity) {
        showToast(`${matchedItem.title} бұрын қосылған ✓`, 'info');
        setIsActive(true);
        return;
      }

      // Case A: found in list — update collected + cart
      await incrementCollected(matchedItem.id);

      if (matchedItem.storeId) {
        try {
          await addToCart(matchedItem.storeId, matchedItem.productId, 1, {
            productId: matchedItem.productId,
            productTitle: matchedItem.title,
            price: matchedItem.price,
            imageUrl: matchedItem.imageUrl,
          });
        } catch {
          // Cart error is non-blocking
        }
      }

      const newCollected = collected + 1;
      const isComplete = newCollected >= matchedItem.quantity;
      showToast(
        isComplete
          ? `${matchedItem.title} — бітті ✅`
          : `${matchedItem.title} ${newCollected}/${matchedItem.quantity} ✅`,
      );
      setIsActive(true);
    } catch {
      showToast('Тауар табылмады', 'warn');
      setIsActive(true);
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'qr'],
    onCodeScanned: async (codes: Code[]) => {
      if (codes.length > 0 && isActive) {
        setCameraMessage(null);
        setIsActive(false);
        const barcode = codes[0].value;

        if (!barcode) {
          setIsActive(true);
          return;
        }

        if (mode === 'business') {
          navigation.navigate('AddProduct', { barcode });
        } else if (mode === 'shoppingList') {
          await handleShoppingListScan(barcode);
        } else {
          // Buyer mode: scan → look up product → add straight to cart.
          // No confirmation modal, no inventory checks — backend tolerates
          // missing inventory on the cart endpoint, the hard stock check
          // happens at checkout.
          try {
            const res = await api.get(`/api/products/barcode/${barcode}`);
            const product = res.data;
            if (!product) {
              showToast('Тауар табылмады', 'warn');
              setIsActive(true);
              return;
            }

            // Resolve a store id: prefer active, fall back to init().
            let storeId = activeStoreId;
            if (!storeId) {
              try {
                await initLocation();
              } catch { /* ignore */ }
              storeId = useLocationStore.getState().activeStoreId;
            }
            // Last-resort fallback: pick the first known store so the user
            // never gets stuck on a "no store" error after a scan.
            if (!storeId) {
              const known = useLocationStore.getState().knownStores;
              storeId = known[0]?.id ?? null;
              if (storeId) setActiveStoreId(storeId);
            }
            if (!storeId) {
              showToast('Дүкен табылмады', 'warn');
              setIsActive(true);
              return;
            }

            try {
              await addToCart(storeId, product.id, 1, {
                productId: product.id,
                productTitle: product.title,
                price: Number(product.price ?? 0),
                imageUrl: product.imageUrl ?? null,
              });
              showToast(`${product.title} себетке қосылды`, 'success');
            } catch (addErr: any) {
              console.error('[Scan] direct addToCart failed', addErr?.response?.status, addErr?.message);
              showToast('Себетке қосу қатесі', 'warn');
            }
            // Resume the camera so the user can keep scanning.
            setIsActive(true);
          } catch (e: any) {
            console.error('[Scan] product lookup failed', e?.response?.status, e?.message);
            showToast('Тауар табылмады', 'warn');
            setIsActive(true);
          }
        }
      }
    },
  });

  const headerTitle =
    mode === 'business'
      ? 'Тауарды базаға қосу'
      : mode === 'shoppingList'
        ? 'Тізім бойынша сканерлеу'
        : 'Тауарды сканерлеу';

  const closePreview = (resume = true) => {
    setPendingProduct(null);
    if (resume) setIsActive(true);
  };

  const confirmAddToCart = async () => {
    if (!pendingProduct || adding) return;
    setAdding(true);
    try {
      let storeId = activeStoreId;
      if (!storeId) {
        await initLocation();
        storeId = useLocationStore.getState().activeStoreId;
      }
      if (!storeId) {
        showToast('Дүкен табылмады. Картадан таңдаңыз.', 'warn');
        setAdding(false);
        return;
      }
      await addToCart(storeId, pendingProduct.id, 1, {
        productId: pendingProduct.id,
        productTitle: pendingProduct.title,
        price: pendingProduct.price,
        imageUrl: pendingProduct.imageUrl ?? null,
      });
      showToast(`${pendingProduct.title} себетке қосылды`, 'success');
      closePreview(true);
    } catch (e: any) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail || e?.response?.data?.message || e?.message || 'Failed to add';
      console.error('[Scan] addToCart failed', detail, status, e?.response?.data);

      // Specific case: product exists in our catalog but the currently
      // selected store has no inventory for it. The backend returns 400 with
      // detail "Product not available in this store" — show a friendly
      // dialog instead of a cryptic toast, and offer to pick another store
      // from the map.
      const looksLikeNoInventory =
        status === 400 &&
        typeof detail === 'string' &&
        /not available|inventory|жоқ|нет в наличии/i.test(detail);

      if (looksLikeNoInventory) {
        const titleText = pendingProduct?.title ?? 'Тауар';
        // Ask the backend which OTHER stores actually have this item.
        // If we find any, offer a one-tap switch to the closest one
        // (or the one with most stock if we don't have user coords).
        let candidates: ProductStoreAvailability[] = [];
        try {
          candidates = await getStoresForProduct(pendingProduct!.id);
        } catch {
          candidates = [];
        }
        const others = candidates.filter((s) => s.storeId !== activeStoreId);

        if (others.length > 0) {
          const userLoc = useLocationStore.getState().userLocation;
          const ranked = [...others].sort((a, b) => {
            if (userLoc && a.latitude && a.longitude && b.latitude && b.longitude) {
              const da = (a.latitude - userLoc.latitude) ** 2 + (a.longitude - userLoc.longitude) ** 2;
              const db = (b.latitude - userLoc.latitude) ** 2 + (b.longitude - userLoc.longitude) ** 2;
              return da - db;
            }
            return b.quantity - a.quantity;
          });
          const best = ranked[0];

          Alert.alert(
            'Бұл дүкенде жоқ',
            `«${titleText}» қазіргі дүкенде сатылмайды.\n\nБұл тауар бар: ${best.storeName}${best.storeAddress ? '\n' + best.storeAddress : ''}`,
            [
              {
                text: `«${best.storeName}» дүкеніне ауысу`,
                onPress: async () => {
                  // Switch active store + cart store, then retry add.
                  setActiveStoreId(best.storeId);
                  setCartStore(best.storeId);
                  try {
                    await addToCart(best.storeId, pendingProduct!.id, 1, {
                      productId: pendingProduct!.id,
                      productTitle: pendingProduct!.title,
                      price: pendingProduct!.price,
                      imageUrl: pendingProduct!.imageUrl ?? null,
                    });
                    showToast(`${pendingProduct!.title} себетке қосылды`, 'success');
                    closePreview(true);
                  } catch (retryErr: any) {
                    showToast('Себетке қосу қатесі', 'warn');
                    closePreview(true);
                  }
                },
              },
              {
                text: 'Картаны ашу',
                onPress: () => {
                  closePreview(false);
                  navigation.navigate('Map');
                },
              },
              {
                text: 'Болдырмау',
                style: 'cancel',
                onPress: () => closePreview(true),
              },
            ],
          );
        } else {
          // No store has it in stock at all.
          Alert.alert(
            'Қоймада жоқ',
            `«${titleText}» қазір ешбір дүкенде сатылмайды. Кейінірек қайталап көріңіз.`,
            [
              {
                text: 'OK',
                onPress: () => closePreview(true),
              },
            ],
          );
        }
      } else {
        showToast(`Қате: ${detail}`, 'warn');
      }
    } finally {
      setAdding(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text>Камераға рұқсат беріңіз</Text>
      </View>
    );
  }
  if (!device) {
    return (
      <View style={styles.center}>
        <Text>Камера табылмады</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && !listModalVisible && !pendingProduct}
        codeScanner={codeScanner}
        torch={torch}
        onError={(error) => {
          const message = String(error?.message ?? '');
          if (message.toLowerCase().includes('barcode module')) {
            setCameraMessage('Сканер штрих-кода загружается, подождите...');
            return;
          }
          setCameraMessage('Камера қатесі. Қайта ашып көріңіз.');
        }}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* ── Shopping list progress overlay ── */}
      {mode === 'shoppingList' && (
        <View style={styles.listOverlay}>
          <View style={styles.listOverlayInner}>
            <Feather name="clipboard" size={14} color="#FFF" />
            <Text style={styles.listOverlayText}>
              Тізім: {checkedCount} / {totalItems}
            </Text>
            <TouchableOpacity
              style={styles.showListBtn}
              onPress={() => {
                setListModalVisible(true);
                setIsActive(false);
              }}
            >
              <Text style={styles.showListBtnText}>Тізімді көру</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Scan frame ── */}
      <View style={styles.scannerContainer}>
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <View style={styles.scanLine} />
            </View>
            <View style={styles.unfocusedContainer} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>
        <Text style={styles.hintText}>Штрих-кодты жақтаудың ортасына келтіріңіз</Text>
        {!!cameraMessage && <Text style={styles.cameraMessage}>{cameraMessage}</Text>}
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.flashButton}
          onPress={() => setTorch((t) => (t === 'off' ? 'on' : 'off'))}
        >
          <Feather name="zap" size={24} color={torch === 'on' ? '#FCD34D' : '#FFF'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.manualButton} onPress={() => setIsActive(true)}>
          <Text style={styles.manualButtonText}>Қайта сканерлеу</Text>
        </TouchableOpacity>
      </View>

      {/* ── Toast ── */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            { opacity: toastOpacity },
            toast.type === 'warn' && styles.toastWarn,
            toast.type === 'info' && styles.toastInfo,
          ]}
        >
          <Feather
            name={
              toast.type === 'success'
                ? 'check-circle'
                : toast.type === 'warn'
                  ? 'alert-circle'
                  : 'info'
            }
            size={16}
            color="#FFF"
          />
          <Text style={styles.toastText}>{toast.text}</Text>
        </Animated.View>
      )}

      {/* ── Shopping list modal (bottom sheet) ── */}
      <Modal
        visible={listModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setListModalVisible(false);
          setIsActive(true);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Сатып алу тізімі</Text>
                <Text style={styles.modalSub}>
                  {checkedCount} / {totalItems} дайын
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setListModalVisible(false);
                  setIsActive(true);
                }}
              >
                <Feather name="x" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { flex: totalItems > 0 ? checkedCount : 0 },
                ]}
              />
              <View style={{ flex: totalItems > 0 ? totalItems - checkedCount : 1 }} />
            </View>

            <ScrollView
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {items.length === 0 ? (
                <Text style={styles.modalEmpty}>Тізім бос</Text>
              ) : (
                items.map((item) => {
                  const collected = item.collectedQuantity ?? 0;
                  const isDone = item.checked || collected >= item.quantity;
                  return (
                    <View
                      key={item.id}
                      style={[styles.modalItem, isDone && styles.modalItemDone]}
                    >
                      <Feather
                        name={isDone ? 'check-circle' : 'circle'}
                        size={20}
                        color={isDone ? '#4AB7B6' : '#CBD5E1'}
                      />
                      <View style={styles.modalItemInfo}>
                        <Text
                          style={[
                            styles.modalItemTitle,
                            isDone && styles.modalItemTitleDone,
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.modalItemSub}>
                          {isDone
                            ? `${item.quantity} / ${item.quantity} ✓`
                            : `${collected} / ${item.quantity}`}
                        </Text>
                      </View>
                      <Text style={styles.modalItemPrice}>
                        {Math.round(item.price)} ₸
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setListModalVisible(false);
                setIsActive(true);
              }}
            >
              <Text style={styles.doneBtnText}>Жабу</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Buyer-mode product preview modal ── */}
      <Modal
        visible={!!pendingProduct}
        animationType="slide"
        transparent
        onRequestClose={() => closePreview(true)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.previewSheet}>
            <View style={styles.modalHandle} />

            {pendingProduct && (
              <>
                <View style={styles.previewImageWrap}>
                  <ProductCardImage
                    uri={pendingProduct.imageUrl}
                    title={pendingProduct.title}
                    category={pendingProduct.categoryName}
                    containerStyle={styles.previewImage}
                  />
                </View>

                <Text style={styles.previewTitle} numberOfLines={2}>
                  {pendingProduct.title}
                </Text>

                <View style={styles.previewPriceRow}>
                  <Text style={styles.previewPrice}>
                    {Math.round(pendingProduct.price)} ₸
                  </Text>
                  {!!pendingProduct.discount && pendingProduct.discount > 0 && (
                    <View style={styles.previewDiscountChip}>
                      <Text style={styles.previewDiscountText}>
                        -{pendingProduct.discount}%
                      </Text>
                    </View>
                  )}
                  {!!pendingProduct.weight && (
                    <Text style={styles.previewWeight}>
                      {pendingProduct.weight}
                    </Text>
                  )}
                </View>

                {!!pendingProduct.description && (
                  <ScrollView
                    style={styles.previewDescScroll}
                    contentContainerStyle={{ paddingVertical: 4 }}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={styles.previewDesc}>
                      {pendingProduct.description}
                    </Text>
                  </ScrollView>
                )}

                <View style={styles.previewBtnRow}>
                  <TouchableOpacity
                    style={[styles.previewBtn, styles.previewCancelBtn]}
                    onPress={() => closePreview(true)}
                    disabled={adding}
                  >
                    <Feather name="x" size={18} color="#475569" />
                    <Text style={styles.previewCancelText}>Бас тарту</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.previewBtn, styles.previewAddBtn, adding && styles.previewBtnDisabled]}
                    onPress={confirmAddToCart}
                    disabled={adding}
                  >
                    <Feather name="shopping-cart" size={18} color="#FFF" />
                    <Text style={styles.previewAddText}>
                      {adding ? 'Қосылуда...' : 'Себетке қосу'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },

  header: {
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },

  // ── List overlay
  listOverlay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 9,
  },
  listOverlayInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listOverlayText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  showListBtn: {
    backgroundColor: '#4AB7B6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  showListBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // ── Scanner
  scannerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { width: '100%', height: '100%', position: 'absolute' },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  middleContainer: { flexDirection: 'row', height: 250 },
  focusedContainer: { width: 250, position: 'relative' },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4AB7B6',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#4AB7B6',
    top: '50%',
    opacity: 0.8,
  },
  hintText: {
    color: '#FFF',
    fontSize: 14,
    position: 'absolute',
    bottom: 100,
    textAlign: 'center',
    width: '100%',
    fontWeight: '500',
  },

  cameraMessage: {
    marginTop: 10,
    textAlign: 'center',
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // ── Footer
  footer: {
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  flashButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  manualButton: {
    backgroundColor: '#4AB7B6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  manualButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  // ── Toast
  toast: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: '#1A9A88',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  toastWarn: { backgroundColor: '#E63946' },
  toastInfo: { backgroundColor: '#3B82F6' },
  toastText: { color: '#FFF', fontWeight: '700', fontSize: 14, flex: 1 },

  // ── Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress bar
  progressBarBg: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: '#4AB7B6',
    borderRadius: 2,
  },

  // List items
  modalList: { paddingHorizontal: 16, paddingBottom: 8, gap: 2 },
  modalEmpty: { textAlign: 'center', color: '#94A3B8', paddingVertical: 24 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemDone: { opacity: 0.55 },
  modalItemInfo: { flex: 1 },
  modalItemTitle: { color: '#1E293B', fontWeight: '600', fontSize: 14 },
  modalItemTitleDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
  modalItemSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  modalItemPrice: { color: '#4AB7B6', fontWeight: '700', fontSize: 13 },

  doneBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#4AB7B6',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  // ── Buyer-mode product preview modal ──
  previewSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    minHeight: 360,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 18,
  },
  previewImageWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  previewImage: {
    width: 160,
    height: 160,
    borderRadius: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
  },
  previewPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  previewPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0EA5E9',
  },
  previewDiscountChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  previewDiscountText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 12,
  },
  previewWeight: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  previewDescScroll: {
    maxHeight: 90,
    marginBottom: 18,
  },
  previewDesc: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  previewBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  previewCancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  previewCancelText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 15,
  },
  previewAddBtn: {
    backgroundColor: '#0EA5E9',
  },
  previewBtnDisabled: {
    opacity: 0.7,
  },
  previewAddText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
});