import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, StatusBar,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { api } from '../api/client';
import { getApiErrorMessage, isStrongEnoughPassword } from '../utils/validation';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const routeToken = route.params?.token || '';
  const [token, setToken] = useState(routeToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!token) {
      setError('Токенді енгізіңіз');
      return;
    }
    if (!isStrongEnoughPassword(newPassword)) {
      setError('Құпия сөз кемінде 6 таңбадан тұруы керек');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Құпия сөздер сәйкес келмейді');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword });
      Alert.alert('Сәтті', 'Құпия сөз өзгертілді. Жаңа құпия сөзбен кіріңіз', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e: any) {
      setError(getApiErrorMessage(e, 'Қате орын алды'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={28} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="lock" size={36} color="#27AE60" />
            </View>
            <Text style={styles.title}>Жаңа құпия сөз</Text>
            <Text style={styles.subtitle}>Жаңа құпия сөзді енгізіңіз</Text>
          </View>

          <View style={styles.formCard}>
            {!routeToken && (
              <>
                <Text style={styles.inputLabel}>Токен</Text>
                <View style={styles.inputContainer}>
                  <Feather name="key" size={20} color="#94A3B8" />
                  <TextInput
                    placeholder="Токенді енгізіңіз"
                    autoCapitalize="none"
                    value={token}
                    onChangeText={setToken}
                    style={styles.input}
                    placeholderTextColor="#CBD5E1"
                  />
                </View>
              </>
            )}

            <Text style={styles.inputLabel}>Жаңа құпия сөз</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Кемінде 6 таңба"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
                placeholderTextColor="#CBD5E1"
              />
            </View>

            <Text style={styles.inputLabel}>Құпия сөзді растаңыз</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Құпия сөзді қайталаңыз"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                placeholderTextColor="#CBD5E1"
              />
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
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Сақтау</Text>
              )}
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
});
