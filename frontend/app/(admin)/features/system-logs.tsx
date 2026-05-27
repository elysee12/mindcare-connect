import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function SystemLogs() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: () => api.systemLogs(),
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => api.clearLogs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemLogs'] });
      setStatus(t('system_logs.cleared'));
      setTimeout(() => setStatus(''), 3000);
    },
    onError: () => {
      setStatus(t('system_logs.clear_failed'));
      setTimeout(() => setStatus(''), 3000);
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
        <Text style={styles.title}>{t('system_logs.title')}</Text>
        <Text style={styles.subtitle}>{t('system_logs.subtitle')}</Text>

        {isLoading ? (
          <Text style={styles.subtitle}>{t('system_logs.loading')}</Text>
        ) : logs && Array.isArray(logs) && logs.length > 0 ? (
          logs.map((item: any) => (
            <Card key={item.id} style={styles.logCard} variant="elevated">
              <View style={styles.logHeader}>
                <Text style={styles.logEvent}>{item.event}</Text>
                <Text style={styles.logTime}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              {item.user && (
                <Text style={styles.logUser}>
                  {t('system_logs.user_label')}: {item.user.fullName} ({item.user.email})
                </Text>
              )}
            </Card>
          ))
        ) : (
          <Text style={styles.subtitle}>{t('system_logs.no_logs')}</Text>
        )}

        <View style={styles.buttonWrapper}>
          <Button variant="primary" fullWidth onPress={() => clearLogsMutation.mutate()} disabled={clearLogsMutation.isPending}>
            {clearLogsMutation.isPending ? t('system_logs.clearing') : t('system_logs.clear_btn')}
          </Button>
        </View>

        {status ? (
          <Text style={[styles.toast, status === t('system_logs.clear_failed') ? styles.errorToast : styles.successToast]}>
            {status}
          </Text>
        ) : null}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.backgroundSecondary, flex: 1 },
  headbar: { padding: spacing.md, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.primary, marginLeft: spacing.xs },
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  logCard: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm, marginBottom: spacing.sm },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  logEvent: { ...typography.body, color: colors.text, flex: 1, marginRight: spacing.sm },
  logTime: { ...typography.caption, color: colors.textSecondary },
  logUser: { ...typography.caption, color: colors.primary, fontStyle: 'italic' },
  buttonWrapper: { marginTop: spacing.md },
  toast: { marginTop: spacing.sm, ...typography.captionBold, textAlign: 'center', padding: spacing.sm, borderRadius: borderRadius.md },
  successToast: { color: colors.success, backgroundColor: colors.success + '20' },
  errorToast: { color: colors.error, backgroundColor: colors.error + '20' },
});
