import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, Image, SafeAreaView, ScrollView 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const RECENT_SEARCHES = ['Nestle', 'Греческий йогурт', 'Дубайский шоколад', 'Cola'];

const MOCK_PRODUCTS = [
  { id: '1', name: 'Колбаса Narlen', price: '1900 ₸', shop: 'Magnum', image: 'https://via.placeholder.com/100' },
  { id: '2', name: 'Докторская колбаса', price: '2900 ₸', shop: 'Magnum', image: 'https://via.placeholder.com/100' },
  { id: '3', name: 'Колбаса Папа может', price: '1870 ₸', shop: 'Magnum', image: 'https://via.placeholder.com/100' },
];

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [isSearched, setIsSearched] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Шапка поиска */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={28} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.input}
            placeholder="Поиск..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => setIsSearched(true)}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => {setQuery(''); setIsSearched(false);}}>
              <Feather name="x" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isSearched ? (
        /* История поиска (как на 1-м скрине) */
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Соңғы іздегеніңіз</Text>
            <TouchableOpacity><Text style={styles.clearBtn}>Тазалау</Text></TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {RECENT_SEARCHES.map((item, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
                <Feather name="x" size={14} color="#94A3B8" style={{marginLeft: 5}} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        /* Результаты поиска (как на 2-м скрине) */
        <ScrollView style={styles.resultsContainer}>
           <View style={styles.shopSection}>
              <View style={styles.shopHeader}>
                  <View style={styles.shopLogo}><Text style={{color:'#FFF', fontWeight:'bold'}}>magnum</Text></View>
                  <View>
                      <Text style={styles.shopName}>Magnum <Feather name="check-circle" size={14} color="#2563EB" /></Text>
                      <Text style={styles.shopCount}>325 өнім</Text>
                  </View>
                  <Feather name="chevron-right" size={24} color="#94A3B8" style={{marginLeft:'auto'}} />
              </View>
              <FlatList
                horizontal
                data={MOCK_PRODUCTS}
                renderItem={({item}) => (
                    <View style={styles.productCard}>
                        <TouchableOpacity style={styles.heartBtn}><Feather name="heart" size={16} color="#1E293B" /></TouchableOpacity>
                        <Image source={{uri: item.image}} style={styles.productImg} />
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productPrice}>{item.price}</Text>
                    </View>
                )}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
              />
           </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', marginLeft: 10, paddingHorizontal: 15, borderRadius: 12, height: 45 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  content: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  clearBtn: { color: '#7C3AED' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10, marginBottom: 10 },
  chipText: { color: '#64748B' },
  resultsContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  shopSection: { backgroundColor: '#FFF', marginBottom: 10, paddingVertical: 15 },
  shopHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 15 },
  shopLogo: { width: 60, height: 60, backgroundColor: '#E11D48', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  shopName: { fontSize: 18, fontWeight: 'bold' },
  shopCount: { color: '#94A3B8' },
  productCard: { width: 130, backgroundColor: '#FFF', marginLeft: 15, padding: 10, borderRadius: 15, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  productImg: { width: 80, height: 80, marginBottom: 10 },
  productName: { fontSize: 12, textAlign: 'center', height: 32 },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#27AE60' },
  heartBtn: { position: 'absolute', right: 8, top: 8, zIndex: 1 }
});