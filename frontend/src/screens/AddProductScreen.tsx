import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { api } from '../api/client';

export default function AddProductScreen({ route, navigation }: any) {
  const { barcode } = route.params; // Сканерден келген код
  
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [subcategory, setSubcategory] = useState('');

  const handleSave = async () => {
  // Міндетті өрістерді тексеру
  if (!name || !price) {
    Alert.alert('Қате', 'Тауар атауы мен бағасын толтырыңыз');
    return;
  }

  try {
    setLoading(true);

    // Бекендтегі (Java Entity) баған атауларына сәйкес объект:
    const payload = {
  title: name,
  barcode: String(barcode),
  price: Number(price),
  stock: Number(stock) || 0,
  description: subcategory || "", // subcategory-ді сипаттамаға саламыз
  image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
  active: true
  // 'category' жібермейміз, себебі ол Java-да объект күтеді
};

    console.log("Жіберілетін деректер:", payload);

    // Сұраныс жіберу
    const response = await api.post('/api/products', payload);

    if (response.status === 201 || response.status === 200) {
      Alert.alert('Сәтті!', 'Тауар базаға қосылды', [
        { text: 'OK', onPress: () => navigation.navigate('BusinessHome') }
      ]);
    }
  } catch (error: any) {
    console.error('SERVER ERROR:', error.response?.data || error.message);
    
    // Серверден нақты қате келсе, соны шығарамыз
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Тауар атауы</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Мысалы: Сүт Lactel 1л" 
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Бағасы (₸)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="0" 
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Саны (Қоймада)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="0" 
            keyboardType="numeric"
            value={stock}
            onChangeText={setStock}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Саб-категория</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Мысалы: Сүт өнімдері" 
            value={subcategory}
            onChangeText={setSubcategory}
          />
        </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  content: { padding: 20 },
  infoCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2F1',
    padding: 15, borderRadius: 15, marginBottom: 25
  },
  barcodeLabel: { marginLeft: 10, fontSize: 16, color: '#1E293B' },
  barcodeValue: { fontSize: 16, fontWeight: 'bold', color: '#4AB7B6' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  input: { 
    backgroundColor: '#FFF', padding: 15, borderRadius: 12, 
    borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, color: '#1E293B'
  },
  saveButton: { 
    backgroundColor: '#4AB7B6', padding: 18, borderRadius: 15, 
    alignItems: 'center', marginTop: 20, elevation: 5
  },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: '800' }
});