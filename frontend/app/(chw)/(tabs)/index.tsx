import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Text, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { translateNotifications, TranslatedNotification } from '@/lib/notificationTranslation';

const { width } = Dimensions.get('window');

// ── Action definitions ────────────────────────────────────────────────────────
const ACTIONS = (t: any) => [
  {
    title: t('dashboard.track_patient'),
    subtitle: 'Mark patients for cross-CHW tracking',
    icon: 'navigate' as const,
    grad: ['#0EA5E9', '#0284C7'] as [string, string],
    glow: '#0EA5E920',
    route: '/(chw)/features/track-patient',
    wide: false,
  },
  {
    title: t('dashboard.report'),
    subtitle: 'Submit regular or follow-up reports',
    icon: 'document-text' as const,
    grad: ['#10B981', '#059669'] as [string, string],
    glow: '#10B98120',
    route: '/(chw)/features/submit-report',
    wide: false,
  },
  {
    title: t('dashboard.view_tracked_patients'),
    subtitle: 'See all patients currently being tracked',
    icon: 'people-circle' as const,
    grad: ['#8B5CF6', '#7C3AED'] as [string, string],
    glow: '#8B5CF620',
    route: '/(chw)/features/view-tracked-patients',
    wide: true,
  },
  {
    title: t('dashboard.patient_list'),
    subtitle: 'Browse your assigned patients',
    icon: 'people' as const,
    grad: ['#F59E0B', '#D97706'] as [string, string],
    glow: '#F59E0B20',
    route: '/(chw)/(tabs)/patients',
    wide: false,
  },
];

export default function ChwDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const name = user?.fullName || user?.full_name || 'CHW';
  const firstName = name.split(' ')[0];
  const [showNotif, setShowNotif] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selNotif, setSelNotif] = useState<any>(null);

  const { data: stats } = useQuery({
    queryKey: ['stats', 'chw', user?.id],
    queryFn: () => api.dashboard('chw', user?.id),
    staleTime: 1000 * 30, enabled: !!user?.id,
  });
  const { data: rawAlerts = [], refetch: refetchNotif } = useQuery<any[]>({
    queryKey: ['recentAlerts', user?.id],
    queryFn: () => api.notifications(user?.id),
    staleTime: 1000 * 30, enabled: !!user?.id,
  });
  const alerts: TranslatedNotification[] = translateNotifications(rawAlerts, t);

  const clearAll = useMutation({
    mutationFn: () => api.clearAllNotifications(user?.id),
    onSuccess: () => { refetchNotif(); queryClient.invalidateQueries({ queryKey: ['recentAlerts', user?.id] }); },
  });
  const delNotif = useMutation({
    mutationFn: (id: number) => api.deleteNotification(id),
    onSuccess: () => { refetchNotif(); queryClient.invalidateQueries({ queryKey: ['recentAlerts', user?.id] }); },
  });

  const openNotif = async (a: any) => {
    if (a.type === 'PATIENT_FOUND') {
      try { setSelNotif(await api.notificationById(a.id)); } catch { setSelNotif(a); }
      setShowDetail(true);
    }
  };

  const actions = ACTIONS(t);
  // Split: first two side-by-side, third full-width, fourth standalone
  const topPair  = actions.slice(0, 2);
  const wideCard = actions[2];
  const lastCard = actions[3];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* ── Hero ── */}
        <LinearGradient colors={['#1E3A8A', '#1D4ED8', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.hero}>
          {/* Top bar */}
          <View style={S.heroTop}>
            <View style={S.heroLeft}>
              <Text style={S.heroGreet}>{greeting} 👋</Text>
              <Text style={S.heroName}>{name}</Text>
              <View style={S.roleBadge}>
                <View style={S.roleDot} />
                <Text style={S.roleText}>Community Health Worker</Text>
              </View>
            </View>
            <TouchableOpacity style={S.notifBtn} onPress={() => setShowNotif(true)}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {alerts.length > 0 && (
                <View style={S.badge}>
                  <Text style={S.badgeText}>{alerts.length > 9 ? '9+' : alerts.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={S.statsRow}>
            <StatCard
              icon="person-outline"
              label={t('dashboard.assigned')}
              value={stats?.totalPatients || 0}
              color="#60A5FA"
            />
            <StatCard
              icon="navigate-outline"
              label={t('dashboard.tracked_patients')}
              value={stats?.totalTrackedPatients || 0}
              color="#34D399"
            />
            <StatCard
              icon="calendar-outline"
              label="Appointments"
              value={stats?.totalAppointments || 0}
              color="#FBBF24"
            />
          </View>
        </LinearGradient>

        {/* ── Quick Actions ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>{t('dashboard.quick_actions')}</Text>
            <Text style={S.sectionSub}>What would you like to do?</Text>
          </View>

          {/* Top pair — side by side */}
          <View style={S.pairRow}>
            {topPair.map(a => (
              <TouchableOpacity
                key={a.title}
                style={S.halfCard}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={a.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.halfCardGrad}>
                  {/* Decorative circle */}
                  <View style={S.decorCircle} />
                  <View style={S.halfCardIcon}>
                    <Ionicons name={a.icon} size={28} color="#fff" />
                  </View>
                  <Text style={S.halfCardTitle}>{a.title}</Text>
                  <Text style={S.halfCardSub} numberOfLines={2}>{a.subtitle}</Text>
                  <View style={S.halfCardArrow}>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Wide card — full width */}
          <TouchableOpacity
            style={S.wideCard}
            onPress={() => router.push(wideCard.route as any)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={wideCard.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.wideCardGrad}>
              <View style={S.wideDecorCircle} />
              <View style={S.wideDecorCircle2} />
              <View style={S.wideLeft}>
                <View style={S.wideIconWrap}>
                  <Ionicons name={wideCard.icon} size={32} color="#fff" />
                </View>
                <View style={S.wideTextWrap}>
                  <Text style={S.wideTitle}>{wideCard.title}</Text>
                  <Text style={S.wideSub}>{wideCard.subtitle}</Text>
                </View>
              </View>
              <View style={S.wideArrow}>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Last card — full width, outlined style */}
          <TouchableOpacity
            style={S.outlineCard}
            onPress={() => router.push(lastCard.route as any)}
            activeOpacity={0.85}
          >
            <View style={[S.outlineIconWrap, { backgroundColor: lastCard.glow }]}>
              <LinearGradient colors={lastCard.grad} style={S.outlineIconGrad}>
                <Ionicons name={lastCard.icon} size={22} color="#fff" />
              </LinearGradient>
            </View>
            <View style={S.outlineText}>
              <Text style={S.outlineTitle}>{lastCard.title}</Text>
              <Text style={S.outlineSub}>{lastCard.subtitle}</Text>
            </View>
            <View style={[S.outlineArrowWrap, { backgroundColor: lastCard.glow }]}>
              <Ionicons name="arrow-forward" size={16} color={lastCard.grad[0]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Recent Activity ── */}
        <View style={S.section}>
          <View style={S.sectionRow}>
            <View>
              <Text style={S.sectionTitle}>{t('dashboard.recent_activity')}</Text>
              <Text style={S.sectionSub}>Latest notifications</Text>
            </View>
            {alerts.length > 0 && (
              <TouchableOpacity style={S.seeAllBtn} onPress={() => setShowNotif(true)}>
                <Text style={S.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>

          {alerts.length === 0 ? (
            <View style={S.emptyWrap}>
              <View style={S.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={S.emptyTitle}>{t('dashboard.no_notifications')}</Text>
              <Text style={S.emptyText}>You're all caught up!</Text>
            </View>
          ) : (
            alerts.slice(0, 4).map((a, idx) => (
              <TouchableOpacity key={a.id} style={S.actRow} onPress={() => openNotif(a)} activeOpacity={0.7}>
                <View style={S.actIconWrap}>
                  <Ionicons name="notifications" size={16} color="#3B82F6" />
                </View>
                <View style={S.actBody}>
                  <Text style={S.actTitle} numberOfLines={1}>{a.translatedTitle}</Text>
                  <Text style={S.actMsg} numberOfLines={1}>{a.translatedMessage}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>

      {/* ── Notifications sheet ── */}
      <Modal visible={showNotif} animationType="slide" transparent onRequestClose={() => setShowNotif(false)}>
        <View style={S.sheetOverlay}>
          <View style={S.sheet}>
            <View style={S.sheetHandle} />
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{t('dashboard.notifications')}</Text>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                {alerts.length > 0 && (
                  <TouchableOpacity onPress={() => clearAll.mutate()}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotif(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {alerts.length === 0 ? (
                <View style={S.emptyWrap}>
                  <Ionicons name="notifications-off-outline" size={48} color="#E2E8F0" />
                  <Text style={S.emptyText}>{t('dashboard.no_notifications')}</Text>
                </View>
              ) : alerts.map(a => (
                <View key={a.id} style={S.notifRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => { setShowNotif(false); openNotif(a); }}>
                    <View style={S.notifCard}>
                      <View style={S.notifIcon}>
                        <Ionicons name="notifications" size={16} color="#3B82F6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.notifTitle}>{a.translatedTitle}</Text>
                        <Text style={S.notifMsg} numberOfLines={2}>{a.translatedMessage}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => delNotif.mutate(a.id)} style={{ padding: 4 }}>
                    <Ionicons name="close-circle-outline" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Patient found detail ── */}
      <Modal visible={showDetail} transparent animationType="fade" onRequestClose={() => setShowDetail(false)}>
        <View style={S.overlay}>
          <View style={S.detailModal}>
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{t('notifications.patient_located_details')}</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <Text style={{ fontSize: 15, color: '#1E293B', lineHeight: 22 }}>{selNotif?.message}</Text>
              {selNotif?.user && (
                <>
                  <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="call-outline" size={16} color="#3B82F6" />
                    <Text style={{ fontSize: 14, color: '#1E293B' }}>{selNotif.user.phone || t('common.na')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="mail-outline" size={16} color="#3B82F6" />
                    <Text style={{ fontSize: 14, color: '#1E293B' }}>{selNotif.user.email || t('common.na')}</Text>
                  </View>
                </>
              )}
              <TouchableOpacity style={S.closeBtn} onPress={() => setShowDetail(false)}>
                <Text style={S.closeBtnText}>{t('notifications.close')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Container>
  );
}

// ── Stat card sub-component ───────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <View style={S.statCard}>
      <View style={[S.statIconWrap, { backgroundColor: color + '25' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={S.statVal}>{value}</Text>
      <Text style={S.statLbl}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD_GAP = 12;
const HALF_W = (width - 32 - CARD_GAP) / 2;

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  scroll: { paddingBottom: 100 },

  // ── Hero ──
  hero: { paddingTop: 8, paddingBottom: 28, paddingHorizontal: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heroLeft: { flex: 1 },
  heroGreet: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  roleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D399' },
  roleText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  badge: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 17, height: 17, borderRadius: 9,
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#1D4ED8',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18, padding: 16, gap: 0,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  statCard: { flex: 1, alignItems: 'center', gap: 5 },
  statIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 13 },

  // ── Section ──
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionHeader: { marginBottom: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  seeAllText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },

  // ── Quick action cards ──
  pairRow: { flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP },

  // Half card (gradient, square-ish)
  halfCard: {
    width: HALF_W, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  halfCardGrad: { padding: 18, minHeight: 160, justifyContent: 'space-between', overflow: 'hidden' },
  decorCircle: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -30, right: -30,
  },
  halfCardIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  halfCardTitle: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  halfCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 15, marginTop: 3 },
  halfCardArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'flex-end', marginTop: 8,
  },

  // Wide card (horizontal gradient, full width)
  wideCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: CARD_GAP,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  wideCardGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 22, overflow: 'hidden',
  },
  wideDecorCircle: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)', right: 40, top: -40,
  },
  wideDecorCircle2: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)', right: -20, bottom: -20,
  },
  wideLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  wideIconWrap: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  wideTextWrap: { flex: 1 },
  wideTitle: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  wideSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  wideArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Outline card (white bg, colored accent)
  outlineCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  outlineIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  outlineIconGrad: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  outlineText: { flex: 1 },
  outlineTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  outlineSub: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  outlineArrowWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // ── Activity ──
  actRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  actIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  actBody: { flex: 1 },
  actTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  actMsg: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  emptyText: { fontSize: 13, color: '#94A3B8' },

  // ── Modals ──
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  notifCard: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12 },
  notifIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  notifMsg: { fontSize: 12, color: '#64748B', marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  detailModal: { backgroundColor: '#fff', borderRadius: 24, maxHeight: '80%', overflow: 'hidden' },
  closeBtn: { backgroundColor: '#3B82F6', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  closeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
