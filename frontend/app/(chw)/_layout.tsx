import { Stack } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ChwLayout() {
  return (
    <ProtectedRoute allowedRole="chw">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ProtectedRoute>
  );
}
