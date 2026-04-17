import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';
import { useHeaderLayout } from '../utils/useHeaderLayout';

const P = {
  dark: '#071210',
  dark2: '#0A2422',
  teal: '#1A9A88',
  tealDark: '#0D6B5C',
  tealSoft: '#D4F0EB',
  border: '#CAE5E1',
  gold: '#FFCA28',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.45)',
  key: 'rgba(255,255,255,0.08)',
  keyBorder: 'rgba(255,255,255,0.12)',
};

const STEPS = ['Ағымдағы PIN', 'Жаңа PIN', 'Жаңа PIN растау'];

export default function ChangePinScreen({ navigation }: any) {
  const { topPadding, contentTopOffset } = useHeaderLayout();
  const changePin = useAuthStore((s) => s.changePin);

  const [step, setStep] = useState(0);
  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const activePin = step === 0 ? currentPin : step === 1 ? nextPin : confirmPin;

  function getPinSetter(s: number) {
    return s === 0 ? setCurrentPin : s === 1 ? setNextPin : setConfirmPin;
  }

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
    getPinSetter(step)(next);
    setError(null);

    if (next.length === 4) {
      setTimeout(() => advance(next), 160);
    }
  };

  const handleDel = () => {
    if (activePin.length === 0) return;
    getPinSetter(step)(activePin.slice(0, -1));
    setError(null);
  };

  const advance = async (pin: string) => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (pin === currentPin) {
        shake();
        setNextPin('');
        setError('Жаңа PIN ескі PIN-мен бірдей болмауы керек');
        return;
      }
      setStep(2);
    } else {
      if (pin !== nextPin) {
        shake();
        setConfirmPin('');
        setError('PIN-код сәйкес емес — қайта енгізіңіз');
        return;
      }
      await submit();
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const ok = await changePin(currentPin, nextPin);
      if (!ok) {
        shake();
        setStep(0);
        setCurrentPin('');
        setNextPin('');
        setConfirmPin('');
        setError('Ағымдағы PIN қате');
        return;
      }
      Alert.alert('Дайын ✓', 'PIN-код сәтті жаңартылды', [
        { text: 'Жақсы', onPress: () => navigation.goBack() },
      ]);
    } catch {
      shake();
      setError('PIN-кодты өзгерту мүмкін болмады');
    } finally {
      setLoading(false);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => {
          if (step > 0) { setStep(s => s - 1); setError(null); }
          else navigation.goBack();
        }} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PIN-кодты өзгерту</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.body, { paddingTop: contentTopOffset }]}> 

        {/* ── Step Progress ── */}
        <Animated.View entering={FadeInDown.duration(260)} style={styles.stepRow}>
          {STEPS.map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, i < step && styles.stepDotDone, i === step && styles.stepDotActive]}>
                {i < step ? (
                  <Feather name="check" size={13} color="#FFF" />
                ) : (
                  <Text style={[styles.stepNum, i === step && { color: '#FFF' }]}>{i + 1}</Text>
                )}
              </View>
              {i < 2 && <View style={[styles.stepLine, i < step && styles.stepLineDone]} />}
            </View>
          ))}
        </Animated.View>

        {/* ── Step Label ── */}
        <Animated.View key={step} entering={FadeInDown.duration(240)} style={styles.promptWrap}>
          <View style={styles.lockIconWrap}>
            <Feather name="lock" size={24} color={P.teal} />
          </View>
          <Text style={styles.promptText}>{STEPS[step]}</Text>
          <Text style={styles.promptSub}>4 санды енгізіңіз</Text>
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
        {error && (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.errorWrap}>
            <Feather name="alert-circle" size={14} color="#F87171" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* ── Numpad ── */}
        {loading ? (
          <ActivityIndicator size="large" color={P.teal} style={{ marginTop: 48 }} />
        ) : (
          <View style={styles.numpad}>
            {keys.map((k, idx) => {
              if (k === '') return <View key={idx} style={styles.keyEmpty} />;
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: P.dark },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },

  body: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 0 },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: P.teal, borderColor: P.teal },
  stepDotDone: { backgroundColor: P.tealDark, borderColor: P.tealDark },
  stepNum: { fontSize: 13, fontWeight: '700', color: P.muted },
  stepLine: {
    width: 40, height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 6,
  },
  stepLineDone: { backgroundColor: P.tealDark },

  promptWrap: { alignItems: 'center', marginBottom: 28 },
  lockIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(26,154,136,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(26,154,136,0.3)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  promptText: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.4 },
  promptSub: { fontSize: 13, color: P.muted, marginTop: 4 },

  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
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
  dotActive: {
    borderColor: P.teal,
  },

  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 8,
  },
  errorText: { color: '#F87171', fontSize: 13, fontWeight: '600' },

  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    marginTop: 16,
    gap: 12,
  },
  key: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: P.key,
    borderWidth: 1, borderColor: P.keyBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  keyEmpty: { width: 80, height: 80 },
  keyText: { fontSize: 26, fontWeight: '600', color: '#FFF', letterSpacing: -0.5 },
});
