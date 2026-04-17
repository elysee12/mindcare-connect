import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';

export default function AlertsScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const { user } = useAuth();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => api.notifications(user?.id),
    staleTime: 1000 * 30,
  });

  const getAlertIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'medication': return 'medkit';
      case 'appointment': return 'calendar';
      case 'alert': return 'warning';
      default: return 'notifications';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'medication': return colors.primary;
      case 'appointment': return colors.info;
      case 'alert': return colors.error;
      default: return colors.textTertiary;
    }
  };

  const renderAlertItem = ({ item }: { item: any }) => (
    <Card variant="elevated" style={styles.alertCard}>
      <Card.Content style={styles.alertContent}>
        <View style={[styles.iconContainer, { backgroundColor: getAlertColor(item.type) + '15' }]}>
          <Ionicons name={getAlertIcon(item.type)} size={24} color={getAlertColor(item.type)} />
        </View>
        <View style={styles.alertText}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>{item.title}</Text>
            <Text style={styles.alertTime}>Just now</Text>
          </View>
          <Text style={styles.alertMessage}>{item.message}</Text>
          <View style={styles.alertFooter}>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {}}
              textStyle={{ color: colors.primary, ...typography.captionBold }}
            >
              Take Action
            </Button>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Alerts</Text>
        <TouchableOpacity style={styles.markAllBtn}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={60} color={colors.border} />
            <Text style={styles.emptyText}>No active alerts</Text>
          </View>
        }
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundAlt,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  markAllBtn: {
    padding: spacing.xs,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  alertCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
  },
  alertContent: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertText: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  alertTime: {
    ...typography.tiny,
    color: colors.textTertiary,
  },
  alertMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dismissText: {
    ...typography.tiny,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});
