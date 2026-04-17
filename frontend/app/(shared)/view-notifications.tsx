import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function ViewNotifications() {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.notifications(user?.id),
  });
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('');

  const clear = () => {
    setStatusMessage('Notifications cleared');
    setTimeout(() => setStatusMessage(''), 900);
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>View Notifications</Text>
        <Text style={styles.subtitle}>Static list of alerts</Text>

        {notifications.map((item) => (
          <Card key={item.id} style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationText}>{item.message}</Text>
          </Card>
        ))}

        <View style={styles.buttonWrapper}>
          <Button variant="primary" fullWidth onPress={clear}>
            Clear Notifications
          </Button>
        </View>

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
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  notificationCard: { padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  notificationTitle: { ...typography.bodyBold, color: colors.text },
  notificationText: { ...typography.caption, color: colors.textSecondary },
  button: { marginTop: spacing.md },
  buttonWrapper: { marginTop: spacing.md },
  toast: { position: 'absolute', bottom: 28, left: spacing.md, right: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.sm, alignItems: 'center' },
  toastText: { ...typography.captionBold, color: colors.white },
});
