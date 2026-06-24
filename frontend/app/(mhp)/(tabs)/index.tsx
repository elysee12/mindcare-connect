import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Text, Modal } from 'react-native';
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

export default function MhpDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const name = user?.fullName || user?.full_name || 'Doctor';
  const [showNotif, setShowNotif]     = useState(false);
  const [showDetail, setShowDetail]   = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [selNotif, setSelNotif]       = useState<any>(null);

  const { data: stats } = useQuery({
    queryKey: ['stats', 'mhp', user?.id],
    queryFn: () => api.dashboard('mhp', user?.id),
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

  const actions = [
    { title: t('dashboard.patient_management'),     subtitle: 'Manage your assigned patients',    icon: 'people' as const,        grad: ['#10B981', '#059669'] as [string,string], glow: '#10B98120', route: '/(mhp)/(tabs)/patients' },
    { title: t('dashboard.appointment_management'), subtitle: 'Schedule & track appointments',    icon: 'calendar' as const,      grad: ['#0EA5E9', '#0284C7'] as [string,string], glow: '#0EA5E920', route: '/(mhp)/features/appointment-management' },
    { title: t('dashboard.treatment_management'),   subtitle: 'Record treatment changes',         icon: 'medical' as const,       grad: ['#8B5CF6', '#7C3AED'] as [string,string], glow: '#8B5CF620', route: '/(mhp)/features/treatment-management' },
    { title: 'Training Content',                    subtitle: 'Access learning materials',       icon: 'school' as const,        grad: ['#7C3AED', '#6D28D9'] as [string,string], glow: '#7C3AED20', route: '/(shared)/lessons' },
    { title: t('dashboard.view_reports'),           subtitle: 'View CHW & follow-up reports',    icon: 'document-text' as const, grad: ['#F59E0B', '#D97706'] as [string,string], glow: '#F59E0B20', route: null },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* ── Hero ── */}
        <LinearGradient colors={['#064E3B', '#065F46', '#2EB67D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.hero}>
          <View style={S.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={S.heroGreet}>{greeting} 👋</Text>
              <Text style={S.heroName}>{name}</Text>
              <View style={S.roleBadge}>
                <View style={S.roleDot} />
                <Text style={S.roleText}>{user?.workplace || 'Mental Health Professional'}</Text>
              </View>
            </View>
            <TouchableOpacity style={S.notifBtn} onPress={() => setShowNotif(true)}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {alerts.length > 0 && (
                <View style={S.badge}><Text style={S.badgeText}>{alerts.length > 9 ? '9+' : alerts.length}</Text></View>
              )}
            </TouchableOpacity>
          </View>
          <View style={S.statsRow}>
            <StatCard icon="people-outline"   label={t('dashboard.patients')}           value={stats?.totalPatients || 0}     color="#6EE7B7" />
            <StatCard icon="document-text-outline" label={t('dashboard.total_followups')} value={stats?.totalFollowups || 0}  color="#93C5FD" />
            <StatCard icon="calendar-outline" label={t('dashboard.total_appointments')} value={stats?.totalAppointments || 0} color="#FCD34D" />
          </View>
        </LinearGradient>

        {/* ── Quick Actions ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>{t('dashboard.quick_actions')}</Text>
            <Text style={S.sectionSub}>What would you like to do?</Text>
          </View>
          {/* Top pair */}
          <View style={S.pairRow}>
            {actions.slice(0, 2).map(a => (
              <TouchableOpacity key={a.title} style={S.halfCard}
                onPress={() => a.route ? router.push(a.route as any) : setShowReports(true)} activeOpacity={0.85}>
                <LinearGradient colors={a.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.halfCardGrad}>
                  <View style={S.decorCircle} />
                  <View style={S.halfCardIcon}><Ionicons name={a.icon} size={28} color="#fff" /></View>
                  <Text style={S.halfCardTitle}>{a.title}</Text>
                  <Text style={S.halfCardSub} numberOfLines={2}>{a.subtitle}</Text>
                  <View style={S.halfCardArrow}><Ionicons name="arrow-forward" size={14} color="#fff" /></View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
          {/* Wide card */}
          <TouchableOpacity style={S.wideCard} onPress={() => router.push(actions[2].route as any)} activeOpacity={0.85}>
            <LinearGradient colors={actions[2].grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.wideCardGrad}>
              <View style={S.wideDecorCircle} /><View style={S.wideDecorCircle2} />
              <View style={S.wideLeft}>
                <View style={S.wideIconWrap}><Ionicons name={actions[2].icon} size={32} color="#fff" /></View>
                <View style={S.wideTextWrap}>
                  <Text style={S.wideTitle}>{actions[2].title}</Text>
                  <Text style={S.wideSub}>{actions[2].subtitle}</Text>
                </View>
              </View>
              <View style={S.wideArrow}><Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" /></View>
            </LinearGradient>
          </TouchableOpacity>
          {/* Outline card - Training Content */}
          <TouchableOpacity style={S.outlineCard} onPress={() => router.push(actions[3].route as any)} activeOpacity={0.85}>
            <View style={[S.outlineIconWrap, { backgroundColor: actions[3].glow }]}>
              <LinearGradient colors={actions[3].grad} style={S.outlineIconGrad}>
                <Ionicons name={actions[3].icon} size={22} color="#fff" />
              </LinearGradient>
            </View>
            <View style={S.outlineText}>
              <Text style={S.outlineTitle}>{actions[3].title}</Text>
              <Text style={S.outlineSub}>{actions[3].subtitle}</Text>
            </View>
            <View style={[S.outlineArrowWrap, { backgroundColor: actions[3].glow }]}>
              <Ionicons name="arrow-forward" size={16} color={actions[3].grad[0]} />
            </View>
          </TouchableOpacity>
          {/* Outline card - View Reports */}
          <TouchableOpacity style={S.outlineCard} onPress={() => setShowReports(true)} activeOpacity={0.85}>
            <View style={[S.outlineIconWrap, { backgroundColor: actions[4].glow }]}>
              <LinearGradient colors={actions[4].grad} style={S.outlineIconGrad}>
                <Ionicons name={actions[4].icon} size={22} color="#fff" />
              </LinearGradient>
            </View>
            <View style={S.outlineText}>
              <Text style={S.outlineTitle}>{actions[4].title}</Text>
              <Text style={S.outlineSub}>{actions[4].subtitle}</Text>
            </View>
            <View style={[S.outlineArrowWrap, { backgroundColor: actions[4].glow }]}>
              <Ionicons name="arrow-forward" size={16} color={actions[4].grad[0]} />
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
                <Ionicons name="chevron-forward" size={14} color="#2EB67D" />
              </TouchableOpacity>
            )}
          </View>
          {alerts.length === 0 ? (
            <View style={S.emptyWrap}>
              <View style={S.emptyIconWrap}><Ionicons name="notifications-off-outline" size={32} color="#94A3B8" /></View>
              <Text style={S.emptyTitle}>{t('dashboard.no_notifications')}</Text>
              <Text style={S.emptyText}>You're all caught up!</Text>
            </View>
          ) : (
            alerts.slice(0, 4).map(a => (
              <TouchableOpacity key={a.id} style={S.actRow} onPress={() => openNotif(a)} activeOpacity={0.7}>
                <View style={S.actIconWrap}><Ionicons name="notifications" size={16} color="#2EB67D" /></View>
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
                {alerts.length > 0 && <TouchableOpacity onPress={() => clearAll.mutate()}><Ionicons name="trash-outline" size={20} color="#EF4444" /></TouchableOpacity>}
                <TouchableOpacity onPress={() => setShowNotif(false)}><Ionicons name="close" size={22} color="#64748B" /></TouchableOpacity>
              </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {alerts.length === 0 ? (
                <View style={S.emptyWrap}><Ionicons name="notifications-off-outline" size={48} color="#E2E8F0" /><Text style={S.emptyText}>{t('dashboard.no_notifications')}</Text></View>
              ) : alerts.map(a => (
                <View key={a.id} style={S.notifRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => { setShowNotif(false); openNotif(a); }}>
                    <View style={S.notifCard}>
                      <View style={S.notifIcon}><Ionicons name="notifications" size={16} color="#2EB67D" /></View>
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
              <TouchableOpacity onPress={() => setShowDetail(false)}><Ionicons name="close" size={22} color="#64748B" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <Text style={{ fontSize: 15, color: '#1E293B', lineHeight: 22 }}>{selNotif?.message}</Text>
              <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="time-outline" size={18} color="#2EB67D" />
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>{t('notifications.time_found')}</Text>
                  <Text style={{ fontSize: 14, color: '#1E293B' }}>{selNotif?.createdAt ? new Date(selNotif.createdAt).toLocaleString() : t('common.na')}</Text>
                </View>
              </View>
              {selNotif?.finder && (
                <>
                  <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="call-outline" size={16} color="#2EB67D" /><Text style={{ fontSize: 14, color: '#1E293B' }}>{selNotif.finder.phone || t('common.na')}</Text></View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="mail-outline" size={16} color="#2EB67D" /><Text style={{ fontSize: 14, color: '#1E293B' }}>{selNotif.finder.email || t('common.na')}</Text></View>
                </>
              )}
              <TouchableOpacity style={S.closeBtn} onPress={() => setShowDetail(false)}>
                <Text style={S.closeBtnText}>{t('notifications.close')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Report type picker ── */}
      <Modal visible={showReports} transparent animationType="fade" onRequestClose={() => setShowReports(false)}>
        <View style={S.overlay}>
          <View style={S.picker}>
            <View style={S.pickerHeader}>
              <Text style={S.pickerTitle}>{t('dashboard.select_report_type')}</Text>
              <TouchableOpacity onPress={() => setShowReports(false)}><Ionicons name="close" size={22} color="#64748B" /></TouchableOpacity>
            </View>
            {[
              { label: t('dashboard.regular_report'),  desc: t('dashboard.view_chw_submissions'),  icon: 'document-text' as const, color: '#2EB67D', type: 'regular' },
              { label: t('dashboard.followup_report'), desc: t('dashboard.view_followup_history'), icon: 'calendar' as const,       color: '#3B82F6', type: 'followup' },
            ].map(opt => (
              <TouchableOpacity key={opt.type} style={S.pickerOpt}
                onPress={() => { setShowReports(false); router.push(`/(mhp)/features/view-reports?type=${opt.type}` as any); }}>
                <View style={[S.pickerIcon, { backgroundColor: opt.color + '18' }]}>
                  <Ionicons name={opt.icon} size={22} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.pickerLabel}>{opt.label}</Text>
                  <Text style={S.pickerDesc}>{opt.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </Container>
  );
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <View style={S.statCard}>
      <View style={[S.statIconWrap, { backgroundColor: color + '25' }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={S.statVal}>{value}</Text>
      <Text style={S.statLbl}>{label}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  scroll: { paddingBottom: 100 },

  // Hero
  hero: { paddingTop: 8, paddingBottom: 28, paddingHorizontal: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heroGreet: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  roleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6EE7B7' },
  roleText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  badge: { position: 'absolute', top: 6, right: 6, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#064E3B' },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  statCard: { flex: 1, alignItems: 'center', gap: 5 },
  statIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 13 },

  // Section
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionHeader: { marginBottom: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  seeAllText: { fontSize: 12, fontWeight: '700', color: '#2EB67D' },

  // Premium action cards
  pairRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  halfCard: { width: (width - 32 - 12) / 2, borderRadius: 20, overflow: 'hidden', shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  halfCardGrad: { padding: 18, minHeight: 165, justifyContent: 'space-between', overflow: 'hidden' },
  decorCircle: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.08)', top: -35, right: -35 },
  halfCardIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  halfCardTitle: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  halfCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 15, marginTop: 3 },
  halfCardArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end', marginTop: 8 },
  wideCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 12, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16, elevation: 6 },
  wideCardGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 22, overflow: 'hidden' },
  wideDecorCircle: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.07)', right: 30, top: -50 },
  wideDecorCircle2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', right: -20, bottom: -20 },
  wideLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  wideIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  wideTextWrap: { flex: 1 },
  wideTitle: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  wideSub: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 3 },
  wideArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  outlineCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  outlineIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  outlineIconGrad: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  outlineText: { flex: 1 },
  outlineTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  outlineSub: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  outlineArrowWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Activity
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  actIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  actBody: { flex: 1 },
  actTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  actMsg: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  emptyText: { fontSize: 13, color: '#94A3B8' },

  // Modals
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  notifCard: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12 },
  notifIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  notifMsg: { fontSize: 12, color: '#64748B', marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  picker: { backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 4 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pickerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  pickerOpt: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 8 },
  pickerIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pickerLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  pickerDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  detailModal: { backgroundColor: '#fff', borderRadius: 24, maxHeight: '80%', overflow: 'hidden' },
  closeBtn: { backgroundColor: '#2EB67D', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  closeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
