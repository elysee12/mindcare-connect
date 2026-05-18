import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/constants/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function AdminTabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          borderTopColor: colors.border,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
          backgroundColor: colors.background,
        },
        tabBarLabelStyle: {
          ...typography.smallBold,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: t('nav.users'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'people-circle' : 'people-circle-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('nav.reports'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
