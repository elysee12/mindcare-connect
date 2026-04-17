import { Stack } from 'expo-router';

export default function SharedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="account-settings" />
      <Stack.Screen name="app-preferences" />
      <Stack.Screen name="view-notifications" />
      <Stack.Screen name="patient/[id]" />
    </Stack>
  );
}
