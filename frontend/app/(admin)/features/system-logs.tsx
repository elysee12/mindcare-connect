import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SystemLogs() {
  const router = useRouter();
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
      setStatus('Logs cleared successfully');
      setTimeout(() => setStatus(''), 3000);
    },
    onError: () => {
      setStatus('Failed to clear logs');
      setTimeout(() => setStatus(''), 3000);
    },
  });

  const handleClearLogs = () => {
    clearLogsMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container safeArea edges={[ 'top', 'bottom' ]} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>System Logs</Text>
        <Text style={styles.subtitle}>Recent platform activity</Text>

        {isLoading ? (
          <Text style={styles.subtitle}>Loading logs...</Text>
        ) : logs && Array.isArray(logs) && logs.length > 0 ? (
          logs.map((item: any) => (
            <Card key={item.id} style={styles.logCard} variant="elevated">
              <View style={styles.logHeader}>
                <Text style={styles.logEvent}>{item.event}</Text>
                <Text style={styles.logTime}>{formatDate(item.createdAt)}</Text>
              </View>
              {item.user && (
                <Text style={styles.logUser}>
                  User: {item.user.fullName} ({item.user.email})
                </Text>
              )}
            </Card>
          ))
        ) : (
          <Text style={styles.subtitle}>No logs found.</Text>
        )}

        <View style={styles.buttonWrapper}>
          <Button
            variant="primary"
            fullWidth
            onPress={handleClearLogs}
            disabled={clearLogsMutation.isPending}
          >
            {clearLogsMutation.isPending ? 'Clearing...' : 'Clear Logs'}
          </Button>
        </View>

        {status ? (
          <Text style={[styles.toast, status.includes('Failed') ? styles.errorToast : styles.successToast]}>
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
  logEvent: { ...typography.body, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  logTime: { ...typography.caption, color: colors.textSecondary },
  logUser: { ...typography.caption, color: colors.primary, fontStyle: 'italic' },
  buttonWrapper: { marginTop: spacing.md },
  toast: { marginTop: spacing.sm, ...typography.captionBold, textAlign: 'center', padding: spacing.sm, borderRadius: borderRadius.md },
  successToast: { color: colors.success, backgroundColor: colors.success + '20' },
  errorToast: { color: colors.error, backgroundColor: colors.error + '20' },
});
