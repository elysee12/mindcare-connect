import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { translateNotifications, TranslatedNotification } from '@/lib/notificationTranslation';

export default function ViewNotifications() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState('');

  const { data: rawNotifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.notifications(user?.id),
  });

  const notifications: TranslatedNotification[] = translateNotifications(rawNotifications, t);

  const clearAllMutation = useMutation({
    mutationFn: () => api.clearAllNotifications(user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      setStatusMessage(t('notifications.notifications_cleared'));
      setTimeout(() => setStatusMessage(''), 900);
    },
  });

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('notifications.view_notifications')}</Text>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={60} color={colors.border} />
            <Text style={styles.emptyText}>{t('dashboard.no_notifications')}</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <Card key={item.id} style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{item.translatedTitle}</Text>
              <Text style={styles.notificationText}>{item.translatedMessage}</Text>
              <Text style={styles.notificationDate}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </Card>
          ))
        )}

        {notifications.length > 0 && (
          <View style={styles.buttonWrapper}>
            <Button variant="primary" fullWidth onPress={() => clearAllMutation.mutate()}>
              {t('notifications.clear_notifications')}
            </Button>
          </View>
        )}

        {statusMessage ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{statusMessage}</Text>
          </View>
        ) : null}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  headbar: { padding: spacing.md, backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.primary, marginLeft: spacing.xs },
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.md },
  notificationCard: { padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  notificationTitle: { ...typography.bodyBold, color: colors.text },
  notificationText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  notificationDate: { ...typography.tiny, color: colors.textTertiary, marginTop: spacing.xs },
  buttonWrapper: { marginTop: spacing.md },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxxl, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textTertiary },
  toast: { position: 'absolute', bottom: 28, left: spacing.md, right: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.sm, alignItems: 'center' },
  toastText: { ...typography.captionBold, color: colors.white },
});
