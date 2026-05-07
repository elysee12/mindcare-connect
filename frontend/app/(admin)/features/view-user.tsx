import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

type User = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  workplace?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function ViewUser() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const { data: user, isLoading, isError } = useQuery<User>({
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
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteUser(id);
              Alert.alert('Deleted', 'User removed successfully.');
              router.back();
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
        <Text style={styles.title}>View User</Text>
        <Text style={styles.subtitle}>All details for this account</Text>

        <Card style={styles.card} variant="elevated">
          {isLoading ? (
            <Text style={styles.loadingText}>Loading user details...</Text>
          ) : isError || !user ? (
            <Text style={styles.errorText}>Unable to load user details.</Text>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{user.fullName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{user.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{user.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{user.role}</Text>
              </View>
              {user.workplace ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Workplace</Text>
                  <Text style={styles.detailValue}>{user.workplace}</Text>
                </View>
              ) : null}
              {user.province ? (
                 <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>Province</Text>
                   <Text style={styles.detailValue}>{user.province}</Text>
                 </View>
               ) : null}
               {user.district ? (
                 <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>District</Text>
                   <Text style={styles.detailValue}>{user.district}</Text>
                 </View>
               ) : null}
              {user.sector ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sector</Text>
                  <Text style={styles.detailValue}>{user.sector}</Text>
                </View>
              ) : null}
              {user.cell ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cell</Text>
                  <Text style={styles.detailValue}>{user.cell}</Text>
                </View>
              ) : null}
              {user.village ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Village</Text>
                  <Text style={styles.detailValue}>{user.village}</Text>
                </View>
              ) : null}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Updated</Text>
                <Text style={styles.detailValue}>{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '-'}</Text>
              </View>
            </>
          )}
        </Card>

        <View style={styles.buttonRow}>
          <Button variant="secondary" fullWidth onPress={handleEdit}>
            Edit User
          </Button>
          <Button variant="danger" fullWidth onPress={handleDelete}>
            Delete User
          </Button>
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
