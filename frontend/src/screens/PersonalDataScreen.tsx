import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import * as AuthApi from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useHeaderLayout } from '../utils/useHeaderLayout';
import type { RootStackParamList } from '../types/navigation';

const P = {
  bg: '#F0F9F7',
  surface: '#FFFFFF',
  mint: '#1A9A88',
  mintDark: '#0D6B5C',
  mintSoft: '#D4F0EB',
  text: '#0A1E1D',
  muted: '#527673',
  border: '#CAE5E1',
  disabled: '#F1F5F9',
  disabledText: '#64748B',
  error: '#E63946',
};

/** Простая проверка URL — разрешаем только https/http и только строки */
function isValidAvatarUrl(url: string): boolean {
  if (!url) return true; // пустое значение допустимо
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalData'>;

export default function PersonalDataScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { contentTopOffset } = useHeaderLayout();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const onSave = async () => {
    // Validate avatar URL before sending to the server
    if (avatarUrl.trim() && !isValidAvatarUrl(avatarUrl.trim())) {
      setAvatarError('Жарамды URL енгізіңіз (https://...)');
      return;
    }
    setAvatarError(null);

    try {
      setLoading(true);
      const updated = await AuthApi.updateProfile({
        name: name.trim() || null,
        phone: phone.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      setUser(updated);
      Alert.alert('Сақталды ✓', 'Жеке деректер сәтті жаңартылды');
      navigation.goBack();
    } catch {
      Alert.alert('Қате', 'Жеке деректерді сақтау мүмкін болмады');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    editable = true,
    keyboardType = 'default' as any,
    autoCapitalize = 'sentences' as any,
    errorText,
    delay = 0,
  }: any) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(340)} style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, !editable && styles.inputRowDisabled, errorText && styles.inputRowError]}>
        <Feather name={icon} size={16} color={editable ? P.mint : P.disabledText} style={styles.inputIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={P.muted}
          style={[styles.input, !editable && styles.inputDisabled]}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Floating header */}
      <Animated.View entering={FadeIn.duration(320)} style={[styles.header, { paddingTop: contentTopOffset }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={P.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Жеке деректер</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar placeholder / hint */}
          <Animated.View entering={FadeInDown.delay(60).duration(380)} style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <Feather name="user" size={36} color={P.mint} />
            </View>
            <Text style={styles.avatarName}>{user?.name || user?.email?.split('@')[0] || 'Пайдаланушы'}</Text>
            <Text style={styles.avatarEmail}>{user?.email ?? ''}</Text>
          </Animated.View>

          <View style={styles.card}>
            <Field
              label="Email"
              icon="mail"
              value={user?.email ?? ''}
              editable={false}
              placeholder="email@example.com"
              autoCapitalize="none"
              delay={80}
            />

            <Field
              label="Аты-жөні"
              icon="user"
              value={name}
              onChangeText={setName}
              placeholder="Аты-жөні"
              delay={120}
            />

            <Field
              label="Телефон"
              icon="phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+7 700 000 00 00"
              keyboardType="phone-pad"
              autoCapitalize="none"
              delay={160}
            />

            <Field
              label="Аватар сілтемесі"
              icon="link"
              value={avatarUrl}
              onChangeText={(v: string) => { setAvatarUrl(v); setAvatarError(null); }}
              placeholder="https://example.com/avatar.jpg"
              autoCapitalize="none"
              keyboardType="url"
              errorText={avatarError}
              delay={200}
            />
          </View>

          <Animated.View entering={FadeInDown.delay(260).duration(340)} style={styles.saveBtnWrap}>
            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={onSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveText}>Сақтау</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: P.bg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: P.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: '800', color: P.text },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: P.mintSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: P.mint,
    marginBottom: 12,
  },
  avatarName: { fontSize: 17, fontWeight: '700', color: P.text, marginBottom: 2 },
  avatarEmail: { fontSize: 13, color: P.muted },
  card: {
    backgroundColor: P.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.border,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  fieldWrap: { marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '700', color: P.muted, marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 14,
    backgroundColor: P.surface,
    height: 50,
    paddingHorizontal: 12,
  },
  inputRowDisabled: { backgroundColor: P.disabled },
  inputRowError: { borderColor: P.error },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: P.text, paddingVertical: 0 },
  inputDisabled: { color: P.disabledText },
  errorText: { fontSize: 11, color: P.error, marginTop: 4, marginLeft: 4 },
  saveBtnWrap: { marginTop: 24 },
  saveBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: P.mint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.mint,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
