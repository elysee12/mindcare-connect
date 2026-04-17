import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '@/lib/api';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone: string;
  workplace?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function UserManagement() {
  const router = useRouter();

  const query = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users(),
    staleTime: 1000 * 60,
  });

  const users = query.data || [];
  const isLoading = query.isLoading;
  const refetch = query.refetch;

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleView = (userId: string) => {
    router.push(`/(admin)/features/view-user?id=${encodeURIComponent(userId)}`);
  };

  const handleEdit = (user: User) => {
    router.push(`/(admin)/features/edit-user?id=${encodeURIComponent(user.id)}`);
  };

  const handleDelete = (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteUser(userId);
              refetch();
            } catch (error: any) {
              Alert.alert('Unable to delete user', error?.message || 'Please try again.');
            }
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
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitle}>Manage registered users</Text>
        </View>

        <View style={styles.addRow}>
          <Button
            variant="primary"
            onPress={() => router.push('/(admin)/features/add-user')}
            style={styles.addButton}
          >
            <Ionicons name="person-add" size={18} color={colors.white} />
            <Text style={styles.addButtonText}>Add User</Text>
          </Button>
        </View>

        <View style={styles.usersList}>
          {users.map((user) => (
            <TouchableOpacity key={user.id} activeOpacity={0.9} onPress={() => handleView(user.id)}>
              <Card style={styles.userCard} variant="elevated">
                <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>{user.fullName}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: user.role === 'MHP' ? colors.primaryTint : colors.successTint }]}>
                    <Text style={[styles.roleText, { color: user.role === 'MHP' ? colors.primary : colors.success }]}>{user.role}</Text>
                  </View>
                </View>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userPhone}>{user.phone}</Text>
                {user.workplace && <Text style={styles.userDetail}>Workplace: {user.workplace}</Text>}
                {user.district && <Text style={styles.userDetail}>District: {user.district}</Text>}
                {user.sector && <Text style={styles.userDetail}>Sector: {user.sector}</Text>}
                {user.cell && <Text style={styles.userDetail}>Cell: {user.cell}</Text>}
                {user.village && <Text style={styles.userDetail}>Village: {user.village}</Text>}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleView(user.id)}>
                  <Ionicons name="eye" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(user)}>
                  <Ionicons name="create" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(user.id)}>
                  <Ionicons name="trash" size={20} color={colors.error} />
                </TouchableOpacity>
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
  addRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 42,
    minWidth: 140,
    paddingHorizontal: spacing.md,
  },
  addButtonText: { ...typography.bodyBold, color: colors.white },
  usersList: { gap: spacing.md },
  userCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: { flex: 1 },
  userHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  userName: { ...typography.bodyBold, color: colors.text },
  roleBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2, borderRadius: borderRadius.sm },
  roleText: { ...typography.tiny, fontWeight: 'bold' },
  userEmail: { ...typography.caption, color: colors.textSecondary },
  userPhone: { ...typography.caption, color: colors.textSecondary },
  userDetail: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs / 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
});
