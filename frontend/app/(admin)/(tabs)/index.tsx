import React, { useState } from 'react';
import {
  View, StyleSheet, Text, ScrollView, TouchableOpacity,
  Dimensions, Modal, Alert,
} from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { translateNotifications, TranslatedNotification } from '@/lib/notificationTranslation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const activeName = user?.fullName || user?.full_name || 'Admin';

  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['stats', 'admin'],
    queryFn: () => api.dashboard('admin'),
    staleTime: 1000 * 30,
  });

  const { data: rawAlerts, refetch: refetchNotifications } = useQuery<any[]>({
    queryKey: ['recentAlerts', user?.id],
    queryFn: () => api.notifications(user?.id),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const recentAlerts: TranslatedNotification[] = rawAlerts
    ? translateNotifications(rawAlerts, t)
    : [];

  const unreadCount = recentAlerts.filter(a => !a.isRead).length;

  const clearAllMutation = useMutation({
    mutationFn: () => api.clearAllNotifications(user?.id),
    onSuccess: () => {
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['recentAlerts', user?.id] });
    },
    onError: (error: any) => Alert.alert(t('common.error'), error.message),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => api.deleteNotification(id),
    onSuccess: () => {
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['recentAlerts', user?.id] });
    },
    onError: (error: any) => Alert.alert(t('common.error'), error.message),
  });

  const handleClearAll = () => {
    Alert.alert(
      t('notifications.clear_all_title'),
      t('notifications.clear_all_confirm'),
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
      } catch {
        setSelectedNotification(alert);
        setShowDetailModal(true);
      }
    }
  };

  // ── Stat data ──────────────────────────────────────────────────────────────
  const statItems = [
    { label: t('dashboard.total_users'),    value: stats?.totalUsers    ?? 0, icon: 'people',               color: colors.primary },
    { label: t('dashboard.total_patients'), value: stats?.totalPatients ?? 0, icon: 'body',                 color: '#6366F1' },
    { label: t('dashboard.active_cases'),   value: stats?.activeCases   ?? 0, icon: 'pulse',                color: colors.success },
    { label: t('dashboard.chws'),           value: stats?.chwCount      ?? 0, icon: 'walk',                 color: colors.warning },
    { label: t('dashboard.mhps'),           value: stats?.mhpCount      ?? 0, icon: 'medkit-outline',       color: '#EC4899' },
    { label: t('dashboard.total_followups_summary'), value: stats?.totalFollowups ?? 0, icon: 'document-text-outline', color: '#14B8A6' },
  ];

  // ── Action data ────────────────────────────────────────────────────────────
  const actions = [
    { title: t('dashboard.user_management'), icon: 'people-outline',           color: colors.primary,     route: '/users' },
    { title: t('dashboard.assign_roles'),    icon: 'shield-checkmark-outline', color: '#6366F1',          route: '/(admin)/features/assign-roles' },
    { title: t('dashboard.view_reports'),    icon: 'analytics-outline',        color: colors.success,     route: '/reports' },
    { title: t('dashboard.system_logs'),     icon: 'server-outline',           color: colors.warning,     route: '/(admin)/features/system-logs' },
  ];

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>{t('dashboard.welcome_back')}</Text>
            <Text style={styles.nameText}>{activeName}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => setShowNotifications(true)}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Hero gradient banner ── */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>{t('dashboard.total_patients')}</Text>
            <Text style={styles.heroValue}>{stats?.totalPatients ?? 0}</Text>
            <Text style={styles.heroSub}>{t('dashboard.active_cases')}: {stats?.activeCases ?? 0}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroRight}>
            <View style={styles.heroStatRow}>
              <Ionicons name="people" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{stats?.totalUsers ?? 0} {t('dashboard.total_users')}</Text>
            </View>
            <View style={styles.heroStatRow}>
              <Ionicons name="walk" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{stats?.chwCount ?? 0} {t('dashboard.chws')}</Text>
            </View>
            <View style={styles.heroStatRow}>
              <Ionicons name="medkit-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{stats?.mhpCount ?? 0} {t('dashboard.mhps')}</Text>
            </View>
            <View style={styles.heroStatRow}>
              <Ionicons name="document-text-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{stats?.totalFollowups ?? 0} {t('dashboard.total_followups_summary')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Stat grid (3 columns) ── */}
        <View style={styles.statGrid}>
          {statItems.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel} numberOfLines={2}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Management actions ── */}
        <Text style={styles.sectionTitle}>{t('dashboard.management_actions')}</Text>
        <View style={styles.actionsGrid}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.title}
              style={[styles.actionCard, { borderColor: a.color + '30' }]}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: a.color + '15' }]}>
                <Ionicons name={a.icon as any} size={26} color={a.color} />
              </View>
              <Text style={styles.actionTitle} numberOfLines={2}>{a.title}</Text>
              <View style={[styles.actionArrow, { backgroundColor: a.color + '15' }]}>
                <Ionicons name="arrow-forward" size={14} color={a.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent activity ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.recent_activity')}</Text>
          {recentAlerts.length > 0 && (
            <TouchableOpacity onPress={() => setShowNotifications(true)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentAlerts.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.border} />
            <Text style={styles.emptyActivityText}>{t('dashboard.no_notifications')}</Text>
          </View>
        ) : (
          recentAlerts.slice(0, 5).map((alert) => (
            <TouchableOpacity
              key={alert.id}
              onPress={() => handleNotificationPress(alert)}
              activeOpacity={0.7}
            >
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="notifications" size={16} color={colors.primary} />
                </View>
                <View style={styles.activityBody}>
                  <Text style={styles.activityTitle} numberOfLines={1}>{alert.translatedTitle}</Text>
                  <Text style={styles.activityMsg} numberOfLines={1}>{alert.translatedMessage}</Text>
                </View>
                <Text style={styles.activityTime}>
                  {new Date(alert.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>

      {/* ── Notifications modal ── */}
      <Modal visible={showNotifications} animationType="slide" transparent onRequestClose={() => setShowNotifications(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('dashboard.notifications')}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                {recentAlerts.length > 0 && (
                  <TouchableOpacity onPress={handleClearAll}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxxl }}>
              {recentAlerts.length > 0 ? recentAlerts.map((alert) => (
                <View key={alert.id} style={styles.notifRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => { setShowNotifications(false); handleNotificationPress(alert); }}>
                    <View style={styles.notifCard}>
                      <View style={[styles.notifIcon, { backgroundColor: colors.primaryTint }]}>
                        <Ionicons name="notifications" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notifTitle}>{alert.translatedTitle}</Text>
                        <Text style={styles.notifMsg} numberOfLines={2}>{alert.translatedMessage}</Text>
                        <Text style={styles.notifTime}>{new Date(alert.createdAt).toLocaleString()}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteNotificationMutation.mutate(alert.id)} style={styles.dismissBtn}>
                    <Ionicons name="close-circle-outline" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              )) : (
                <View style={styles.emptyNotif}>
                  <Ionicons name="notifications-off-outline" size={48} color={colors.border} />
                  <Text style={styles.emptyNotifText}>{t('dashboard.no_notifications')}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Patient found detail modal ── */}
      <Modal visible={showDetailModal} animationType="fade" transparent onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('notifications.patient_located_details')}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <Text style={styles.detailMessage}>{selectedNotification?.message}</Text>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
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
                    <Ionicons name="call-outline" size={16} color={colors.primary} />
                    <Text style={styles.contactText}>{selectedNotification.user.phone || t('common.na')}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={16} color={colors.primary} />
                    <Text style={styles.contactText}>{selectedNotification.user.email || t('common.na')}</Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.finderHeader}>{t('notifications.finder_address')}</Text>
                  <View style={styles.addressBox}>
                    <Ionicons name="home-outline" size={16} color={colors.primary} />
                    <Text style={styles.addressText}>
                      {[selectedNotification.user.province, selectedNotification.user.district,
                        selectedNotification.user.sector, selectedNotification.user.cell,
                        selectedNotification.user.village].filter(Boolean).join(', ') || t('notifications.address_not_available')}
                    </Text>
                  </View>
                </>
              )}
              <Button variant="primary" fullWidth onPress={() => setShowDetailModal(false)}>
                {t('notifications.close')}
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { paddingBottom: spacing.xxxxl },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  welcomeText: { ...typography.caption, color: colors.textSecondary },
  nameText: { ...typography.h2, color: colors.text },
  notifBtn: {
    width: 44, height: 44, borderRadius: borderRadius.lg,
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
    ...shadows.sm,
  },
  badge: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.background,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },

  // Hero banner
  heroBanner: {
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    borderRadius: borderRadius.xxl, padding: spacing.xl,
    flexDirection: 'row', alignItems: 'center',
    ...shadows.md,
  },
  heroLeft: { flex: 1 },
  heroLabel: { ...typography.captionBold, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  heroValue: { fontSize: 48, fontWeight: '800', color: colors.white, lineHeight: 52 },
  heroSub: { ...typography.caption, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  heroDivider: { width: 1, height: 80, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: spacing.xl },
  heroRight: { flex: 1, gap: spacing.sm },
  heroStatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  heroStatText: { ...typography.captionBold, color: 'rgba(255,255,255,0.9)', flex: 1 },

  // Stat grid — 3 columns
  statGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.lg, gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.sm * 2) / 3,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: borderRadius.lg,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs,
  },
  statValue: { ...typography.h3, fontWeight: '800' },
  statLabel: {
    ...typography.tiny, color: colors.textSecondary,
    textAlign: 'center', marginTop: 2, lineHeight: 14,
  },

  // Section titles
  sectionTitle: { ...typography.h3, color: colors.text, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: spacing.lg },
  seeAll: { ...typography.captionBold, color: colors.primary },

  // Action cards — 2×2 grid
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.lg, gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    ...shadows.sm,
    gap: spacing.xs,
  },
  actionIconWrap: {
    width: 48, height: 48, borderRadius: borderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionTitle: { ...typography.bodyBold, color: colors.text, lineHeight: 20 },
  actionArrow: {
    width: 28, height: 28, borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'flex-start', marginTop: spacing.xs,
  },

  // Activity feed
  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.background, borderRadius: borderRadius.xl,
    padding: spacing.md, gap: spacing.md, ...shadows.sm,
  },
  activityDot: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  activityBody: { flex: 1 },
  activityTitle: { ...typography.bodyBold, color: colors.text },
  activityMsg: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  activityTime: { ...typography.tiny, color: colors.textTertiary },
  emptyActivity: {
    alignItems: 'center', paddingVertical: spacing.xxl,
    marginHorizontal: spacing.lg, gap: spacing.sm,
  },
  emptyActivityText: { ...typography.caption, color: colors.textTertiary },

  // Notifications modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl,
    height: '80%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { ...typography.h3, color: colors.text },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  notifCard: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl,
    padding: spacing.md, gap: spacing.md,
  },
  notifIcon: {
    width: 36, height: 36, borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  notifTitle: { ...typography.bodyBold, color: colors.text },
  notifMsg: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  notifTime: { ...typography.tiny, color: colors.textTertiary, marginTop: 4 },
  dismissBtn: { padding: spacing.xs },
  emptyNotif: { alignItems: 'center', paddingVertical: spacing.xxxxl, gap: spacing.md },
  emptyNotifText: { ...typography.body, color: colors.textTertiary },

  // Detail modal
  detailModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl,
    maxHeight: '80%',
  },
  detailMessage: { ...typography.body, color: colors.text, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.border },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailLabel: { ...typography.tinyBold, color: colors.textSecondary, textTransform: 'uppercase' },
  detailValue: { ...typography.body, color: colors.text },
  finderHeader: { ...typography.tinyBold, color: colors.textSecondary, textTransform: 'uppercase' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contactText: { ...typography.body, color: colors.text },
  addressBox: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary, padding: spacing.sm, borderRadius: borderRadius.md,
  },
  addressText: { ...typography.caption, color: colors.text, flex: 1, lineHeight: 18 },
  buttonContainer: { marginTop: spacing.md },
});
