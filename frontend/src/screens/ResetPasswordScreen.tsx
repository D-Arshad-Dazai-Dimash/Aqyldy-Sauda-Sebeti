import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { api } from '../api/client';
import { getApiErrorMessage, isStrongEnoughPassword } from '../utils/validation';
import { useI18n } from '../i18n/useI18n';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const { t } = useI18n();
  const routeToken = route.params?.token || '';
  const [token] = useState(routeToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!routeToken) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.placeholderWrap}>
          <Text style={styles.placeholderText}>{t('Электрондық поштаңыздан келген сілтемені басыңыз', 'Перейдите по ссылке из письма')}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.placeholderBtn}>
            <Text style={styles.placeholderBtnText}>{t('Артқа', 'Назад')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const onSubmit = async () => {
    if (!token) {
      setError(t('Токенді енгізіңіз', 'Введите токен'));
      return;
    }
    if (!isStrongEnoughPassword(newPassword)) {
      setError(t('Құпия сөз кемінде 6 таңбадан тұруы керек', 'Пароль должен быть не менее 6 символов'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('Құпия сөздер сәйкес келмейді', 'Пароли не совпадают'));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword });
      Alert.alert(
        t('Сәтті', 'Успешно'),
        t('Құпия сөзіңіз сәтті өзгертілді', 'Ваш пароль успешно изменен'),
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
          },
        ],
      );
    } catch (e: any) {
      setError(getApiErrorMessage(e, t('Қате орын алды', 'Произошла ошибка')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={28} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="lock" size={36} color="#27AE60" />
            </View>
            <Text style={styles.title}>{t('Жаңа құпия сөз', 'Новый пароль')}</Text>
            <Text style={styles.subtitle}>{t('Жаңа құпия сөзді енгізіңіз', 'Введите новый пароль')}</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>{t('Жаңа құпия сөз', 'Новый пароль')}</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#94A3B8" />
              <TextInput
                placeholder={t('Кемінде 6 таңба', 'Минимум 6 символов')}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
                placeholderTextColor="#CBD5E1"
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
                <Feather name={showNew ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('Құпия сөзді растаңыз', 'Подтвердите пароль')}</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#94A3B8" />
              <TextInput
                placeholder={t('Құпия сөзді қайталаңыз', 'Повторите пароль')}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                placeholderTextColor="#CBD5E1"
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                <Feather name={showConfirm ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{t('Сақтау', 'Сохранить')}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 20, left: 0, padding: 5 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconContainer: {
    width: 80, height: 80, borderRadius: 26, backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 15, color: '#64748B', marginTop: 8, fontWeight: '500' },
  formCard: { width: '100%' },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20,
    paddingHorizontal: 18, marginBottom: 22, height: 64,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  eyeBtn: { padding: 4, marginLeft: 8 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
    padding: 14, borderRadius: 16, marginBottom: 20,
  },
  errorText: { color: '#EF4444', fontSize: 14, marginLeft: 8, fontWeight: '600' },
  submitButton: {
    backgroundColor: '#27AE60', height: 64, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
    elevation: 8, shadowColor: '#27AE60', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  disabledButton: { opacity: 0.7, backgroundColor: '#94A3B8' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  placeholderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: '#1E293B',
    textAlign: 'center',
    fontWeight: '600',
  },
  placeholderBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  placeholderBtnText: {
    color: '#334155',
    fontWeight: '700',
  },
});
