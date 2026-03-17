import React from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TextInput, 
  ScrollView, TouchableOpacity, Image, Dimensions 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

// Данные для категорий (чтобы не дублировать код)../assets
const CATEGORIES = [
  { id: 1, title: 'Азық-түлік', count: '107 өнім', color: '#DCFCE7', img: require('../assets/azyk.png') },
  { id: 2, title: 'Сүт өнімдері', count: '25 өнім', color: '#E0F2FE', img: require('../assets/sut.png') },
  { id: 3, title: 'Сусындар', count: '55 өнім', color: '#FEE2E2', img: require('../assets/susyn.png') },
  { id: 4, title: 'Тәттілер', count: '32 өнім', color: '#FEF9C3', img: require('../assets/tatt.png') },
  { id: 5, title: 'Нан өнімдері', count: '12 өнім', color: '#FFEDD5', img: require('../assets/nan.png') },
];

export default function CategoriesScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header (такой же как на главном) */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Aqyldy<Text style={{color: '#4AB7B6'}}>Sebet</Text></Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.langSelector}>
            <Text style={styles.langText}>Қазақша </Text>
            <Feather name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationBtn}>
            <Feather name="bell" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

     {/* Поиск — теперь это кнопка, которая открывает экран Search */}
<TouchableOpacity 
  style={styles.searchContainer} 
  activeOpacity={0.8}
  onPress={() => navigation.navigate('Search')} // <--- ГЛАВНОЕ: переход на экран поиска
>
  <Feather name="search" size={20} color="#94A3B8" style={{ marginLeft: 15 }} />
  <View style={styles.searchInput}>
    <Text style={{ color: '#94A3B8', fontSize: 16 }}>Қалаған затыңызды іздеңіз</Text>
  </View>
</TouchableOpacity>
      {/* Переключатель Табов */}
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeTab')}>
          <Text style={styles.inactiveTabText}>Басты бет</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.activeTab}>
          <Text style={styles.activeTabText}>Санаттар</Text>
          <View style={styles.tabIndicator} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.categoryCard, { backgroundColor: item.color }]}
          >
            <View style={styles.cardTextContent}>
              <Text style={styles.categoryTitle}>{item.title}</Text>
              <Text style={styles.categoryCount}>{item.count}</Text>
            </View>
            {/* Здесь будет твоя картинка из ассетов, пока поставлю плейсхолдер */}
            <Image 
                source={item.img} 
                style={styles.categoryImage} 
                resizeMode="contain" 
                     />
            <View style={styles.imageContainer}>
               <Feather name="package" size={50} color="rgba(0,0,0,0.1)" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  logoText: { fontSize: 24, fontWeight: '900', color: '#FDAA5D' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  langSelector: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  langText: { color: '#64748B', fontWeight: '500' },
  notificationBtn: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', marginHorizontal: 20, borderRadius: 15, height: 55, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  activeTab: { alignItems: 'center' },
  activeTabText: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  tabIndicator: { width: 40, height: 3, backgroundColor: '#27AE60', marginTop: 4, borderRadius: 2 },
  inactiveTabText: { fontSize: 18, fontWeight: '500', color: '#94A3B8' },
   
  categoryTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  categoryCount: { fontSize: 14, color: '#64748B', marginTop: 4 },
  imageContainer: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
 categoryCard: { 
  height: 150,           // Увеличили высоту карточки
  borderRadius: 24, 
  marginBottom: 16, 
  flexDirection: 'row', 
  alignItems: 'center', 
  paddingHorizontal: 20,
  overflow: 'visible',   // Позволяем картинке немного "выглядывать", если нужно
  position: 'relative',
},

categoryImage: {
  position: 'absolute',
  right: -10,            // Сдвигаем в самый край вправо
  bottom: 0,           // Увеличиваем высоту
  zIndex: 1,
},

cardTextContent: { 
  zIndex: 2,             // Чтобы текст всегда был поверх картинки
  flex: 1,
},
});