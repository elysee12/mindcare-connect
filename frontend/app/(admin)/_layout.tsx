import { Stack } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRole="admin">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ProtectedRoute>
  );
}
