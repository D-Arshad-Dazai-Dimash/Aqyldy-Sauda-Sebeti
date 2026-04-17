import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { canUseBiometricUnlock } from '../utils/appPin';

type AppPinScreenProps = {
  mode: 'setup' | 'unlock';
  onUnlockSuccess: (pin: string) => Promise<void> | void;
  onSetupSuccess: (pin: string) => Promise<void> | void;
  onBiometricUnlock?: () => Promise<void> | void;
  onLogout: () => Promise<void> | void;
};

export default function AppPinScreen({
  mode,
  onUnlockSuccess,
  onSetupSuccess,
  onBiometricUnlock,
  onLogout,
}: AppPinScreenProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (mode !== 'unlock') return;

    canUseBiometricUnlock()
      .then(setBiometricAvailable)
      .catch(() => setBiometricAvailable(false));
  }, [mode]);

  const title = useMemo(() => {
    return mode === 'setup' ? 'Жылдам кіру PIN-кодын орнатыңыз' : 'PIN-кодпен кіру';
  }, [mode]);

  const subtitle = useMemo(() => {
    return mode === 'setup'
      ? 'Қолданбаға тез кіру үшін 4 таңбалы PIN енгізіңіз'
      : 'Қолданбаны ашу үшін 4 таңбалы PIN енгізіңіз';
  }, [mode]);

  const validatePin = (value: string): boolean => {
    if (!/^\d{4}$/.test(value)) {
      setError('PIN 4 саннан тұруы керек');
      return false;
    }
    return true;
  };

  const submit = async () => {
    setError(null);

    if (!validatePin(pin)) return;

    if (mode === 'setup') {
      if (!validatePin(confirmPin)) return;
      if (pin !== confirmPin) {
        setError('PIN-кодтар сәйкес келмейді');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'setup') {
        await onSetupSuccess(pin);
      } else {
        await onUnlockSuccess(pin);
      }
    } catch (e: any) {
      const fallback = mode === 'setup' ? 'PIN орнату қатесі' : 'PIN қате немесе жүйелік қате';
      setError(e?.message || fallback);
    } finally {
      setLoading(false);
    }
  };

  const submitBiometric = async () => {
    if (!onBiometricUnlock) return;

    setError(null);
    setLoading(true);
    try {
      await onBiometricUnlock();
    } catch (e: any) {
      setError(e?.message || 'Биометрия қатесі');
    } finally {
      setLoading(false);
    }
  };

  const renderDots = (value: string) => (
    <View style={styles.dotsRow}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Feather name="lock" size={26} color="#0EA5E9" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <Text style={styles.label}>PIN</Text>
          {renderDots(pin)}
          <TextInput
            value={pin}
            onChangeText={(v) => setPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            style={styles.hiddenInput}
            autoFocus
          />

          {mode === 'setup' && (
            <>
              <Text style={[styles.label, { marginTop: 16 }]}>PIN растау</Text>
              {renderDots(confirmPin)}
              <TextInput
                value={confirmPin}
                onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                style={styles.hiddenInput}
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{mode === 'setup' ? 'PIN орнату' : 'Кіру'}</Text>}
          </TouchableOpacity>

          {mode === 'unlock' && biometricAvailable && onBiometricUnlock ? (
            <TouchableOpacity style={styles.bioBtn} onPress={submitBiometric} disabled={loading} activeOpacity={0.85}>
              <Feather name="fingerprint" size={18} color="#0EA5E9" />
              <Text style={styles.bioBtnText}>Биометриямен кіру</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              Alert.alert('Шығу', 'Аккаунттан шығуды қалайсыз ба?', [
                { text: 'Жоқ', style: 'cancel' },
                { text: 'Иә', style: 'destructive', onPress: () => onLogout() },
              ]);
            }}
          >
            <Text style={styles.secondaryBtnText}>Басқа аккаунтпен кіру</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EFF6FF' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#64748B', textAlign: 'center' },
  label: { marginTop: 18, fontSize: 13, fontWeight: '700', color: '#334155' },
  dotsRow: { marginTop: 10, flexDirection: 'row', gap: 10 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  dotFilled: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  hiddenInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 18,
    letterSpacing: 8,
  },
  error: { marginTop: 12, color: '#EF4444', fontWeight: '600' },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#334155', fontSize: 14, fontWeight: '600' },
  bioBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7DD3FC',
    backgroundColor: '#F0F9FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bioBtnText: { color: '#0369A1', fontSize: 14, fontWeight: '700' },
});
