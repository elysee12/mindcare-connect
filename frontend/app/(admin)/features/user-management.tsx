import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '@/lib/api';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function UserManagement() {
  const router = useRouter();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users(),
    staleTime: 1000 * 60,
  });

  const users = query.data || [];
  const refetch = query.refetch;

  useFocusEffect(React.useCallback(() => { refetch(); }, [refetch]));

  const handleView = (userId: string) => router.push(`/(admin)/features/view-user?id=${encodeURIComponent(userId)}`);
  const handleEdit = (user: any) => router.push(`/(admin)/features/edit-user?id=${encodeURIComponent(user.id)}`);

  const handleDelete = (userId: string) => {
    Alert.alert(
      t('user_mgmt.delete_title'),
      t('user_mgmt.delete_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try { await api.deleteUser(userId); refetch(); }
            catch (error: any) { Alert.alert(t('user_mgmt.delete_error'), error?.message || ''); }
          },
        },
      ]
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
        <View style={styles.header}>
          <Text style={styles.title}>{t('user_mgmt.title')}</Text>
          <Text style={styles.subtitle}>{t('user_mgmt.subtitle')}</Text>
        </View>
        <View style={styles.addRow}>
          <Button variant="primary" onPress={() => router.push('/(admin)/features/add-user')} style={styles.addButton}>
            <Ionicons name="person-add" size={18} color={colors.white} />
            <Text style={styles.addButtonText}>{t('user_mgmt.add_user')}</Text>
          </Button>
        </View>
        <View style={styles.usersList}>
          {users.map((user: any) => (
            <TouchableOpacity key={user.id} activeOpacity={0.9} onPress={() => handleView(user.id)}>
              <Card style={styles.userCard} variant="elevated">
                <View style={styles.userInfo}>
                  <View style={styles.userHeader}>
                    {/* User name is real data — display as-is */}
                    <Text style={styles.userName}>{user.fullName}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: user.role === 'MHP' ? colors.primaryTint : colors.successTint }]}>
                      <Text style={[styles.roleText, { color: user.role === 'MHP' ? colors.primary : colors.success }]}>
                        {t(`status_values.${user.role}`, { defaultValue: user.role })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userPhone}>{user.phone}</Text>
                  {user.workplace && <Text style={styles.userDetail}>{t('user_mgmt.workplace_label')}: {user.workplace}</Text>}
                  {user.province && <Text style={styles.userDetail}>{t('user_mgmt.province_label')}: {user.province}</Text>}
                  {user.district && <Text style={styles.userDetail}>{t('user_mgmt.district_label')}: {user.district}</Text>}
                  {user.sector && <Text style={styles.userDetail}>{t('user_mgmt.sector_label')}: {user.sector}</Text>}
                  {user.cell && <Text style={styles.userDetail}>{t('user_mgmt.cell_label')}: {user.cell}</Text>}
                  {user.village && <Text style={styles.userDetail}>{t('user_mgmt.village_label')}: {user.village}</Text>}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleView(user.id)}><Ionicons name="eye" size={20} color={colors.primary} /></TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(user)}><Ionicons name="create" size={20} color={colors.primary} /></TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(user.id)}><Ionicons name="trash" size={20} color={colors.error} /></TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
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
  content: { padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  addRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.lg },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: borderRadius.md, height: 42, minWidth: 140, paddingHorizontal: spacing.md },
  addButtonText: { ...typography.bodyBold, color: colors.white },
  usersList: { gap: spacing.md },
  userCard: { padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm, flexDirection: 'row', alignItems: 'center' },
  userInfo: { flex: 1 },
  userHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  userName: { ...typography.bodyBold, color: colors.text },
  roleBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2, borderRadius: borderRadius.sm },
  roleText: { ...typography.tiny, fontWeight: 'bold' },
  userEmail: { ...typography.caption, color: colors.textSecondary },
  userPhone: { ...typography.caption, color: colors.textSecondary },
  userDetail: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs / 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
});
