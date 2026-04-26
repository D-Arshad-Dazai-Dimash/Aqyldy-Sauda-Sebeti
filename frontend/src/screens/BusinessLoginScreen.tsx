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

export default function BusinessLoginScreen({ navigation }: any) {
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
      <StatusBar barStyle="light-content" backgroundColor="#1F4B47" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Декоративный header */}
          <View style={styles.headerDecoration} />

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Feather name="store" size={48} color="#FFF" />
            </View>
            <Text style={styles.title}>Aqyldy Sebet</Text>
            <Text style={styles.subtitle}>Сатушы портали</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Feather name="lock" size={20} color="#0EA5E9" />
              <Text style={styles.formTitle}>Дүкен ие ретінде кіру</Text>
            </View>

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
                  <Text style={styles.buttonText}>Портальға кіру</Text>
                  <Feather name="arrow-right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.6}
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Құпия сөзді ұмыттым?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Дүкен ие емес пе?</Text>
            <TouchableOpacity 
              activeOpacity={0.6} 
              onPress={() => navigation.navigate('BusinessRegister')}
              style={styles.registerLink}
            >
              <Text style={styles.registerText}>Сатушы ретінде тіркелу</Text>
              <Feather name="arrow-right" size={14} color="#0EA5E9" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              activeOpacity={0.6}
              onPress={() => navigation.goBack()}
              style={styles.backLink}
            >
              <Feather name="arrow-left" size={16} color="#64748B" />
              <Text style={styles.backLinkText}>  Қайта</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerDecoration: {
    width: width - 40,
    height: 140,
    backgroundColor: '#1F4B47',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginHorizontal: -20,
    marginBottom: 32,
  },
  header: {
    marginTop: -100,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 8,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 8,
  },
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotText: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 12,
    fontWeight: '500',
  },
  registerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0EA5E9',
    marginBottom: 12,
  },
  registerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0EA5E9',
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});
