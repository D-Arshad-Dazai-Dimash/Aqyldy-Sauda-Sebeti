import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  Alert // <--- ГЛАВНОЕ: Импортируем Alert здесь
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const MOCK_FAVORITES = [
  { id: '1', name: 'Молоко 3.2%', price: '450 ₸', image: 'https://img.freepik.com/free-photo/milk-bottle-isolated_1203-1811.jpg' },
  { id: '2', name: 'Хлеб Бородинский', price: '180 ₸', image: 'https://img.freepik.com/free-photo/bread-isolated-white_1203-1842.jpg' },
  { id: '3', name: 'Кофе молотый', price: '2800 ₸', image: 'https://img.freepik.com/free-photo/coffee-beans-spilled-from-cup_1203-1954.jpg' },
];

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState(MOCK_FAVORITES);

  const removeItem = (id: string) => {
    // Системное окно подтверждения
    Alert.alert(
      "Удаление",
      "Удалить этот товар из избранного?",
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Удалить", 
          style: "destructive", 
          onPress: () => setFavorites(prev => prev.filter(item => item.id !== id)) 
        }
      ]
    );
  };

  const addToCart = (itemName: string) => {
    // Использование Alert.alert вместо alert
    Alert.alert("Корзина", `${itemName} добавлен в корзину!`);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>{item.price}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => addToCart(item.name)}
        >
          <Feather name="shopping-cart" size={18} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
        >
          <Feather name="trash-2" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Избранное</Text>
        <Text style={styles.count}>{favorites.length} товаров</Text>
      </View>

      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="heart" size={80} color="#CBD5E1" />
          <Text style={styles.emptyText}>В избранном пока пусто</Text>
          <TouchableOpacity style={styles.browseButton}>
            <Text style={styles.browseButtonText}>Перейти к покупкам</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  title: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  count: { fontSize: 14, color: '#64748B', marginTop: 4 },
  list: { padding: 15 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 12, 
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  image: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#F1F5F9' },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  price: { fontSize: 15, fontWeight: '700', color: '#27AE60', marginTop: 4 },
  actions: { alignItems: 'center' },
  cartButton: { 
    backgroundColor: '#27AE60', 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 8
  },
  removeButton: { 
    width: 36, 
    height: 36, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { fontSize: 18, color: '#64748B', marginTop: 20, fontWeight: '500' },
  browseButton: { marginTop: 20, backgroundColor: '#27AE60', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  browseButtonText: { color: '#FFF', fontWeight: '600' }
});