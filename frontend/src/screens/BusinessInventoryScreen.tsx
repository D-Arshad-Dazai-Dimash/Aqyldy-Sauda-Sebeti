import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, Platform, StatusBar, ActivityIndicator, Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { productImageSource } from '../components/ProductImage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { api } from '../api/client';

export default function BusinessInventoryScreen({ route, navigation }: any) {
  const [activeTab, setActiveTab] = useState<'inStock' | 'outOfStock'>('inStock');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  // Photo editor for an already-created product
  const [photoTargetId, setPhotoTargetId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params]);

  // Fetch merchant's store
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get('/api/stores/my');
        const stores = res.data;
        if (Array.isArray(stores) && stores.length > 0) {
          setStoreId(stores[0].id);
        }
      } catch {
        // store not found — show empty state
      }
    };
    fetchStore();
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      const res = await api.get('/api/admin/inventory', { params: { storeId } });
      setAllProducts(res.data || []);
    } catch {
      // Fallback to products endpoint
      try {
        const res = await api.get('/api/products', { params: { size: 100 } });
        setAllProducts(res.data?.content || []);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
  }, [storeId, fetchProducts]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (storeId) fetchProducts();
    });
    return unsubscribe;
  }, [navigation, storeId, fetchProducts]);

  const inStock = allProducts.filter((p) => (p.quantity ?? p.stock ?? 0) > 0);
  const outOfStock = allProducts.filter((p) => (p.quantity ?? p.stock ?? 0) === 0);

  // ===== Photo handling for existing products =====
  const sendPhotoToBackend = async (productId: string, dataUrl: string | null, fallbackUri?: string) => {
    try {
      setUploadingPhoto(true);
      let updated: any = null;
      if (dataUrl) {
        // Cheapest path: PUT the data URL via the upsert endpoint.
        // We need to fetch the product first to send a complete payload.
        const current = allProducts.find((p) => (p.productId ?? p.id) === productId) || {};
        const res = await api.put(`/api/admin/products/${productId}`, {
          title: current.productTitle ?? current.title,
          barcode: current.barcode ?? '',
          price: current.price ?? 0,
          stock: current.quantity ?? current.stock ?? 0,
          discount: current.discount ?? null,
          imageUrl: dataUrl,
          unit: current.unit ?? null,
          weight: current.weight ?? null,
          active: current.active !== false,
          categoryIds: current.categoryIds ?? undefined,
        });
        updated = res.data;
      } else if (fallbackUri) {
        // Multipart fallback if base64 was not produced for any reason.
        const formData = new FormData();
        formData.append('file', {
          uri: fallbackUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);
        const res = await api.post(`/api/admin/products/${productId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updated = res.data;
      }

      if (updated?.imageUrl) {
        setAllProducts((prev) =>
          prev.map((p) => {
            const pid = p.productId ?? p.id;
            return pid === productId ? { ...p, imageUrl: updated.imageUrl } : p;
          })
        );
      }
    } catch (e: any) {
      Alert.alert('Қате', e?.response?.data?.message || 'Суретті жаңарту мүмкін болмады');
    } finally {
      setUploadingPhoto(false);
      setPhotoTargetId(null);
    }
  };

  const handlePhotoResponse = (productId: string, response: any) => {
    const asset = response?.assets?.[0];
    if (!asset?.uri) {
      setPhotoTargetId(null);
      return;
    }
    const dataUrl = asset.base64
      ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
      : null;
    sendPhotoToBackend(productId, dataUrl, asset.uri);
  };

  const openCameraForProduct = (productId: string) => {
    launchCamera(
      { mediaType: 'photo', maxWidth: 800, maxHeight: 800, quality: 0.8, includeBase64: true },
      (response) => handlePhotoResponse(productId, response),
    );
  };

  const openGalleryForProduct = (productId: string) => {
    launchImageLibrary(
      { mediaType: 'photo', maxWidth: 800, maxHeight: 800, quality: 0.8, includeBase64: true },
      (response) => handlePhotoResponse(productId, response),
    );
  };

  const updateStock = async (item: any, delta: number) => {
    const currentQty = item.quantity ?? item.stock ?? 0;
    const newQty = currentQty + delta;
    if (newQty < 0) return;

    const productId = item.productId ?? item.id;
    setUpdatingId(productId);
    try {
      await api.post('/api/admin/inventory', {
        storeId,
        productId,
        quantity: newQty,
      });
      // Optimistic update
      setAllProducts((prev) =>
        prev.map((p) => {
          const pid = p.productId ?? p.id;
          return pid === productId ? { ...p, quantity: newQty, stock: newQty } : p;
        })
      );
    } catch (e: any) {
      Alert.alert('Қате', e?.response?.data?.detail || 'Жаңарту мүмкін болмады');
    } finally {
      setUpdatingId(null);
    }
  };

  const canGoBack = navigation.canGoBack();
  const displayList = activeTab === 'inStock' ? inStock : outOfStock;

  const ProductItem = ({ item }: { item: any }) => {
    const isUpdating = updatingId === (item.productId ?? item.id);
    const qty = item.quantity ?? item.stock ?? 0;
    const productId = item.productId ?? item.id;
    return (
      <View style={[styles.productCard, activeTab === 'inStock' ? styles.shadowGreen : styles.shadowRed]}>
        <TouchableOpacity
          onPress={() => setPhotoTargetId(productId)}
          activeOpacity={0.8}
          style={styles.productImageWrap}
        >
          <Image
            source={productImageSource({ uri: item.imageUrl, title: item.productTitle || item.title })}
            style={styles.productImage}
            resizeMode="contain"
          />
          <View style={styles.editPhotoBadge}>
            <Feather name="camera" size={12} color="#FFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.productTitle ?? item.title}</Text>
          {item.barcode ? (
            <Text style={styles.productBarcode}>barcode: {item.barcode}</Text>
          ) : null}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{item.price} ₸</Text>
        </View>

        <View style={styles.stockContainer}>
          <Text style={styles.stockLabel}>Қоймада: {qty}</Text>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#4AB7B6" />
          ) : (
            <View style={styles.counterRow}>
              <TouchableOpacity onPress={() => updateStock(item, -1)} style={styles.counterBtn}>
                <Feather name="minus" size={12} color="#64748B" />
              </TouchableOpacity>
              <View style={styles.counterDivider} />
              <TouchableOpacity onPress={() => updateStock(item, 1)} style={styles.counterBtn}>
                <Feather name="plus" size={12} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={26} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 26 }} />
        )}
        <Text style={styles.headerTitle}>Түгендеу</Text>
        <TouchableOpacity onPress={fetchProducts}>
          <Feather name="refresh-cw" size={22} color="#4AB7B6" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('inStock')}>
          <Text style={[styles.tabText, activeTab === 'inStock' && styles.activeTabText]}>
            Қоймада бар ({inStock.length})
          </Text>
          {activeTab === 'inStock' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('outOfStock')}>
          <Text style={[styles.tabText, activeTab === 'outOfStock' && styles.activeTabText]}>
            Қоймада жоқ ({outOfStock.length})
          </Text>
          {activeTab === 'outOfStock' && (
            <View style={[styles.activeIndicator, { backgroundColor: '#F04444' }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Photo edit modal */}
      <Modal visible={!!photoTargetId} transparent animationType="fade" onRequestClose={() => setPhotoTargetId(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !uploadingPhoto && setPhotoTargetId(null)}
        >
          <View style={styles.photoModalContent}>
            <Text style={styles.photoModalTitle}>Суретті өзгерту</Text>

            {uploadingPhoto ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4AB7B6" />
                <Text style={{ marginTop: 10, color: '#64748B' }}>Жүктелуде...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.photoOption}
                  onPress={() => photoTargetId && openCameraForProduct(photoTargetId)}
                >
                  <View style={styles.photoOptionIcon}>
                    <Feather name="camera" size={24} color="#4AB7B6" />
                  </View>
                  <Text style={styles.photoOptionText}>Камерамен түсіру</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoOption}
                  onPress={() => photoTargetId && openGalleryForProduct(photoTargetId)}
                >
                  <View style={styles.photoOptionIcon}>
                    <Feather name="image" size={24} color="#4AB7B6" />
                  </View>
                  <Text style={styles.photoOptionText}>Галереядан таңдау</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoCancel} onPress={() => setPhotoTargetId(null)}>
                  <Text style={styles.photoCancelText}>Бас тарту</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <ActivityIndicator size="large" color="#4AB7B6" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={displayList}
          renderItem={({ item }) => <ProductItem item={item} />}
          keyExtractor={(item) => item.productId ?? item.id}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="package" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                {activeTab === 'inStock' ? 'Қоймада тауар жоқ' : 'Бітіп қалған тауар жоқ'}
              </Text>
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
    backgroundColor: '#F8F9FA',
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingTop: 10,
  },
  tab: { alignItems: 'center', paddingVertical: 5 },
  tabText: { fontSize: 16, color: '#94A3B8', fontWeight: '700' },
  activeTabText: { color: '#1E293B' },
  activeIndicator: { width: 40, height: 3, backgroundColor: '#8ED13D', marginTop: 5, borderRadius: 2 },
  listPadding: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 15,
    marginBottom: 20,
    elevation: 8,
  },
  shadowGreen: {
    shadowColor: '#52E342',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  shadowRed: {
    shadowColor: '#F04444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  productImageWrap: { width: 45, height: 45, position: 'relative' },
  productImage: { width: 45, height: 45, borderRadius: 12 },
  editPhotoBadge: {
    position: 'absolute', right: -4, bottom: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#4AB7B6', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  photoModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  photoModalTitle: {
    fontSize: 20, fontWeight: '800', color: '#1E293B',
    marginBottom: 20, textAlign: 'center',
  },
  photoOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
  },
  photoOptionIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  photoOptionText: { fontSize: 16, color: '#1E293B', fontWeight: '600' },
  photoCancel: {
    marginTop: 12, paddingVertical: 14,
    alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  photoCancelText: { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
  productInfo: { flex: 2.2, marginLeft: 12 },
  productName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  productBarcode: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  priceContainer: { flex: 1, alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceText: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  stockContainer: { flex: 1.5, alignItems: 'flex-end' },
  stockLabel: { fontSize: 10, color: '#1E293B', marginBottom: 6, fontWeight: '600' },
  counterRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center' },
  counterBtn: { paddingVertical: 5, paddingHorizontal: 8 },
  counterDivider: { width: 1, height: 12, backgroundColor: '#CBD5E1' },
});
