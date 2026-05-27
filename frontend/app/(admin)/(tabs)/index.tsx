import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { translateNotifications, TranslatedNotification } from '@/lib/notificationTranslation';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const activeName = user?.full_name || 'Admin';
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['stats', 'admin'],
    queryFn: async () => api.dashboard('admin'),
    staleTime: 1000 * 30,
  });

  const { data: rawAlerts, refetch: refetchNotifications } = useQuery<any[]>({
    queryKey: ['recentAlerts', user?.id],
    queryFn: async () => api.notifications(user?.id),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const recentAlerts: TranslatedNotification[] = rawAlerts
    ? translateNotifications(rawAlerts, t)
    : [];

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
          <View style={styles.summaryRow}>
            <SummaryItem label={t('dashboard.total_users')} value={stats?.totalUsers || 0} icon="people" color={colors.primary} />
            <SummaryItem label={t('dashboard.total_patients')} value={stats?.totalPatients || 0} icon="body" color={colors.info} />
          </View>
          <View style={styles.summaryRow}>
            <SummaryItem label={t('dashboard.active_cases')} value={stats?.activeCases || 0} icon="pulse" color={colors.success} />
            <SummaryItem label={t('dashboard.chws')} value={stats?.chwCount || 0} icon="walk" color={colors.warning} />
          </View>
          <View style={styles.summaryRow}>
            <SummaryItem label={t('dashboard.mhps')} value={stats?.mhpCount || 0} icon="git-network-outline" color={colors.primaryLight} />
            <SummaryItem label={t('dashboard.total_followups_summary')} value={stats?.totalFollowups || 0} icon="document-text-outline" color={colors.info} />
          </View>

          <Text style={styles.sectionTitle}>{t('dashboard.management_actions')}</Text>
          <View style={styles.actionsGrid}>
            <ActionCard title={t('dashboard.user_management')} icon="people-outline" color={colors.primaryDark} route="/users" />
            <ActionCard title={t('dashboard.assign_roles')} icon="shield-checkmark-outline" color={colors.primary} route="/(admin)/features/assign-roles" />
            <ActionCard title={t('dashboard.view_reports')} icon="analytics-outline" color={colors.success} route="/reports" />
            <ActionCard title={t('dashboard.system_logs')} icon="server-outline" color={colors.primaryLight} route="/(admin)/features/system-logs" />
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
                    <Text style={styles.activityTitle}>{alert.translatedTitle}</Text>
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
                            <Text style={styles.activityTitle}>{alert.translatedTitle}</Text>
                            <Text style={styles.activityMessage}>{alert.translatedMessage}</Text>
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
              <Text style={styles.modalTitle}>{t('notifications.patient_located_details')}</Text>
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
                  <Text style={styles.detailLabel}>{t('notifications.time_found')}</Text>
                  <Text style={styles.detailValue}>
                    {selectedNotification?.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : t('common.na')}
                  </Text>
                </View>
              </View>

              {selectedNotification?.user && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.finderHeader}>{t('notifications.finder_contact')}</Text>
                  
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={18} color={colors.primary} />
                    <Text style={styles.contactText}>{selectedNotification.user.phone || t('common.na')}</Text>
                  </View>
                  
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={18} color={colors.primary} />
                    <Text style={styles.contactText}>{selectedNotification.user.email || t('common.na')}</Text>
                  </View>

                  <View style={styles.divider} />
                  <Text style={styles.finderHeader}>{t('notifications.finder_address')}</Text>
                  <View style={styles.addressBox}>
                    <Ionicons name="home-outline" size={18} color={colors.primary} />
                    <Text style={styles.addressText}>
                      {[
                        selectedNotification.user.province,
                        selectedNotification.user.district,
                        selectedNotification.user.sector,
                        selectedNotification.user.cell,
                        selectedNotification.user.village
                      ].filter(Boolean).join(', ') || t('notifications.address_not_available')}
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
                  {t('notifications.close')}
                </Button>
              </View>
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
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  dashboard: { padding: spacing.lg, gap: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  summaryItem: { flex: 1, padding: spacing.md, borderRadius: borderRadius.xl, backgroundColor: colors.background, ...shadows.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryIcon: { width: 44, height: 44, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { ...typography.tinyBold, color: colors.textSecondary, textTransform: 'uppercase' },
  summaryValue: { ...typography.h3, color: colors.text },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: -spacing.xs },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionCard: { width: (width - spacing.lg * 2 - spacing.md) / 2, padding: spacing.md, borderRadius: borderRadius.xl, backgroundColor: colors.background, ...shadows.sm, gap: spacing.sm },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: { ...typography.bodyBold, color: colors.text },
  actionChevron: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    justifyContent: 'center',    alignItems: 'center',
  },
  activityCard: { marginBottom: spacing.sm, padding: spacing.md, backgroundColor: colors.background },
  activityContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  activityIcon: { width: 40, height: 40, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  activityText: { flex: 1 },
  activityTitle: { ...typography.bodyBold, color: colors.text },
  activityMessage: { ...typography.caption, color: colors.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.h3, color: colors.text },
  modalList: { padding: spacing.lg },
  modalActivityCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    flex: 1,
  },
  notificationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',    gap: spacing.xs,
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
    textTransform: 'uppercase',  },
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
    padding: spacing.xxxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});
