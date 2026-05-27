import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

export default function AssignRoles() {
  const router = useRouter();
  const { t } = useTranslation();
  const [status, setStatus] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['usersForRoles'],
    queryFn: () => api.users(),
  });

  const assign = () => {
    setStatus(t('assign_roles.assigned'));
    setTimeout(() => setStatus(''), 900);
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('assign_roles.title')}</Text>
        <Text style={styles.subtitle}>{t('assign_roles.subtitle')}</Text>

        {users.map((user: any) => (
          <Card key={user.id} style={styles.card} variant="elevated">
            <Text style={styles.cardTitle}>{user.fullName || user.name}</Text>
            <Text style={styles.cardSubtitle}>
              {t(`status_values.${user.role}`, { defaultValue: user.role })}
            </Text>
          </Card>
        ))}

        <View style={styles.buttonWrapper}>
          <Button variant="primary" fullWidth onPress={assign}>
            {t('assign_roles.apply_btn')}
          </Button>
        </View>

        {status ? <Text style={styles.toast}>{status}</Text> : null}
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
  card: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm },
  cardTitle: { ...typography.bodyBold, color: colors.text },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  buttonWrapper: { marginTop: spacing.md },
  toast: { marginTop: spacing.sm, ...typography.captionBold, color: colors.success },
});
