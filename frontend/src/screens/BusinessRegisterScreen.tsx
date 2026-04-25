import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar,
  ScrollView, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import Feather from 'react-native-vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

export default function BusinessRegisterScreen({ navigation }: any) {
  const typedNavigation = navigation as NativeStackNavigationProp<RootStackParamList>;
  const registerBusiness = useAuthStore((s) => s.registerBusiness);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [storeName, setStoreName] = React.useState('');
  const [storeAddress, setStoreAddress] = React.useState('');
  const [latitude, setLatitude] = React.useState<number | null>(null);
  const [longitude, setLongitude] = React.useState<number | null>(null);
  const [phone, setPhone] = React.useState('');
  const [bin, setBin] = React.useState('');
  const [workingHours, setWorkingHours] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async () => {
    if (!email || !password || !storeName) {
      setError('Email, пароль және дүкен атауын толтырыңыз');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await registerBusiness({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim() || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        phone: phone.trim() || undefined,
        bin: bin.trim() || undefined,
        workingHours: workingHours.trim() || undefined,
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Тіркелу қатесі. Желіні тексеріңіз!');
    } finally {
      setLoading(false);
    }
  };

  const fields: { label: string; icon: string; value: string; setter: (v: string) => void; placeholder: string; required?: boolean; keyboard?: any; secure?: boolean }[] = [
    { label: 'Иесінің аты', icon: 'user', value: name, setter: setName, placeholder: 'Аты-жөні' },
    { label: 'Email *', icon: 'mail', value: email, setter: setEmail, placeholder: 'email@example.com', required: true, keyboard: 'email-address' },
    { label: 'Құпия сөз *', icon: 'lock', value: password, setter: setPassword, placeholder: 'Кемінде 6 таңба', required: true, secure: true },
    { label: 'Дүкен атауы *', icon: 'shopping-bag', value: storeName, setter: setStoreName, placeholder: 'Мысалы: Magnum', required: true },
    { label: 'Телефон', icon: 'phone', value: phone, setter: setPhone, placeholder: '+7 777 123 4567', keyboard: 'phone-pad' },
    { label: 'БИН / ИИН', icon: 'hash', value: bin, setter: setBin, placeholder: '12 санды код', keyboard: 'numeric' },
    { label: 'Жұмыс уақыты', icon: 'clock', value: workingHours, setter: setWorkingHours, placeholder: '08:00-22:00' },
  ];

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
          <View style={styles.headerDecoration} />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Бизнес тіркелу</Text>
            <Text style={styles.subtitle}>Дүкеніңізді тіркеп, тауарларды басқарыңыз</Text>
          </View>

          <View style={styles.formCard}>
            <View>
              <Text style={styles.inputLabel}>Дүкен мекенжайы</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() =>
                  typedNavigation.navigate('AddressPicker', {
                    onConfirm: (address, lat, lng) => {
                      setStoreAddress(address);
                      setLatitude(lat);
                      setLongitude(lng);
                    },
                  })
                }
              >
                <Feather name="map-pin" size={20} color="#94A3B8" />
                <Text style={[styles.input, !storeAddress && { color: '#CBD5E1' }]} numberOfLines={1}>
                  {storeAddress || 'Картадан таңдаңыз'}
                </Text>
                {storeAddress ? <Feather name="check-circle" size={18} color="#22C55E" /> : null}
              </TouchableOpacity>
            </View>

            {fields.map((f) => (
              <View key={f.label}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <View style={styles.inputContainer}>
                  <Feather name={f.icon as any} size={20} color="#94A3B8" />
                  <TextInput
                    placeholder={f.placeholder}
                    value={f.value}
                    onChangeText={f.setter}
                    style={styles.input}
                    placeholderTextColor="#CBD5E1"
                    autoCapitalize={f.keyboard === 'email-address' ? 'none' : 'sentences'}
                    keyboardType={f.keyboard || 'default'}
                    secureTextEntry={f.secure}
                  />
                </View>
              </View>
            ))}

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
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Тіркелу</Text>
                  <Feather name="check" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity activeOpacity={0.6} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerText}>
                Қарапайым пайдаланушы? <Text style={styles.linkTextInline}>Мұнда тіркеліңіз</Text>
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
  },
  headerDecoration: {
    position: 'absolute',
    top: -width * 0.15,
    right: -width * 0.15,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#E0F2F1',
    zIndex: -1,
  },
  backButton: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerTextContainer: { marginBottom: 28 },
  title: { fontSize: 30, fontWeight: '800', color: '#1E293B', letterSpacing: -1 },
  subtitle: { fontSize: 15, color: '#64748B', marginTop: 6, lineHeight: 22 },
  formCard: { width: '100%' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 16, paddingHorizontal: 14, marginBottom: 14, height: 56,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1E293B', fontWeight: '500' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF2F2', padding: 14, borderRadius: 14, marginBottom: 16,
  },
  errorText: { color: '#EF4444', fontSize: 14, marginLeft: 8, fontWeight: '600' },
  registerButton: {
    backgroundColor: '#4AB7B6', height: 60, borderRadius: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4AB7B6', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6, marginTop: 8,
  },
  disabledButton: { opacity: 0.6, backgroundColor: '#94A3B8' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  footer: { marginTop: 28, alignItems: 'center', marginBottom: 20 },
  footerText: { fontSize: 14, color: '#64748B' },
  linkTextInline: { color: '#4AB7B6', fontWeight: '700' },
});
