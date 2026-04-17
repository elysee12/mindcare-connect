import { Stack } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function MhpLayout() {
  return (
    <ProtectedRoute allowedRole="mhp">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ProtectedRoute>
  );
}
