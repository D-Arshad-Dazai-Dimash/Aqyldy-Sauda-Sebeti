import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import * as ScanApi from '../api/scan';
import * as StoresApi from '../api/stores';
import type { Store } from '../types/api';

export default function ScanScreen({ navigation }: any) {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);

  useEffect(() => {
    StoresApi.getStores().then((data) => {
      setStores(data);
      if (data.length > 0) setSelectedStore(data[0]);
    }).catch(() => {});
  }, []);

  const handleScan = async (code: string) => {
    if (!selectedStore) {
      Alert.alert('Select store', 'Please select a store first');
      return;
    }
    if (!code.trim()) {
      Alert.alert('Error', 'Enter a barcode');
      return;
    }

    setScanning(true);
    try {
      const result = await ScanApi.scanBarcode(selectedStore.id, code.trim());
      setShowManualInput(false);
      setBarcode('');
      // Navigate to product screen with the scan result
      navigation.navigate('ProductScreen', {
        productId: result.id,
        storeId: selectedStore.id,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Product not found for this barcode';
      Alert.alert('Not found', msg);
    } finally {
      setScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan product</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Store selector */}
      <TouchableOpacity style={styles.storeSelector} onPress={() => setShowStorePicker(true)}>
        <Feather name="map-pin" size={16} color="#4AB7B6" />
        <Text style={styles.storeSelectorText}>
          {selectedStore ? selectedStore.name : 'Select store...'}
        </Text>
        <Feather name="chevron-down" size={16} color="#94A3B8" />
      </TouchableOpacity>

      {/* Scanner zone */}
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

        <Text style={styles.hintText}>
          Point camera at barcode{'\n'}
          <Text style={styles.hintSubText}>(Camera coming soon — use manual input)</Text>
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.flashButton}>
          <Feather name="zap" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManualInput(true)}
        >
          <Feather name="edit-3" size={16} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.manualButtonText}>Enter barcode manually</Text>
        </TouchableOpacity>
      </View>

      {/* Manual barcode input modal */}
      <Modal visible={showManualInput} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter barcode</Text>
              <TouchableOpacity onPress={() => setShowManualInput(false)}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.barcodeInput}
              placeholder="e.g. 4870200340108"
              placeholderTextColor="#94A3B8"
              value={barcode}
              onChangeText={setBarcode}
              keyboardType="default"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => handleScan(barcode)}
            />

            <TouchableOpacity
              style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
              onPress={() => handleScan(barcode)}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.scanButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Store picker modal */}
      <Modal visible={showStorePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select store</Text>
              <TouchableOpacity onPress={() => setShowStorePicker(false)}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={[
                  styles.storeOption,
                  selectedStore?.id === store.id && styles.storeOptionActive,
                ]}
                onPress={() => {
                  setSelectedStore(store);
                  setShowStorePicker(false);
                }}
              >
                <Text style={styles.storeOptionName}>{store.name}</Text>
                <Text style={styles.storeOptionAddress}>{store.address}</Text>
                {selectedStore?.id === store.id && (
                  <Feather name="check" size={20} color="#4AB7B6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },

  storeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  storeSelectorText: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '500' },

  scannerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { width: '100%', height: '100%', position: 'absolute' },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  middleContainer: { flexDirection: 'row', height: 250 },
  focusedContainer: { width: 250, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#27AE60', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#27AE60', top: '50%', opacity: 0.5 },
  hintText: { color: '#FFF', fontSize: 16, position: 'absolute', bottom: 80, textAlign: 'center', width: '100%' },
  hintSubText: { fontSize: 12, color: '#94A3B8' },

  footer: { height: 120, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  flashButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  manualButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  barcodeInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    fontSize: 18,
    color: '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#4AB7B6',
    height: 55,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonDisabled: { backgroundColor: '#94A3B8' },
  scanButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  storeOptionActive: { backgroundColor: '#E0F7F7', borderWidth: 1, borderColor: '#4AB7B6' },
  storeOptionName: { fontSize: 16, fontWeight: '600', color: '#1E293B', flex: 1 },
  storeOptionAddress: { fontSize: 13, color: '#64748B', marginRight: 10 },
});
