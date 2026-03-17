import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useFavoritesStore } from '../store/favoritesStore';

const { width } = Dimensions.get('window');
const GLOBAL_PADDING = 20; // Бүкіл бетке ортақ шеткі отступ

const SIMILAR_PRODUCTS = [
  { id: 's1', image: require('../assets/p1.png') },
  { id: 's2', image: require('../assets/p1.png') },
  { id: 's3', image: require('../assets/p1.png') },
  { id: 's4', image: require('../assets/p1.png') },
  { id: 's5', image: require('../assets/p1.png') },
];

export default function ProductScreen({ route, navigation }: any) {
  const product = route.params?.product || { 
    id: 'p1', 
    name: 'Докторская колбаса', 
    price: '2900 ₸' 
  };

  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isFav = isFavorite(product.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. HEADER - Енді бұл 60px-тің ішінде әдемі тұрады */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={32} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleFavorite(product.id)} style={styles.iconBtn}>
          <Image 
            source={isFav ? require('../assets/icons/heart.png') : require('../assets/icons/love.png')} 
            style={styles.heartIcon} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. ТАУАР СУРЕТІ (75px қосымша отступпен) */}
        <View style={styles.imageSection}>
          <Image source={require('../assets/p1.png')} style={styles.mainImage} resizeMode="contain" />
        </View>

        {/* 3. АТЫ ЖӘНЕ БАҒАСЫ */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{product.price}</Text>
        </View>

        {/* 4. "ҚОСУ" БАТЫРМАСЫ */}
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>Қосу</Text>
        </TouchableOpacity>

        {/* 5. СИПАТТАМА */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сипаттама</Text>
          <Text style={styles.descriptionText}>
            Бұл жоғары сапалы еттен дайындалған табиғи өнім. Құрамында жасанды қоспалар жоқ, 
            балалар тағамына және күнделікті тұтынуға өте ыңғайлы. Нәзік дәмі мен 
            хош иісі сіздің асыңызды ерекше етеді.
          </Text>
        </View>

        {/* 6. ҰҚСАС ӨНІМДЕР */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Ұқсас өнімдер</Text>
          <FlatList
            data={SIMILAR_PRODUCTS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.similarList}
            renderItem={({ item }) => (
              <View style={styles.similarCard}>
                <Image source={item.image} style={styles.similarImage} resizeMode="contain" />
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    // Android-та статустық жолақтан қашу үшін
    paddingTop: Platform.OS === 'android' ? 60 : 0, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GLOBAL_PADDING, // 20px
    height: 60, // Хэдердің нақты биіктігі
  },
  iconBtn: { padding: 5 },
  heartIcon: { width: 28, height: 28 },
  
  scrollContent: {
    paddingBottom: 20,
  },

  // Сурет бөлімі (Ортада тұруы үшін)
  imageSection: {
    marginTop: 20,
    paddingHorizontal: 75, // Сен айтқан 75px отступ
    alignItems: 'center',
  },
  mainImage: {
    width: width - 150, 
    height: 220,
  },

  infoSection: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: GLOBAL_PADDING,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4AB7B6',
  },

  addBtn: {
    backgroundColor: '#4AB7B6',
    marginHorizontal: 60,
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    // Көлеңке (Android/iOS)
    elevation: 5,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  addBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  // Ортақ секция стилі (Сипаттама және Ұқсас тауарлар үшін)
  section: {
    marginTop: 35,
    paddingHorizontal: GLOBAL_PADDING, // Бәрінде бірдей 20px
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },

  similarList: {
    paddingRight: 20, // Скролл соңында бос орын болу үшін
    gap: 15,
  },
  similarCard: {
    width: 75,
    height: 75,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  similarImage: { width: 55, height: 55 },
});