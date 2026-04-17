import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import * as AuthApi from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function PersonalDataScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    try {
      setLoading(true);
      const updated = await AuthApi.updateProfile({
        name: name.trim() || null,
        phone: phone.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      setUser(updated);
      Alert.alert('Сақталды', 'Жеке деректер сәтті жаңартылды');
      navigation.goBack();
    } catch {
      Alert.alert('Қате', 'Жеке деректерді сақтау мүмкін болмады');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Жеке деректер</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Email</Text>
        <TextInput value={user?.email ?? ''} editable={false} style={[styles.input, styles.disabledInput]} />

        <Text style={styles.label}>Аты-жөні</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Аты-жөні" />

        <Text style={styles.label}>Телефон</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          placeholder="+7 700 000 00 00"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Аватар URL</Text>
        <TextInput
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          style={styles.input}
          placeholder="https://..."
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Сақтау</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  formCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  label: { marginTop: 10, marginBottom: 6, color: '#334155', fontWeight: '700', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  disabledInput: { backgroundColor: '#F1F5F9', color: '#64748B' },
  saveBtn: {
    marginTop: 18,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
