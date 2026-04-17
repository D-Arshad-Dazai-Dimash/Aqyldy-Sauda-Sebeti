import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';

export default function ChangePinScreen({ navigation }: any) {
  const changePin = useAuthStore((s) => s.changePin);

  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidPin = (value: string) => /^\d{4}$/.test(value);

  const onSubmit = async () => {
    setError(null);

    if (!isValidPin(currentPin) || !isValidPin(nextPin) || !isValidPin(confirmPin)) {
      setError('PIN 4 саннан тұруы керек');
      return;
    }

    if (nextPin !== confirmPin) {
      setError('Жаңа PIN және растау PIN сәйкес емес');
      return;
    }

    if (currentPin === nextPin) {
      setError('Жаңа PIN ескі PIN-мен бірдей болмауы керек');
      return;
    }

    setLoading(true);
    try {
      const ok = await changePin(currentPin, nextPin);
      if (!ok) {
        setError('Ағымдағы PIN қате');
        return;
      }

      Alert.alert('Дайын', 'PIN-код сәтті жаңартылды', [
        { text: 'Жақсы', onPress: () => navigation.goBack() },
      ]);
    } catch {
      setError('PIN-кодты өзгерту мүмкін болмады');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>PIN-кодты өзгерту</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Ағымдағы PIN</Text>
          <TextInput
            value={currentPin}
            onChangeText={(v) => setCurrentPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            style={styles.input}
          />

          <Text style={styles.label}>Жаңа PIN</Text>
          <TextInput
            value={nextPin}
            onChangeText={(v) => setNextPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            style={styles.input}
          />

          <Text style={styles.label}>Жаңа PIN растау</Text>
          <TextInput
            value={confirmPin}
            onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Сақтау</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: { marginTop: 10, fontSize: 13, color: '#334155', fontWeight: '700' },
  input: {
    marginTop: 8,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    fontSize: 18,
    letterSpacing: 10,
    color: '#0F172A',
  },
  error: { marginTop: 12, color: '#EF4444', fontWeight: '600' },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: '#0EA5E9',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
