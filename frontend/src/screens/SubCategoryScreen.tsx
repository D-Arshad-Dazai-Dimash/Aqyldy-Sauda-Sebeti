import React from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TouchableOpacity, SafeAreaView, Dimensions, Platform, StatusBar 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
<<<<<<< HEAD
import { PRODUCT_CATEGORIES, Category } from '../constants/categories';
=======
import { PRODUCT_CATEGORIES, Category } from '../constants/categories.ts';
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

export default function SubCategoryScreen({ route, navigation }: any) {
  const { categoryId } = route.params;
  
  const category = PRODUCT_CATEGORIES.find(item => item.id === categoryId) as Category | undefined;

  if (!category) return null;

  return (
    // SafeAreaView iOS үшін жұмыс істейді
    <SafeAreaView style={styles.container}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name}</Text>
        <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.iconBtn}>
          <Feather name="x-circle" size={26} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      {/* 2. SEARCH BOX */}
      <View style={styles.searchBox}>
        <Feather name="search" size={20} color="#94A3B8" />
        <Text style={styles.searchText}>Іздеу...</Text>
      </View>

      {/* 3. GRID ТІЗІМІ */}
      <FlatList
        data={category.subcategories}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.gridCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ProductList', { subCategoryName: item })}
          >
            <View style={styles.imagePlaceholder}>
              <Feather name="package" size={40} color="#E2E8F0" />
            </View>
            <Text style={styles.gridTitle} numberOfLines={2}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    // Android-та статус-бардың астына түсу үшін отступ
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  iconBtn: { padding: 5 },
  
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 12,
    borderRadius: 15,
  },
  searchText: { marginLeft: 10, color: '#94A3B8', fontSize: 16 },

  listContainer: { paddingHorizontal: 20, paddingTop: 5, paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 20 },

  gridCard: {
    width: COLUMN_WIDTH,
    alignItems: 'flex-start',
  },
  imagePlaceholder: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 0.85,
    backgroundColor: '#FFF5E6',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 18,
    paddingLeft: 5,
  }
});