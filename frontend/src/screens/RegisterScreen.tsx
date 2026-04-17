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
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import Feather from 'react-native-vector-icons/Feather';
import { getApiErrorMessage, isStrongEnoughPassword, isValidEmail } from '../utils/validation';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: any) {
  const register = useAuthStore((s) => s.register);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async () => {
    if (!email || !password || !name || !confirmPassword) {
      setError('Барлық өрістерді толтырыңыз');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Жарамды email енгізіңіз');
      return;
    }

    if (!isStrongEnoughPassword(password)) {
      setError('Құпия сөз кемінде 6 таңбадан тұруы керек');
      return;
    }

    if (password !== confirmPassword) {
      setError('Құпия сөздер сәйкес келмейді');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      await register(email.trim(), password, name.trim());
    } catch (e: any) {
      setError(getApiErrorMessage(e, 'Тіркелу қатесі. Желіні тексеріңіз!'));
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
            <Text style={styles.title}>Тіркелу</Text>
            <Text style={styles.subtitle}>Ақылды сатып алу үшін аккаунт жасаңыз</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Аты-жөніңіз</Text>
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#94A3B8" />
              <TextInput 
                placeholder="Пайдаланушы аты" 
                value={name} 
                onChangeText={setName} 
                style={styles.input}
                placeholderTextColor="#CBD5E1"
              />
            </View>

            <Text style={styles.inputLabel}>Электрондық пошта</Text>
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
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Құпия сөзді растаңыз</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#94A3B8" />
              <TextInput 
                placeholder="Құпия сөзді қайталаңыз" 
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                style={styles.input}
                placeholderTextColor="#CBD5E1"
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#94A3B8" />
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
              style={[styles.registerButton, loading && styles.disabledButton]} 
              onPress={onSubmit} 
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Жүктелуде...' : 'Тіркелу'}
              </Text>
              {!loading && <Feather name="check" size={20} color="#FFF" style={{marginLeft: 8}} />}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.termsText}>
              Түймені басу арқылы сіз {'\n'} 
              <Text style={styles.linkTextInline}>Пайдаланушы келісімін</Text> қабылдайсыз
            </Text>

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => navigation.navigate('BusinessRegister')}
              style={{ marginTop: 18 }}
            >
              <Text style={styles.businessLink}>
                Бизнес иесісіз бе?{' '}
                <Text style={styles.businessLinkBold}>Бизнес тіркелу →</Text>
              </Text>
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
  businessLink: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  businessLinkBold: { color: '#4AB7B6', fontWeight: '700' },
});
