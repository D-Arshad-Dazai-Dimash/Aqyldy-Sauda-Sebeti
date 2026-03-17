import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert // Импортируем Alert здесь
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

export default function ScanScreen({ navigation }: any) {
  
  const handleManualInput = () => {
    // Используем Alert.alert вместо просто alert
    Alert.alert('Ввод кода', 'Функция ручного ввода будет доступна в следующем обновлении');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Шапка */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Сканирование товара</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* Зона сканирования */}
      <View style={styles.scannerContainer}>
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <View style={styles.scanLine} />
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>

        <Text style={styles.hintText}>Наведите камеру на штрих-код товара</Text>
      </View>

      {/* Нижняя панель */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.flashButton}>
          <Feather name="zap" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity 
            style={styles.manualButton}
            onPress={handleManualInput}
        >
          <Text style={styles.manualButtonText}>Ввести код вручную</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    height: 60,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // ИСПРАВЛЕНО: было justify_content
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
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
  hintText: { color: '#FFF', fontSize: 16, position: 'absolute', bottom: 100, textAlign: 'center', width: '100%' },
  footer: { height: 120, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  flashButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  manualButton: { backgroundColor: '#27AE60', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  manualButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});