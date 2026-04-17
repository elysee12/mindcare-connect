import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { colors } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { typography, shadows } from '@/constants/design';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Always show onboarding on app start for testing/demo as requested
        await AsyncStorage.removeItem('has_completed_onboarding');
        const value = await AsyncStorage.getItem('has_completed_onboarding');
        setHasCompletedOnboarding(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        // Minimum splash time
        setTimeout(() => setIsLoading(false), 2000);
      }
    };

    checkOnboarding();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.white,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            borderWidth: 2,
            borderColor: colors.primary,
            ...shadows.md,
          }}>
            <Ionicons name="heart" size={80} color={colors.primary} />
          </View>
          <Text style={{ ...typography.h1, color: colors.primary, marginBottom: 8 }}>MindCare Connect</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>Community Mental Health Follow-Up</Text>
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}
