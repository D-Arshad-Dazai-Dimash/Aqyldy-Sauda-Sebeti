import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { canUseBiometricUnlock } from '../utils/appPin';

const P = {
  dark: '#071210',
  teal: '#1A9A88',
  tealDark: '#0D6B5C',
  tealSoft: 'rgba(26,154,136,0.15)',
  tealBorder: 'rgba(26,154,136,0.3)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.45)',
  key: 'rgba(255,255,255,0.08)',
  keyBorder: 'rgba(255,255,255,0.12)',
  error: '#F87171',
  errorBg: 'rgba(248,113,113,0.12)',
};

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
  // setup mode has 2 steps: 0 = enter new PIN, 1 = confirm
  // unlock mode has 1 step: 0 = enter PIN
  const [step, setStep] = useState(0);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  useEffect(() => {
    if (mode !== 'unlock') return;
    canUseBiometricUnlock()
      .then(setBiometricAvailable)
      .catch(() => setBiometricAvailable(false));
  }, [mode]);

  const activePin = step === 0 ? pin : confirmPin;

  const shake = () => {
    Vibration.vibrate(80);
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 40 }),
    );
  };

  const handleKey = (digit: string) => {
    if (activePin.length >= 4) return;
    const next = activePin + digit;
    if (step === 0) setPin(next); else setConfirmPin(next);
    setError(null);
    if (next.length === 4) {
      setTimeout(() => advance(next), 160);
    }
  };

  const handleDel = () => {
    if (activePin.length === 0) return;
    const trimmed = activePin.slice(0, -1);
    if (step === 0) setPin(trimmed); else setConfirmPin(trimmed);
    setError(null);
  };

  const advance = async (entered: string) => {
    if (mode === 'unlock') {
      await doUnlock(entered);
      return;
    }
    // setup mode
    if (step === 0) {
      setStep(1);
    } else {
      if (entered !== pin) {
        shake();
        setConfirmPin('');
        setError('PIN-кодтар сәйкес емес — қайта енгізіңіз');
        return;
      }
      await doSetup(pin);
    }
  };

  const doUnlock = async (entered: string) => {
    setLoading(true);
    try {
      await onUnlockSuccess(entered);
    } catch (e: any) {
      shake();
      setPin('');
      setError(e?.message || 'PIN қате — қайта көріңіз');
    } finally {
      setLoading(false);
    }
  };

  const doSetup = async (newPin: string) => {
    setLoading(true);
    try {
      await onSetupSuccess(newPin);
    } catch (e: any) {
      shake();
      setStep(0);
      setPin('');
      setConfirmPin('');
      setError(e?.message || 'PIN орнату қатесі');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    if (!onBiometricUnlock) return;
    setError(null);
    setLoading(true);
    try {
      await onBiometricUnlock();
    } catch (e: any) {
      shake();
      setError(e?.message || 'Биометрия қатесі');
    } finally {
      setLoading(false);
    }
  };

  const titleText =
    mode === 'setup'
      ? step === 0
        ? 'PIN-код орнату'
        : 'PIN-кодты растаңыз'
      : 'PIN-кодпен кіру';

  const subText =
    mode === 'setup'
      ? step === 0
        ? 'Жаңа 4 таңбалы PIN енгізіңіз'
        : 'PIN-кодды қайта енгізіңіз'
      : 'Қолданбаны ашу үшін PIN енгізіңіз';

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];
  const showBio = mode === 'unlock' && biometricAvailable && !!onBiometricUnlock;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.body}>

        {/* ── Logo / Lock icon ── */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.iconWrap}>
          <Feather name="lock" size={28} color={P.teal} />
        </Animated.View>

        {/* ── Title ── */}
        <Animated.View key={`${mode}-${step}`} entering={FadeInDown.duration(260)} style={styles.titleWrap}>
          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.subtitle}>{subText}</Text>
        </Animated.View>

        {/* ── PIN Dots ── */}
        <Animated.View style={[styles.dotsRow, shakeStyle]}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.dot,
                i < activePin.length && styles.dotFilled,
                i === activePin.length && styles.dotActive,
              ]}
            />
          ))}
        </Animated.View>

        {/* ── Error ── */}
        {error ? (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.errorWrap}>
            <Feather name="alert-circle" size={14} color={P.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : (
          <View style={styles.errorPlaceholder} />
        )}

        {/* ── Numpad ── */}
        {loading ? (
          <ActivityIndicator size="large" color={P.teal} style={{ marginTop: 48 }} />
        ) : (
          <View style={styles.numpad}>
            {keys.map((k, idx) => {
              if (k === 'bio') {
                if (showBio) {
                  return (
                    <TouchableOpacity key={idx} style={styles.key} onPress={handleBiometric} activeOpacity={0.7}>
                      <Feather name="aperture" size={26} color={P.muted} />
                    </TouchableOpacity>
                  );
                }
                return <View key={idx} style={styles.keyEmpty} />;
              }
              if (k === 'del') {
                return (
                  <TouchableOpacity key={idx} style={styles.key} onPress={handleDel} activeOpacity={0.7}>
                    <Feather name="delete" size={22} color={P.muted} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity key={idx} style={styles.key} onPress={() => handleKey(k)} activeOpacity={0.65}>
                  <Text style={styles.keyText}>{k}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Back / Logout ── */}
        {mode === 'setup' && step === 1 ? (
          <TouchableOpacity style={styles.textBtn} onPress={() => { setStep(0); setConfirmPin(''); setError(null); }}>
            <Feather name="arrow-left" size={14} color={P.muted} />
            <Text style={styles.textBtnLabel}>Артқа</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.textBtn}
            onPress={() =>
              Alert.alert('Шығу', 'Аккаунттан шығуды қалайсыз ба?', [
                { text: 'Жоқ', style: 'cancel' },
                { text: 'Иә', style: 'destructive', onPress: () => onLogout() },
              ])
            }
          >
            <Text style={styles.textBtnLabel}>Басқа аккаунтпен кіру</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: P.dark },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: P.tealSoft,
    borderWidth: 1.5,
    borderColor: P.tealBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  titleWrap: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 22, fontWeight: '800', color: P.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: P.muted, marginTop: 6 },

  dotsRow: {
    flexDirection: 'row',
    gap: 22,
    marginBottom: 12,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: P.teal,
    borderColor: P.teal,
    shadowColor: P.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 4,
  },
  dotActive: { borderColor: P.teal },

  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.errorBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  errorText: { color: P.error, fontSize: 13, fontWeight: '600' },
  errorPlaceholder: { height: 36, marginBottom: 8 },

  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    marginTop: 8,
    gap: 14,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: P.key,
    borderWidth: 1,
    borderColor: P.keyBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyEmpty: { width: 80, height: 80 },
  keyText: { fontSize: 28, fontWeight: '600', color: P.text, letterSpacing: -0.5 },

  textBtn: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  textBtnLabel: { color: P.muted, fontSize: 14, fontWeight: '600' },
});
