import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const { width, height } = Dimensions.get('window');

interface FilterProps {
  isVisible: boolean;
  onClose: () => void;
  priceRange: number[];
  setPriceRange: (values: number[]) => void;
  selectedStores: string[];
  toggleStore: (store: string) => void;
}

const STORES = ['Magnum', 'Small', 'Аян', 'Metro', 'Carefood'];

export const FilterModal = ({
  isVisible,
  onClose,
  priceRange,
  setPriceRange,
  selectedStores,
  toggleStore,
}: FilterProps) => {
  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.closeArea} activeOpacity={1} onPress={onClose} />
        <View style={styles.filterContent}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Сүзгі</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* БАҒА БӨЛІМІ */}
            <View style={styles.section}>
              <Text style={styles.label}>Баға</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{priceRange[0]} ₸</Text>
                <Text style={styles.priceText}>{priceRange[1]} ₸</Text>
              </View>
              <View style={styles.sliderContainer}>
                <MultiSlider
                  values={[priceRange[0], priceRange[1]]}
                  sliderLength={width - 60}
                  onValuesChange={setPriceRange}
                  min={0}
                  max={15000}
                  step={100}
                  selectedStyle={{ backgroundColor: '#4AB7B6' }}
                  unselectedStyle={{ backgroundColor: '#E2E8F0' }}
                  markerStyle={styles.marker}
                  trackStyle={{ height: 4 }}
                />
              </View>
            </View>

            {/* ДҮКЕНДЕР БӨЛІМІ */}
            <View style={styles.section}>
              <Text style={styles.label}>Дүкендер</Text>
              <View style={styles.storesGrid}>
                {STORES.map((store) => {
                  const isSelected = selectedStores.includes(store);
                  return (
                    <TouchableOpacity
                      key={store}
                      onPress={() => toggleStore(store)}
                      style={[styles.badge, isSelected && styles.badgeActive]}
                    >
                      <Text style={[styles.badgeText, isSelected && styles.badgeTextActive]}>
                        {store}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
            <Text style={styles.applyBtnText}>Қолдану</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  closeArea: { flex: 1 },
  filterContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    height: height * 0.65,
  },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  filterTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  section: { marginBottom: 30 },
  label: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 15 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceText: { color: '#4AB7B6', fontWeight: '700' },
  sliderContainer: { alignItems: 'center' },
  marker: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#4AB7B6', height: 20, width: 20, borderRadius: 10 },
  storesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  badgeActive: { backgroundColor: '#4AB7B6', borderColor: '#4AB7B6' },
  badgeText: { color: '#4AB7B6', fontWeight: '600' },
  badgeTextActive: { color: 'white' },
  applyBtn: { backgroundColor: '#4AB7B6', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  applyBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
});