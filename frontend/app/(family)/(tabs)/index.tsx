import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Modal } from 'react-native';
import { Container, Card } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { translateNotifications, TranslatedNotification } from '@/lib/notificationTranslation';

export default function FamilyDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const activeName = user?.fullName || user?.full_name || t('family.dashboard_title');
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['stats', 'family', user?.id],
    queryFn: async () => api.dashboard('family', user?.id),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const { data: rawUpdates } = useQuery({
    queryKey: ['recentUpdates', user?.id],
    queryFn: async () => api.notifications(user?.id),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const recentUpdates: TranslatedNotification[] = rawUpdates
    ? translateNotifications(rawUpdates, t)
    : [];

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
            {recentUpdates.some(n => !n.isRead) && (
              <View style={styles.notificationBadge} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dashboard}>
          <Card variant="elevated" style={{ ...styles.heroCard, backgroundColor: colors.primaryTint }}>
            <Text style={[styles.heroTitle, { color: colors.primaryDark }]}>{t('family.dashboard_title')}</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={[styles.heroStatValue, { color: colors.primary }]}>{stats?.totalPatients || 0}</Text>
                <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>{t('family.assigned')}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={[styles.heroStatValue, { color: colors.info }]}>{stats?.totalAppointments || 0}</Text>
                <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>{t('family.total_appointments')}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={[styles.heroStatValue, { color: colors.success }]}>{stats?.totalTreatments || 0}</Text>
                <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>{t('family.total_treatments')}</Text>
              </View>
            </View>
          </Card>

          <Text style={styles.sectionTitle}>{t('family.family_actions')}</Text>
          <View style={styles.actionsGrid}>
            <ActionCard title={t('family.appointment_records')} icon="calendar-outline" color={colors.primaryLight} route="/(family)/features/appointment-records" />
            <ActionCard title={t('family.view_treatment_changes')} icon="flask-outline" color={colors.successLight} route="/(family)/features/view-treatment-changes" />
          </View>

          <Text style={styles.sectionTitle}>{t('family.recent_updates')}</Text>
          {recentUpdates.slice(0, 3).map((update) => (
            <Card key={update.id} style={styles.updateCard}>
              <View style={styles.updateContent}>
                <View style={[styles.updateIcon, { backgroundColor: colors.primaryTint }]}>
                  <Ionicons name="notifications" size={20} color={colors.primary} />
                </View>
                <View style={styles.updateText}>
                  <Text style={styles.updateTitle}>{update.translatedTitle}</Text>
                  <Text style={styles.updateMessage} numberOfLines={1}>{update.translatedMessage}</Text>
                </View>
              </View>
            </Card>
          ))}
          {recentUpdates.length === 0 && (
            <Text style={styles.emptyText}>{t('family.no_updates')}</Text>
          )}
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
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
              {recentUpdates.length > 0 ? (
                recentUpdates.map((update) => (
                  <Card key={update.id} style={styles.modalUpdateCard}>
                    <View style={styles.updateContent}>
                      <View style={[styles.updateIcon, { backgroundColor: colors.primaryTint }]}>
                        <Ionicons name="notifications" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.updateText}>
                        <Text style={styles.updateTitle}>{update.translatedTitle}</Text>
                        <Text style={styles.updateMessage}>{update.translatedMessage}</Text>
                        <Text style={styles.updateDate}>{new Date(update.createdAt).toLocaleString()}</Text>
                      </View>
                    </View>
                  </Card>
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
  container: { backgroundColor: colors.backgroundSecondary, flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  welcomeText: { ...typography.caption, color: colors.textSecondary },
  nameText: { ...typography.h2, color: colors.text },
  notificationBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
  notificationBadge: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error, borderWidth: 2, borderColor: colors.background },
  dashboard: { gap: spacing.lg },
  heroCard: { padding: spacing.xl, borderRadius: borderRadius.xxl, ...shadows.md },
  heroTitle: { ...typography.h3, marginBottom: spacing.xl, textAlign: 'center' },
  heroStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatValue: { ...typography.h1 },
  heroStatLabel: { ...typography.tiny, textAlign: 'center' },
  heroStatDivider: { width: 1, height: 40, backgroundColor: colors.border },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionCard: { flex: 1, minWidth: 150, backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'space-between', ...shadows.md },
  actionIconContainer: { width: 56, height: 56, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  actionTitle: { ...typography.captionBold, textAlign: 'center', marginBottom: spacing.xs },
  actionChevron: { width: 28, height: 28, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  updateCard: { marginBottom: spacing.xs },
  updateContent: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  updateIcon: { width: 40, height: 40, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  updateText: { flex: 1 },
  updateTitle: { ...typography.bodyBold, color: colors.text },
  updateMessage: { ...typography.caption, color: colors.textSecondary },
  updateDate: { ...typography.tiny, color: colors.textTertiary, marginTop: 4 },
  emptyText: { ...typography.body, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.backgroundSecondary, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, height: '80%', padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.h2, color: colors.text },
  modalList: { paddingBottom: spacing.xl },
  modalUpdateCard: { marginBottom: spacing.sm, backgroundColor: colors.background },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxxl },
});
