import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  Dimensions,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import Feather from 'react-native-vector-icons/Feather';
import { getApiErrorMessage, isValidEmail } from '../utils/validation';
import { useI18n } from '../i18n/useI18n';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const { t } = useI18n();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async () => {
    if (!isValidEmail(email)) {
      setError(t('Дұрыс email енгізіңіз', 'Введите корректный email'));
      return;
    }

    if (!password.length) {
      setError(t('Құпия сөзді енгізіңіз', 'Введите пароль'));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(getApiErrorMessage(e, t('Логин немесе құпия сөз қате', 'Неверный логин или пароль')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Декоративный "умный" фон */}
          <View style={styles.headerDecoration} />

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Feather name="shopping-bag" size={42} color="#27AE60" />
            </View>
            <Text style={styles.title}>Aqyldy Sebet</Text>
            <Text style={styles.subtitle}>Smart Retail Ecosystem</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#94A3B8" />
              <TextInput 
                placeholder="example@mail.com" 
                autoCapitalize="none"
                keyboardType="email-address"
                value={email} 
                onChangeText={setEmail} 
                style={styles.input}
                placeholderTextColor="#CBD5E1"
              />
            </View>

            <Text style={styles.inputLabel}>Құпия сөз</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#94A3B8" />
              <TextInput 
                placeholder="Кемінде 6 таңба" 
                secureTextEntry={!showPassword}
                value={password} 
                onChangeText={setPassword} 
                style={styles.input}
                placeholderTextColor="#CBD5E1"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
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
              style={[styles.loginButton, loading && styles.disabledButton]} 
              onPress={onSubmit} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>{t('Кіру', 'Войти')}</Text>
                  <Feather name="arrow-right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.6}
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>{t('Құпия сөзді ұмыттым?', 'Забыли пароль?')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              activeOpacity={0.6} 
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.footerText}>
                {t('Тіркелмедіңіз бе?', 'Нет аккаунта?')} <Text style={styles.linkText}>{t('Тіркелу', 'Регистрация')}</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              activeOpacity={0.7} 
              style={styles.businessLoginBtn}
              onPress={() => navigation.navigate('BusinessLogin')}
            >
              <Feather name="briefcase" size={16} color="#0EA5E9" />
              <Text style={styles.businessLoginText}>Сатушы ретінде кіру</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: 28, 
    paddingBottom: 40, 
    justifyContent: 'center' 
  },
  headerDecoration: {
    position: 'absolute',
    top: -width * 0.25,
    right: -width * 0.15,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#F0FDF4',
    zIndex: -1,
  },
  header: { alignItems: 'center', marginBottom: 45 },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  title: { fontSize: 34, fontWeight: '900', color: '#1E293B', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 6, fontWeight: '500' },
  formCard: { width: '100%' },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 18,
    marginBottom: 22,
    height: 64,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  eyeBtn: { padding: 4, marginLeft: 8 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  errorText: { color: '#EF4444', fontSize: 14, marginLeft: 8, fontWeight: '600' },
  loginButton: {
    backgroundColor: '#27AE60',
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 10,
  },
  disabledButton: { opacity: 0.7, backgroundColor: '#94A3B8' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginRight: 10 },
  forgotBtn: { alignItems: 'center', marginTop: 16 },
  forgotText: { fontSize: 14, color: '#27AE60', fontWeight: '700' },
  footer: { marginTop: 35, alignItems: 'center' },
  footerText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  linkText: { color: '#27AE60', fontWeight: '800' },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  businessLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0EA5E9',
    gap: 8,
  },
  businessLoginText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0EA5E9',
  },
});
