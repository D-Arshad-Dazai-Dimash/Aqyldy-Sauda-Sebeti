import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
// Code типін осы жерге қостық
import { Camera, useCameraDevice, useCodeScanner, Code } from 'react-native-vision-camera'; 
import { api } from '../api/client';

export default function ScanScreen({ route, navigation }: any) {
  const mode = route.params?.mode || 'buyer';
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [torch, setTorch] = useState<'off' | 'on'>('off');

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Штрих-кодты сканерлеу логикасы
  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'qr'],
    onCodeScanned: async (codes: Code[]) => { // Енді Code типі табылады
      if (codes.length > 0 && isActive) {
        setIsActive(false);
        const barcode = codes[0].value;

        if (mode === 'business') {
          // БИЗНЕС: Бірден қосу бетіне өту
          navigation.navigate('AddProduct', { barcode: barcode });
        } else {
          // САТЫП АЛУШЫ: Базадан іздеу
          try {
            const res = await api.get(`/api/products/barcode/${barcode}`);
            if (res.data) {
              navigation.navigate('ProductScreen', { productId: res.data.id });
            }
          } catch {
            Alert.alert('Табылмады', 'Бұл тауар біздің дүкенде әлі тіркелмеген.');
            setIsActive(true);
          }
        }
      }
    }
  });

  if (!hasPermission) return <View style={styles.center}><Text>Камераға рұқсат беріңіз</Text></View>;
  if (!device) return <View style={styles.center}><Text>Камера табылмады</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
        torch={torch}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'business' ? 'Тауарды базаға қосу' : 'Тауарды сканерлеу'}
        </Text>
        <View style={{ width: 24 }} /> 
      </View>

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
        <Text style={styles.hintText}>Штрих-кодты жақтаудың ортасына келтіріңіз</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.flashButton} onPress={() => setTorch(t => t === 'off' ? 'on' : 'off')}>
          <Feather name="zap" size={24} color={torch === 'on' ? '#FCD34D' : '#FFF'} />
        </TouchableOpacity>
        <TouchableOpacity 
            style={styles.manualButton}
            onPress={() => setIsActive(true)}
        >
          <Text style={styles.manualButtonText}>Қайта сканерлеу</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  header: {
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  scannerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { width: '100%', height: '100%', position: 'absolute' },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  middleContainer: { flexDirection: 'row', height: 250 },
  focusedContainer: { width: 250, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#4AB7B6', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#4AB7B6', top: '50%', opacity: 0.8 },
  hintText: { color: '#FFF', fontSize: 14, position: 'absolute', bottom: 100, textAlign: 'center', width: '100%', fontWeight: '500' },
  footer: { height: 120, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  flashButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  manualButton: { backgroundColor: '#4AB7B6', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  manualButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});