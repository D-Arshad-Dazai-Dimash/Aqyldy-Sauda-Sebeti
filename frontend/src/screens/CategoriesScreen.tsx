import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView, 
  TouchableOpacity, 
  Image,
  Platform, // ҚОСЫЛДЫ
  StatusBar // ҚОСЫЛДЫ
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
<<<<<<< HEAD
import { PRODUCT_CATEGORIES, Category } from '../constants/categories';
=======
import { PRODUCT_CATEGORIES, Category } from '../constants/categories.ts';
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700

export default function CategoriesScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Aqyldy<Text style={{color: '#4AB7B6'}}>Sebet</Text></Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.langSelector} onPress={() => {}}>
            <Text style={styles.langText}>Қазақша </Text>
            <Feather name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationBtn}>
            <Feather name="bell" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. SEARCH */}
      <TouchableOpacity 
        style={styles.searchContainer}
        onPress={() => navigation.navigate('Search')}
      >
        <Feather name="search" size={20} color="#94A3B8" style={{ marginLeft: 15 }} />
        <Text style={{ color: '#94A3B8', fontSize: 16, marginLeft: 10 }}>Қалаған затыңызды іздеңіз</Text>
      </TouchableOpacity>

      {/* 3. TABS */}
      <View style={styles.tabContainer}>
        <Text style={styles.inactiveTabText}>Басты бет</Text>
        <View style={styles.activeTab}>
          <Text style={styles.activeTabText}>Санаттар</Text>
          <View style={styles.tabIndicator} />
        </View>
      </View>

      {/* 4. КАТЕГОРИЯЛАР ТІЗІМІ */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {PRODUCT_CATEGORIES.map((item: Category, index: number) => {
          const isImageRight = index % 2 === 0;

          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.categoryCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('SubCategory', { categoryId: item.id })}
            >
              {/* ФОН */}
              <Image source={item.bg} style={StyleSheet.absoluteFillObject} resizeMode="stretch" />

              {/* МӘТІН ҚАБАТЫ */}
              <View style={[styles.cardContent, { alignItems: isImageRight ? 'flex-start' : 'flex-end' }]}>
                <View style={[styles.cardTextWrapper, item.textContainerStyle]}>
                  <Text 
                    style={[styles.categoryTitle, item.titleStyle]}
                    allowFontScaling={false}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.categoryCount}>
                    {item.subcategories.length} бөлім
                  </Text>
                </View>
              </View>

              {/* СУРЕТ */}
              <View style={[styles.imageMask, item.imageStyle]}>
                <Image source={item.image} style={styles.fullImage} resizeMode="stretch" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    // Android үшін статус-бардың астына түсу
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 15 // Біркелкі болу үшін padding реттелді
  },
  logoText: { fontSize: 24, fontWeight: '900', color: '#FDAA5D' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  langSelector: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  langText: { color: '#64748B', fontWeight: '500' },
  notificationBtn: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', marginHorizontal: 20, borderRadius: 15, height: 55, marginBottom: 20 },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  activeTab: { alignItems: 'center' },
  activeTabText: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  tabIndicator: { width: 40, height: 3, backgroundColor: '#27AE60', marginTop: 4, borderRadius: 2 },
  inactiveTabText: { fontSize: 18, fontWeight: '500', color: '#94A3B8' },
  
  scrollContent: { paddingBottom: 100, paddingLeft: 10 },
  
  categoryCard: { 
    width: 350, 
    height: 150, 
    marginBottom: 20, 
    position: 'relative', 
    marginRight: 40,
    overflow: 'visible' 
  },
  
  cardContent: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 25,
    justifyContent: 'center',
    zIndex: 10,
  },
  
  cardTextWrapper: {
    maxWidth: '65%',
    alignItems: 'center',
    height: undefined,
    paddingVertical: 10, 
  },

  categoryTitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#000000',
    textAlign: 'center',
    lineHeight: 28, 
    includeFontPadding: false,
    paddingBottom: 4, 
    textShadowColor: 'rgba(0, 0, 0, 0.36)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2.5,
  },
  
  categoryCount: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: '#000000',
    marginTop: 2, 
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.36)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2.5,
  },

  imageMask: { position: 'absolute', zIndex: 5, overflow: 'hidden' },
  fullImage: { width: '100%', height: '100%' },
});