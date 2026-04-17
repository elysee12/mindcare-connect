import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Text, Modal } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function MhpDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const activeName = user?.fullName || user?.full_name || 'User';
  const activeUserId = user?.id;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['stats', 'mhp', user?.id],
    queryFn: async () => api.dashboard('mhp', user?.id),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const { data: recentAlerts } = useQuery<{ id: number; title: string; message: string }[]>({
    queryKey: ['recentAlerts', user?.id],
    queryFn: async () => api.notifications(user?.id),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{activeName}</Text>
            <Text style={styles.roleText}>{user?.workplace || 'Mental Health Professional'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {recentAlerts && recentAlerts.length > 0 && (
              <View style={styles.notificationBadge} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dashboard}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.heroCard}
          >
            <Text style={styles.heroTitle}>Clinical Statistics</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{stats?.totalPatients || 0}</Text>
                <Text style={styles.heroStatLabel}>Patients</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{stats?.totalFollowups || 0}</Text>
                <Text style={styles.heroStatLabel}>Total Follow-ups</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{stats?.totalAppointments || 0}</Text>
                <Text style={styles.heroStatLabel}>Total Appointments</Text>
              </View>
            </View>
            <View style={styles.heroActions}>
              <View style={styles.heroActionButtonWrapper}>
                <Button 
                  title="View Cases" 
                  onPress={() => router.push('/(mhp)/(tabs)/patients')}
                  variant="primary"
                  size="small"
                />
              </View>
            </View>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionCard title="Patient Management" icon="people-outline" color={colors.primary} route="/(mhp)/(tabs)/patients" />
            <ActionCard title="Appointment Management" icon="calendar-outline" color={colors.primaryDark} route="/(mhp)/features/appointment-management" />
            <ActionCard title="Treatment Management" icon="medical-outline" color={colors.primaryLight} route="/(mhp)/features/treatment-management" />
            <TouchableOpacity 
              style={[styles.actionCard, { borderColor: colors.success + '40', borderWidth: 1 }]}
              onPress={() => setShowReportOptions(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.success + '18' }]}> 
                <Ionicons name="document-text-outline" size={28} color={colors.success} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.primaryDark }]}>View Reports</Text>
              <View style={[styles.actionChevron, { backgroundColor: colors.primaryTint }]}> 
                <Ionicons name="chevron-forward-outline" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentAlerts?.map((alert) => (
            <Card key={alert.id} style={styles.activityCard}>
              <View style={styles.activityContent}>
                <View style={[styles.activityIcon, { backgroundColor: colors.primaryTint }]}>
                  <Ionicons name="notifications" size={20} color={colors.primary} />
                </View>
                <View style={styles.activityText}>
                  <Text style={styles.activityTitle}>{alert.title}</Text>
                  <Text style={styles.activityMessage} numberOfLines={1}>{alert.message}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
              {recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <Card key={alert.id} style={styles.modalActivityCard}>
                    <View style={styles.activityContent}>
                      <View style={[styles.activityIcon, { backgroundColor: colors.primaryTint }]}>
                        <Ionicons name="notifications" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.activityText}>
                        <Text style={styles.activityTitle}>{alert.title}</Text>
                        <Text style={styles.activityMessage}>{alert.message}</Text>
                      </View>
                    </View>
                  </Card>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off-outline" size={48} color={colors.textTertiary} />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReportOptions}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowReportOptions(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.optionModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Report Type</Text>
              <TouchableOpacity onPress={() => setShowReportOptions(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionList}>
              <TouchableOpacity 
                style={styles.optionItem} 
                onPress={() => {
                  setShowReportOptions(false);
                  router.push('/(mhp)/features/view-reports?type=regular');
                }}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.primaryTint }]}>
                  <Ionicons name="document-text" size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.optionLabel}>Regular Report</Text>
                  <Text style={styles.optionDesc}>View CHW submissions</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionItem} 
                onPress={() => {
                  setShowReportOptions(false);
                  router.push('/(mhp)/features/view-reports?type=followup');
                }}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.successTint }]}>
                  <Ionicons name="calendar" size={24} color={colors.success} />
                </View>
                <View>
                  <Text style={styles.optionLabel}>Follow-up Report</Text>
                  <Text style={styles.optionDesc}>View patient follow-up history</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  roleText: {
    ...typography.captionBold,
    color: colors.primary,
    marginTop: -spacing.xs,
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
  heroCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xxl,
    ...shadows.md,
  },
  heroTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    ...typography.h1,
    color: colors.white,
  },
  heroStatLabel: {
    ...typography.tiny,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  heroStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  heroActionButtonWrapper: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
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
  activityCard: {
    marginBottom: spacing.xs,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  activityMessage: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    height: '80%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },
  modalList: {
    paddingBottom: spacing.xl,
  },
  modalActivityCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  optionModalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  optionList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  optionDesc: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
});
