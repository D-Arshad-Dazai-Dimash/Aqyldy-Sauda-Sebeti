import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Collapsible from 'react-native-collapsible';
import { useFavoritesStore } from '../store/favoritesStore';
import FastImage from 'react-native-fast-image';
// @ts-ignore
import VerifiedIcon from '../assets/icons/verified.svg'; // SVG белгішесі

// 1. Адаптивті өлшемдерді есептеу
const { width } = Dimensions.get('window');
const SCREEN_PADDING = 20;
const COLUMN_SPACING = 15;
// Карточканың ені: (Экран ені - шеткі padding-тер - ортадағы бос орын) / 2
const ITEM_WIDTH = (width - (SCREEN_PADDING * 2) - COLUMN_SPACING) / 2;

const MOCK_STORE_DATA = {
  id: '1',
  name: 'Magnum',
  logo: require('../assets/magnum-logo.png'),
  isVerified: true,
  type: 'Супермаркет',
  address: 'Ақсай 1-18',
  description: 'Бұл Magnum супермаркеттер желісінің филиалы. Мұнда сіз жаңа піскен өнімдерді, тұрмыстық тауарларды және қолжетімді бағаларды таба аласыз.',
};

const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Колбаса Narlen', price: '1900 ₸', image: require('../assets/p1.png') },
  { id: 'p2', name: 'Докторская колбаса', price: '2900 ₸', image: require('../assets/p1.png') },
  { id: 'p3', name: 'Колбаса Папа может', price: '1870 ₸', image: require('../assets/p1.png') },
  { id: 'p4', name: 'Колбаса Сливочная', price: '2100 ₸', image: require('../assets/p1.png') },
  { id: 'p5', name: 'Сүт', price: '450 ₸', image: require('../assets/p1.png') },
  { id: 'p6', name: 'Айран', price: '380 ₸', image: require('../assets/p1.png') },
];

export default function StoreScreen({ navigation }: any) {
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  const renderProductItem = ({ item }: { item: any }) => {
    const isFav = isFavorite(item.id);

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        style={styles.productGridItem}
        onPress={() => navigation.navigate('ProductScreen', { product: item })}
      >
        {/* Жүрекше */}
        <TouchableOpacity 
          style={styles.favoriteBtn} 
          onPress={() => toggleFavorite(item.id)}
        >
          <Image 
            source={isFav 
              ? require('../assets/icons/heart.png') 
              : require('../assets/icons/love.png')
            } 
            style={styles.heartIcon} 
            resizeMode="contain" 
          />
        </TouchableOpacity>

        {/* 2. ТАУАР СУРЕТІ - FastImage қолданылды */}
        <View style={styles.imageWrapper}>
          <FastImage 
            source={item.image} 
            style={styles.productGridImage} 
            resizeMode={FastImage.resizeMode.contain}
          />
        </View>

        {/* Тауар аты және бағасы */}
        <View style={styles.productTextContainer}>
          <Text style={styles.productGridTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productGridPrice}>{item.price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={32} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ДҮКЕН ТУРАЛЫ АҚПАРАТ */}
        <View style={styles.storeInfoRow}>
          <View style={styles.storeTextCol}>
            <View style={styles.storeNameContainer}>
              <Text style={styles.storeNameText}>{MOCK_STORE_DATA.name}</Text>
              {/* НАҒЫЗ SVG ГАЛОЧКА */}
              {MOCK_STORE_DATA.isVerified && (
                <VerifiedIcon width={30} height={30} style={styles.verifyIcon} />
              )}
            </View>
            <Text style={styles.storeTypeText}>{MOCK_STORE_DATA.type}</Text>
            <Text style={styles.storeAddressText}>{MOCK_STORE_DATA.address}</Text>
          </View>
          <Image source={MOCK_STORE_DATA.logo} style={styles.storeMainLogo} resizeMode="cover" />
        </View>

        {/* "Толығырақ" бөлімі */}
        <View style={styles.aboutStoreSection}>
          <TouchableOpacity 
            style={styles.aboutHeader} 
            onPress={() => setIsAboutExpanded(!isAboutExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.aboutHeaderText}>Толығырақ</Text>
            <Feather 
              name={isAboutExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#000" 
            />
          </TouchableOpacity>
          <Collapsible collapsed={!isAboutExpanded} align="center">
            <View style={styles.aboutStoreBody}>
              <Text style={styles.aboutStoreContent}>
                {MOCK_STORE_DATA.description}
              </Text>
            </View>
          </Collapsible>
        </View>

        {/* ТАУАРЛАР СЕТКАСЫ */}
        <FlatList
          data={MOCK_PRODUCTS}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          scrollEnabled={false} 
          contentContainerStyle={styles.productGridContainer}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 60 : 0, 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 10 
  },
  iconBtn: { padding: 5 },
  scrollContent: { paddingHorizontal: SCREEN_PADDING, paddingTop: 10, paddingBottom: 40 },
  storeInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  storeTextCol: { flex: 1, marginRight: 20 },
  storeNameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  storeNameText: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginRight: 8 },
  verifyIcon: { marginTop: 4 }, // SVG үшін сәл түзету
  storeTypeText: { fontSize: 16, color: '#64748B', marginBottom: 2 },
  storeAddressText: { fontSize: 16, color: '#1E293B', fontWeight: '600' },
  storeMainLogo: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#F1F5F9' },
  aboutStoreSection: { marginBottom: 30 },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aboutHeaderText: { fontSize: 16, color: '#000', fontWeight: '700', marginRight: 5 },
  aboutStoreBody: { padding: 15, backgroundColor: '#F8FAFC', borderRadius: 15 },
  aboutStoreContent: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  
  productRow: { 
    justifyContent: 'space-between', 
  },
  productGridContainer: { paddingTop: 10 },
  productGridItem: {
    width: ITEM_WIDTH, 
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 20,
    marginBottom: COLUMN_SPACING, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  productGridImage: {
    width: '100%',
    height: '100%',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 3,
  },
  heartIcon: { width: 22, height: 22 },
  productTextContainer: { alignItems: 'center', width: '100%' },
  productGridTitle: { fontSize: 12, color: '#1E293B', fontWeight: '500', textAlign: 'center', marginBottom: 2 },
  productGridPrice: { fontSize: 14, color: '#4AB7B6', fontWeight: '700' },
});