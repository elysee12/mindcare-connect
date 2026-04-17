import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/design';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'mhp' | 'chw' | 'admin' | 'family';
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role.toLowerCase() !== allowedRole) {
    // If user is logged in but has wrong role, redirect to their own dashboard
    return <Redirect href={`/(${user.role.toLowerCase()})` as any} />;
  }

  return <>{children}</>;
}
