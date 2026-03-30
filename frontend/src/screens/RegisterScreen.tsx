import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  Dimensions
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import Feather from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: any) {
  const register = useAuthStore((s) => s.register);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async () => {
    // Енді name-ді де тексереміз
    if (!email || !password || !name) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      await register(email.trim(), password, name.trim());
    } catch (e: any) {
      // МЫНА ЖЕРГЕ ҚОС:
      console.log('--- ТОЛЫҚ ҚАТЕ (ERROR) ---');
      console.log(e); // Бұл жерде Network Error немесе басқа қате шығады
      
      setError(e?.response?.data?.message ?? 'Ошибка регистрации. Проверьте сеть!');
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
          {/* Фоновый декор */}
          <View style={styles.headerDecoration} />

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // Увеличиваем зону нажатия
          >
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Регистрация</Text>
            <Text style={styles.subtitle}>Создайте аккаунт для умных покупок</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Ваше имя</Text>
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#94A3B8" />
              <TextInput 
                placeholder="Имя пользователя" 
                value={name} 
                onChangeText={setName} 
                style={styles.input}
                placeholderTextColor="#CBD5E1"
              />
            </View>

            <Text style={styles.inputLabel}>Электронная почта</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#94A3B8" />
              <TextInput 
                placeholder="email@example.com" 
                autoCapitalize="none"
                keyboardType="email-address"
                value={email} 
                onChangeText={setEmail} 
                style={styles.input}
                placeholderTextColor="#CBD5E1"
              />
            </View>

            <Text style={styles.inputLabel}>Пароль</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#94A3B8" />
              <TextInput 
                placeholder="Минимум 6 символов" 
                secureTextEntry 
                value={password} 
                onChangeText={setPassword} 
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
              style={[styles.registerButton, loading && styles.disabledButton]} 
              onPress={onSubmit} 
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Создание...' : 'Зарегистрироваться'}
              </Text>
              {!loading && <Feather name="check" size={20} color="#FFF" style={{marginLeft: 8}} />}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.termsText}>
              Нажимая кнопку, вы принимаете условия {'\n'} 
              <Text style={styles.linkTextInline}>Пользовательского соглашения</Text>
            </Text>
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
    paddingHorizontal: 24, 
    paddingBottom: 40,
    justifyContent: 'center'
  },
  headerDecoration: {
    position: 'absolute',
    top: -width * 0.15,
    left: -width * 0.15,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#F0FDF4',
    zIndex: -1,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerTextContainer: { marginBottom: 32 },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#1E293B',
    letterSpacing: -1
  },
  subtitle: { 
    fontSize: 16, 
    color: '#64748B', 
    marginTop: 6,
    lineHeight: 22
  },
  formCard: { width: '100%' },
  inputLabel: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#475569', 
    marginBottom: 8, 
    marginLeft: 4 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 62,
  },
  input: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 16, 
    color: '#1E293B',
    fontWeight: '500' 
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  errorText: { 
    color: '#EF4444', 
    fontSize: 14, 
    marginLeft: 8,
    fontWeight: '600' 
  },
  registerButton: {
    backgroundColor: '#27AE60',
    height: 62,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 10,
  },
  disabledButton: { opacity: 0.6, backgroundColor: '#94A3B8' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  footer: { marginTop: 32, alignItems: 'center' },
  termsText: { 
    fontSize: 13, 
    color: '#94A3B8', 
    textAlign: 'center', 
    lineHeight: 20 
  },
  linkTextInline: { color: '#27AE60', fontWeight: '700' },
});
