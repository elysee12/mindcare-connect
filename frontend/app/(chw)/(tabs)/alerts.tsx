import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { translateNotifications, TranslatedNotification } from '@/lib/notificationTranslation';

export default function AlertsScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: rawAlerts, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => api.notifications(user?.id),
    staleTime: 1000 * 30,
  });

  const alerts: TranslatedNotification[] = rawAlerts
    ? translateNotifications(rawAlerts, t)
    : [];

  const dismissMutation = useMutation({
    mutationFn: (id: number) => api.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const getAlertIcon = (type: string) => {
    const lower = type?.toLowerCase() ?? '';
    if (lower.includes('appointment') || lower.includes('reminder')) return 'calendar';
    if (lower.includes('found')) return 'location';
    if (lower.includes('treatment')) return 'medkit';
    if (lower.includes('followup')) return 'document-text';
    if (lower.includes('report')) return 'analytics';
    if (lower.includes('user')) return 'person';
    return 'notifications';
  };

  const getAlertColor = (type: string) => {
    const lower = type?.toLowerCase() ?? '';
    if (lower.includes('appointment') || lower.includes('reminder')) return colors.info;
    if (lower.includes('found')) return colors.success;
    if (lower.includes('treatment')) return colors.primary;
    if (lower.includes('followup')) return colors.primaryLight;
    if (lower.includes('report')) return colors.warning;
    if (lower.includes('user')) return colors.primaryDark;
    return colors.textTertiary;
  };

  const renderAlertItem = ({ item }: { item: TranslatedNotification }) => (
    <Card variant="elevated" style={styles.alertCard}>
      <Card.Content style={styles.alertContent}>
        <View style={[styles.iconContainer, { backgroundColor: getAlertColor(item.type) + '15' }]}>
          <Ionicons name={getAlertIcon(item.type)} size={24} color={getAlertColor(item.type)} />
        </View>
        <View style={styles.alertText}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>{item.translatedTitle}</Text>
            <Text style={styles.alertTime}>{t('notifications.just_now')}</Text>
          </View>
          <Text style={styles.alertMessage}>{item.translatedMessage}</Text>
          <View style={styles.alertFooter}>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {}}
              textStyle={{ color: colors.primary, ...typography.captionBold }}
            >
              {t('notifications.take_action')}
            </Button>
            <TouchableOpacity onPress={() => dismissMutation.mutate(item.id)}>
              <Text style={styles.dismissText}>{t('notifications.dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('notifications.system_alerts')}</Text>
        <TouchableOpacity style={styles.markAllBtn} onPress={() => refetch()}>
          <Text style={styles.markAllText}>{t('notifications.mark_all_read')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={60} color={colors.border} />
            <Text style={styles.emptyText}>{t('notifications.no_alerts')}</Text>
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
    flex: 1,
    marginRight: spacing.sm,
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
