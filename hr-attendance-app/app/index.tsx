import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { user, token } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (token && user) {
        const permissions = user.permissions || [];
        if (permissions.includes('superadmin') || permissions.includes('hr')) {
          router.replace('/(hr)');
        } else {
          router.replace('/(employee)');
        }
      } else {
        router.replace('/login');
      }
    };

    // Small delay to prevent flash
    setTimeout(checkAuth, 1000);
  }, [token, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>Loading...</Text>
    </View>
  );
}