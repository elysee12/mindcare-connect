import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function ViewUser() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.userById(id!),
    enabled: !!id,
  });

  const handleEdit = () => {
    if (!id) return;
    router.push(`/(admin)/features/edit-user?id=${encodeURIComponent(id)}`);
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      t('view_user.delete_title'),
      t('view_user.delete_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteUser(id);
              Alert.alert(t('view_user.deleted'), t('view_user.deleted_msg'));
              router.back();
            } catch (error: any) {
              Alert.alert(t('view_user.delete_error'), error?.message || '');
            }
          },
        },
      ]
    );
  };

  const DetailRow = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
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
        <Text style={styles.title}>{t('view_user.title')}</Text>
        <Text style={styles.subtitle}>{t('view_user.subtitle')}</Text>

        <Card style={styles.card} variant="elevated">
          {isLoading ? (
            <Text style={styles.loadingText}>{t('view_user.loading')}</Text>
          ) : isError || !user ? (
            <Text style={styles.errorText}>{t('view_user.error')}</Text>
          ) : (
            <>
              {/* User data is real — display as-is, only translate labels */}
              <DetailRow label={t('view_user.full_name')} value={user.fullName} />
              <DetailRow label={t('view_user.email')} value={user.email} />
              <DetailRow label={t('view_user.phone')} value={user.phone} />
              <DetailRow label={t('view_user.role')} value={t(`status_values.${user.role}`, { defaultValue: user.role })} />
              <DetailRow label={t('view_user.workplace')} value={user.workplace} />
              <DetailRow label={t('view_user.province')} value={user.province} />
              <DetailRow label={t('view_user.district')} value={user.district} />
              <DetailRow label={t('view_user.sector')} value={user.sector} />
              <DetailRow label={t('view_user.cell')} value={user.cell} />
              <DetailRow label={t('view_user.village')} value={user.village} />
              <DetailRow label={t('view_user.created')} value={user.createdAt ? new Date(user.createdAt).toLocaleString() : undefined} />
              <DetailRow label={t('view_user.updated')} value={user.updatedAt ? new Date(user.updatedAt).toLocaleString() : undefined} />
            </>
          )}
        </Card>

        <View style={styles.buttonRow}>
          <Button variant="secondary" fullWidth onPress={handleEdit}>{t('view_user.edit_btn')}</Button>
          <Button variant="danger" fullWidth onPress={handleDelete}>{t('view_user.delete_btn')}</Button>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.backgroundSecondary, flex: 1 },
  headbar: { padding: spacing.md, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.primary, marginLeft: spacing.xs },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  card: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm },
  loadingText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  errorText: { ...typography.bodyBold, color: colors.error, textAlign: 'center' },
  detailRow: { marginBottom: spacing.sm },
  detailLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  detailValue: { ...typography.body, color: colors.text },
  buttonRow: { gap: spacing.sm },
});
