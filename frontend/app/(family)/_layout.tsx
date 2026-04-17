import { Stack } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function FamilyLayout() {
  return (
    <ProtectedRoute allowedRole="family">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ProtectedRoute>
  );
}
