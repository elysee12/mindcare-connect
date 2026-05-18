import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Text, Modal, Alert } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function MhpDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const activeName = user?.fullName || user?.full_name || 'User';
  const activeUserId = user?.id;
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['stats', 'mhp', user?.id],
    queryFn: async () => api.dashboard('mhp', user?.id),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const { data: recentAlerts, refetch: refetchNotifications } = useQuery<{ id: number; title: string; message: string; type?: string; createdAt: string }[]>({
    queryKey: ['recentAlerts', user?.id],
    queryFn: async () => api.notifications(user?.id),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.clearAllNotifications(user?.id),
    onSuccess: () => {
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['recentAlerts', user?.id] });
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => api.deleteNotification(id),
    onSuccess: () => {
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['recentAlerts', user?.id] });
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const handleClearAll = () => {
    Alert.alert(
      t('notifications.clear_all_title') || 'Clear All',
      t('notifications.clear_all_confirm') || 'Are you sure you want to clear all notifications?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => clearAllMutation.mutate() },
      ]
    );
  };

  const handleNotificationPress = async (alert: any) => {
    if (alert.type === 'PATIENT_FOUND') {
      try {
        const fullAlert = await api.notificationById(alert.id);
        setSelectedNotification(fullAlert);
        setShowDetailModal(true);
      } catch (error) {
        console.error('Failed to fetch notification details:', error);
        setSelectedNotification(alert);
        setShowDetailModal(true);
      }
    }
  };

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>{t('dashboard.welcome_back')}</Text>
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
            <Text style={styles.heroTitle}>{t('dashboard.clinical_statistics')}</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{stats?.totalPatients || 0}</Text>
                <Text style={styles.heroStatLabel}>{t('dashboard.patients')}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{stats?.totalFollowups || 0}</Text>
                <Text style={styles.heroStatLabel}>{t('dashboard.total_followups')}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{stats?.totalAppointments || 0}</Text>
                <Text style={styles.heroStatLabel}>{t('dashboard.total_appointments')}</Text>
              </View>
            </View>
            <View style={styles.heroActions}>
              <View style={styles.heroActionButtonWrapper}>
                <Button 
                  title={t('dashboard.view_cases')} 
                  onPress={() => router.push('/(mhp)/(tabs)/patients')}
                  variant="primary"
                  size="small"
                />
              </View>
            </View>
          </LinearGradient>

          <Text style={styles.sectionTitle}>{t('dashboard.quick_actions')}</Text>
          <View style={styles.actionsGrid}>
            <ActionCard title={t('dashboard.patient_management')} icon="people-outline" color={colors.primary} route="/(mhp)/(tabs)/patients" />
            <ActionCard title={t('dashboard.appointment_management')} icon="calendar-outline" color={colors.primaryDark} route="/(mhp)/features/appointment-management" />
            <ActionCard title={t('dashboard.treatment_management')} icon="medical-outline" color={colors.primaryLight} route="/(mhp)/features/treatment-management" />
            <TouchableOpacity 
              style={[styles.actionCard, { borderColor: colors.success + '40', borderWidth: 1 }]}
              onPress={() => setShowReportOptions(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.success + '18' }]}> 
                <Ionicons name="document-text-outline" size={28} color={colors.success} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.primaryDark }]}>{t('dashboard.view_reports')}</Text>
              <View style={[styles.actionChevron, { backgroundColor: colors.primaryTint }]}> 
                <Ionicons name="chevron-forward-outline" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>{t('dashboard.recent_activity')}</Text>
          {recentAlerts?.map((alert) => (
            <TouchableOpacity 
              key={alert.id} 
              onPress={() => handleNotificationPress(alert)}
              activeOpacity={0.7}
            >
              <Card style={styles.activityCard}>
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
            </TouchableOpacity>
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
              <Text style={styles.modalTitle}>{t('dashboard.notifications')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                {recentAlerts && recentAlerts.length > 0 && (
                  <TouchableOpacity onPress={handleClearAll}>
                    <Ionicons name="trash-outline" size={22} color={colors.error} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
              {recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <View key={alert.id} style={styles.notificationWrapper}>
                    <TouchableOpacity 
                      style={{ flex: 1 }}
                      onPress={() => {
                        setShowNotifications(false);
                        handleNotificationPress(alert);
                      }}
                    >
                      <Card style={styles.modalActivityCard}>
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
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.dismissBtn} 
                      onPress={() => deleteNotificationMutation.mutate(alert.id)}
                    >
                      <Ionicons name="close-circle-outline" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off-outline" size={48} color={colors.textTertiary} />
                  <Text style={styles.emptyText}>{t('dashboard.no_notifications')}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDetailModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 'auto', maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Located Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailMessage}>{selectedNotification?.message}</Text>
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <View>
                  <Text style={styles.detailLabel}>Time Found</Text>
                  <Text style={styles.detailValue}>
                    {selectedNotification?.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : 'N/A'}
                  </Text>
                </View>
              </View>

              {selectedNotification?.user && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.finderHeader}>Finder Contact Information</Text>
                  
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={18} color={colors.primary} />
                    <Text style={styles.contactText}>{selectedNotification.user.phone || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={18} color={colors.primary} />
                    <Text style={styles.contactText}>{selectedNotification.user.email || 'N/A'}</Text>
                  </View>

                  <View style={styles.divider} />
                  <Text style={styles.finderHeader}>Finder Home Address</Text>
                  <View style={styles.addressBox}>
                    <Ionicons name="home-outline" size={18} color={colors.primary} />
                    <Text style={styles.addressText}>
                      {[
                        selectedNotification.user.province,
                        selectedNotification.user.district,
                        selectedNotification.user.sector,
                        selectedNotification.user.cell,
                        selectedNotification.user.village
                      ].filter(Boolean).join(', ') || 'Address not available'}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.buttonContainer}>
                <Button 
                  variant="primary" 
                  fullWidth 
                  onPress={() => setShowDetailModal(false)}
                >
                  Close
                </Button>
              </View>
            </View>
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
              <Text style={styles.modalTitle}>{t('dashboard.select_report_type')}</Text>
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
                  <Text style={styles.optionLabel}>{t('dashboard.regular_report')}</Text>
                  <Text style={styles.optionDesc}>{t('dashboard.view_chw_submissions')}</Text>
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
                  <Text style={styles.optionLabel}>{t('dashboard.followup_report')}</Text>
                  <Text style={styles.optionDesc}>{t('dashboard.view_followup_history')}</Text>
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
    flex: 1,
  },
  notificationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dismissBtn: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center', 
  },
  detailBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailMessage: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailLabel: {
    ...typography.tinyBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
  },
  finderHeader: {
    ...typography.tinyBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  contactText: {
    ...typography.body,
    color: colors.text,
  },
  addressBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addressText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: spacing.md,
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
