import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
  Modal, FlatList, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { api } from '../api/client';
import { getCategories } from '../api/categories';
import type { Category as BackendCategory } from '../types/api';
import { PRODUCT_CATEGORIES } from '../constants/categories';

// Frontend category id → backend slug(s) mapping
const FRONTEND_TO_BACKEND_SLUGS: Record<string, string[]> = {
  'c1': ['meat', 'fruits', 'vegetables'],  // Азық-түлік
  'c2': ['dairy'],                          // Сүт өнімдері
  'c3': ['drinks'],                         // Сусындар
  'c4': ['snacks'],                         // Тәттілер
  'c5': ['bakery'],                         // Нан өнімдері
  'c6': ['household'],                      // Тұрмыстық химия
  'c7': ['personal-care'],                  // Гигиена
  'c8': [],                                 // Үй жануарларына
};

// Which frontend categories show weight/volume field
const WEIGHT_CATEGORY_IDS = ['c1', 'c2', 'c3', 'c5'];

type FrontendCategory = typeof PRODUCT_CATEGORIES[number];

export default function AddProductScreen({ route, navigation }: any) {
  const { barcode } = route.params;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [weight, setWeight] = useState('');

  // Photo: we keep the local URI for preview and the base64 data URL
  // that we send to the backend so the image is persisted in PostgreSQL
  // (works on ephemeral PaaS like DigitalOcean App Platform).
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Backend categories (for UUID mapping)
  const [backendCategories, setBackendCategories] = useState<BackendCategory[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);

  // Frontend category picker
  const [selectedCategory, setSelectedCategory] = useState<FrontendCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Subcategory picker
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

  useEffect(() => {
    getCategories().then(setBackendCategories).catch(() => {});
    api.get('/api/stores/my')
      .then(res => {
        const stores = res.data;
        if (Array.isArray(stores) && stores.length > 0) {
          setStoreId(stores[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const showWeight = selectedCategory && WEIGHT_CATEGORY_IDS.includes(selectedCategory.id);

  // Get backend category UUIDs for selected frontend category
  const getBackendCategoryIds = (): string[] => {
    if (!selectedCategory) return [];
    const slugs = FRONTEND_TO_BACKEND_SLUGS[selectedCategory.id] || [];
    return backendCategories
      .filter(bc => slugs.includes(bc.slug))
      .map(bc => bc.id);
  };

  // Photo handlers — request base64 so we can persist the image directly in
  // the DB (image_url TEXT column) without needing a writable filesystem.
  const applyPickerResponse = (response: any) => {
    const asset = response?.assets?.[0];
    if (!asset?.uri) return;
    setPhotoUri(asset.uri);
    if (asset.base64) {
      const mime = asset.type || 'image/jpeg';
      setPhotoDataUrl(`data:${mime};base64,${asset.base64}`);
    } else {
      // Picker did not return base64 — we'll fall back to multipart upload.
      setPhotoDataUrl(null);
    }
  };

  const handleTakePhoto = () => {
    setShowPhotoModal(false);
    launchCamera(
      { mediaType: 'photo', maxWidth: 800, maxHeight: 800, quality: 0.8, includeBase64: true },
      applyPickerResponse,
    );
  };

  const handlePickFromGallery = () => {
    setShowPhotoModal(false);
    launchImageLibrary(
      { mediaType: 'photo', maxWidth: 800, maxHeight: 800, quality: 0.8, includeBase64: true },
      applyPickerResponse,
    );
  };

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Қате', 'Тауар атауы мен бағасын толтырыңыз');
      return;
    }

    try {
      setLoading(true);

      const categoryIds = getBackendCategoryIds();

      const payload: any = {
        title: name,
        barcode: String(barcode),
        price: Number(price),
        stock: Number(stock) || 0,
        description: selectedSubcategory || '',
        active: true,
      };

      if (categoryIds.length > 0) {
        payload.categoryIds = categoryIds;
      }

      if (showWeight && weight) {
        payload.weight = weight;
      }

      // Send the photo together with the product create call — the backend
      // stores it directly in the products.image_url column, so it survives
      // container restarts on DigitalOcean App Platform.
      if (photoDataUrl) {
        payload.imageUrl = photoDataUrl;
      }

      // Step 1: create product
      const response = await api.post('/api/admin/products', payload);
      const productId = response.data?.id;

      // Step 2: add to merchant inventory
      if (productId && storeId) {
        try {
          await api.post('/api/admin/inventory', {
            storeId,
            productId,
            quantity: Number(stock) || 0,
          });
        } catch {
          // Inventory can be managed separately from inventory screen
        }
      }

      // Step 3 (fallback): if we have a local URI but no base64 (very rare),
      // upload via multipart so the backend can still encode and store it.
      if (productId && photoUri && !photoDataUrl) {
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: photoUri,
            type: 'image/jpeg',
            name: 'photo.jpg',
          } as any);
          await api.post(`/api/admin/products/${productId}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (error: any) {
          console.warn('Multipart photo upload failed:', error?.message);
        }
      }

      Alert.alert('Сәтті!', 'Тауар базаға қосылды', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Тауарды сақтау мүмкін болмады';
      Alert.alert('Қате', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={32} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Жаңа тауар</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Feather name="barcode" size={24} color="#4AB7B6" />
          <Text style={styles.barcodeLabel}>Штрих-код: </Text>
          <Text style={styles.barcodeValue}>{barcode}</Text>
        </View>

        {/* ====== Фото ====== */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Тауар суреті</Text>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => setShowPhotoModal(true)}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Feather name="camera" size={32} color="#4AB7B6" />
                <Text style={styles.photoPlaceholderText}>Сурет қосу</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ====== Тауар атауы ====== */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Тауар атауы *</Text>
          <TextInput
            style={styles.input}
            placeholder="Мысалы: Сүт Lactel 1л"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* ====== Бағасы ====== */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Бағасы (₸) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* ====== Саны ====== */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Саны (Қоймада)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={stock}
            onChangeText={setStock}
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* ====== Категория picker ====== */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Категория</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Feather name="grid" size={20} color="#4AB7B6" />
            <Text style={[
              styles.pickerText,
              !selectedCategory && styles.pickerPlaceholder,
            ]}>
              {selectedCategory?.name || 'Категорияны таңдаңыз'}
            </Text>
            <Feather name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ====== Субкатегория picker ====== */}
        {selectedCategory && selectedCategory.subcategories.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Саб-категория</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSubcategoryModal(true)}
            >
              <Feather name="layers" size={20} color="#4AB7B6" />
              <Text style={[
                styles.pickerText,
                !selectedSubcategory && styles.pickerPlaceholder,
              ]}>
                {selectedSubcategory || 'Саб-категорияны таңдаңыз'}
              </Text>
              <Feather name="chevron-down" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {/* ====== Көлемі / Салмағы ====== */}
        {showWeight && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Көлемі / Салмағы</Text>
            <TextInput
              style={styles.input}
              placeholder="Мысалы: 0.5 кг, 1л, 500 мл"
              value={weight}
              onChangeText={setWeight}
              placeholderTextColor="#94A3B8"
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Базаға сақтау</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ====== Photo Modal ====== */}
      <Modal visible={showPhotoModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoModal(false)}
        >
          <View style={styles.photoModalContent}>
            <Text style={styles.photoModalTitle}>Сурет қосу</Text>

            <TouchableOpacity style={styles.photoOption} onPress={handleTakePhoto}>
              <View style={styles.photoOptionIcon}>
                <Feather name="camera" size={24} color="#4AB7B6" />
              </View>
              <Text style={styles.photoOptionText}>Камерамен түсіру</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoOption} onPress={handlePickFromGallery}>
              <View style={styles.photoOptionIcon}>
                <Feather name="image" size={24} color="#4AB7B6" />
              </View>
              <Text style={styles.photoOptionText}>Галереядан таңдау</Text>
            </TouchableOpacity>

            {photoUri && (
              <TouchableOpacity
                style={styles.photoOption}
                onPress={() => { setPhotoUri(null); setPhotoDataUrl(null); setShowPhotoModal(false); }}
              >
                <View style={[styles.photoOptionIcon, { backgroundColor: '#FEF2F2' }]}>
                  <Feather name="trash-2" size={24} color="#EF4444" />
                </View>
                <Text style={[styles.photoOptionText, { color: '#EF4444' }]}>Суретті жою</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.photoCancel}
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={styles.photoCancelText}>Бас тарту</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ====== Category Modal ====== */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.listModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Категория таңдау</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Feather name="x" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PRODUCT_CATEGORIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedCategory?.id === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setSelectedSubcategory(null);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedCategory?.id === item.id && styles.modalItemTextSelected,
                  ]}>
                    {item.name.replace('\n', ' ')}
                  </Text>
                  {selectedCategory?.id === item.id && (
                    <Feather name="check" size={20} color="#4AB7B6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ====== Subcategory Modal ====== */}
      <Modal visible={showSubcategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.listModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Саб-категория таңдау</Text>
              <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
                <Feather name="x" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={selectedCategory?.subcategories || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedSubcategory === item && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedSubcategory(item);
                    setShowSubcategoryModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedSubcategory === item && styles.modalItemTextSelected,
                  ]}>
                    {item}
                  </Text>
                  {selectedSubcategory === item && (
                    <Feather name="check" size={20} color="#4AB7B6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  content: { padding: 20, paddingBottom: 40 },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2F1',
    padding: 15, borderRadius: 15, marginBottom: 25,
  },
  barcodeLabel: { marginLeft: 10, fontSize: 16, color: '#1E293B' },
  barcodeValue: { fontSize: 16, fontWeight: 'bold', color: '#4AB7B6' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF', padding: 15, borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, color: '#1E293B',
  },

  // Photo
  photoButton: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%', height: 200, borderRadius: 14,
  },
  photoPlaceholder: {
    height: 140, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  photoPlaceholderText: {
    marginTop: 8, fontSize: 15, color: '#94A3B8', fontWeight: '600',
  },

  // Picker
  pickerButton: {
    backgroundColor: '#FFF', padding: 15, borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    flexDirection: 'row', alignItems: 'center',
  },
  pickerText: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1E293B' },
  pickerPlaceholder: { color: '#94A3B8' },

  // Save
  saveButton: {
    backgroundColor: '#4AB7B6', padding: 18, borderRadius: 15,
    alignItems: 'center', marginTop: 20, elevation: 5,
  },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  // Modals common
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  // Photo modal
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
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
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

  // List modals (category, subcategory)
  listModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#F8F9FA',
  },
  modalItemSelected: { backgroundColor: '#E0F2F1' },
  modalItemText: { fontSize: 16, color: '#1E293B' },
  modalItemTextSelected: { color: '#4AB7B6', fontWeight: '700' },
});
