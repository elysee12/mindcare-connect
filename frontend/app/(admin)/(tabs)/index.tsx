import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Container, Card } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const activeName = user?.full_name || 'Admin';

  const { data: stats } = useQuery({
    queryKey: ['stats', 'admin'],
    queryFn: async () => api.dashboard('admin'),
    staleTime: 1000 * 30,
  });

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{activeName}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <View style={styles.dashboard}>
          <View style={styles.summaryRow}>
            <SummaryItem label="Total Users" value={stats?.totalUsers || 0} icon="people" color={colors.primary} />
            <SummaryItem label="Total Patients" value={stats?.totalPatients || 0} icon="body" color={colors.info} />
          </View>
          <View style={styles.summaryRow}>
            <SummaryItem label="Active Cases" value={stats?.activeCases || 0} icon="pulse" color={colors.success} />
            <SummaryItem label="CHWs" value={stats?.chwCount || 0} icon="walk" color={colors.warning} />
          </View>
          <View style={styles.summaryRow}>
            <SummaryItem label="MHPs" value={stats?.mhpCount || 0} icon="git-network-outline" color={colors.primaryLight} />
            <SummaryItem label="Total Followups" value={stats?.totalFollowups || 0} icon="document-text-outline" color={colors.info} />
          </View>

          <Text style={styles.sectionTitle}>Management Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionCard title="User Management" icon="people-outline" color={colors.primaryDark} route="/users" />
            <ActionCard title="Assign Roles" icon="shield-checkmark-outline" color={colors.primary} route="/(admin)/features/assign-roles" />
            <ActionCard title="View Reports" icon="analytics-outline" color={colors.success} route="/reports" />
            <ActionCard title="System Logs" icon="server-outline" color={colors.primaryLight} route="/(admin)/features/system-logs" />
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}

function ActionCard({ title, icon, color, route }: { title: string; icon: keyof typeof Ionicons.glyphMap; color: string; route: string }) {
  const router = useRouter();
  const bgColor = color + '18';
  const borderColor = color + '40';

  return (
    <TouchableOpacity
      style={[styles.actionCard, { borderColor, borderWidth: 1 }]}
      onPress={() => router.push(route as any)}
      activeOpacity={0.8}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: bgColor }]}> 
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.actionTitle, { color: colors.primaryDark }]}>{title}</Text>
      <View style={[styles.actionChevron, { backgroundColor: colors.primaryTint }]}> 
        <Ionicons name="chevron-forward-outline" size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

function SummaryItem({ label, value, icon, color }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <Card variant="elevated" style={styles.summaryItem}>
      <View style={[styles.summaryIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  nameText: {
    ...typography.h2,
    color: colors.text,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.background,
  },
  dashboard: {
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.primaryTint,
    ...shadows.md,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    ...typography.captionBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  actionChevron: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.h3,
  },
});
