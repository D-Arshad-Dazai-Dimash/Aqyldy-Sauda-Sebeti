import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Home</Text>
      <Text style={{ marginTop: 8 }}>Role: {role ?? 'unknown'}</Text>
      <Text style={{ marginTop: 8 }}>User: {user ? JSON.stringify(user) : 'not loaded'}</Text>

      <View style={{ height: 16 }} />
      <Button title="Logout" onPress={logout} />
    </View>
  );
}