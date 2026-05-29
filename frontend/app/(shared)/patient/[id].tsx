import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Text, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { api } from '@/lib/api';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const STATUS_META: Record<string, { color: string; bg: string; icon: any }> = {
  Stable:  { color: '#2EB67D', bg: '#EAF7F3', icon: 'checkmark-circle' },
  Risk:    { color: '#F59E0B', bg: '#FEF3C7', icon: 'warning' },
  Relapse: { color: '#EF4444', bg: '#FEE2E2', icon: 'alert-circle' },
};
const FOLLOWUP_STATUS: Record<string, { color: string; bg: string }> = {
  ATTENDED: { color: '#2EB67D', bg: '#EAF7F3' },
  MISSED:   { color: '#EF4444', bg: '#FEE2E2' },
  PENDING:  { color: '#F59E0B', bg: '#FEF3C7' },
};

export default function PatientDetailScreen() {
  const { id, role } = useLocalSearchParams<{ id: string; role: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [mentalStatus, setMentalStatus] = useState('Stable');
  const [notes, setNotes]               = useState('');
  const [relapseSigns, setRelapseSigns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast]               = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.patientById(id as string),
  });

  const { data: history } = useQuery({
    queryKey: ['followups', id],
    queryFn: () => api.followups(id as string),
    enabled: role !== 'chw',
  });

  const { data: reminders } = useQuery({
    queryKey: ['reminders', id],
    queryFn: () => api.reminders(id as string),
    enabled: role === 'chw',
  });

  const handleSubmitReport = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await api.createFollowup(id as string, { mentalStatus, notes, relapseSigns });
      await queryClient.invalidateQueries({ queryKey: ['followups', id] });
      await queryClient.invalidateQueries({ queryKey: ['patient', id] });
      setNotes(''); setRelapseSigns(false); setMentalStatus('Stable');
      showToast(t('patient_detail.submit_report') + ' — ' + t('common.success'));
    } catch (e: any) {
      showToast(e.message || 'Failed to submit report');
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' }}>
        <ActivityIndicator size="large" color="#2EB67D" />
      </View>
    );
  }

  const patientName      = patient?.fullName || patient?.full_name || t('common.unknown');
  const patientIdFmt     = formatPatientId(patient?.id);
  const fullAddress      = [patient?.province, patient?.district, patient?.sector, patient?.cell, patient?.village].filter(Boolean).join(', ') || t('patient_detail.no_address');
  const assignedChwName  = patient?.assignedChw?.fullName  || t('patient_detail.unassigned');
  const assignedFamName  = patient?.assignedFamily?.fullName || t('patient_detail.unassigned');
  const statusMeta       = STATUS_META[patient?.status || 'Stable'] || STATUS_META.Stable;
  const initials         = patientName.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* ── Hero header ── */}
        <LinearGradient colors={['#064E3B', '#065F46', '#2EB67D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.hero}>
          <View style={S.heroNav}>
            <TouchableOpacity style={S.navBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={S.heroNavTitle}>{t('patient_detail.title')}</Text>
            {(role === 'mhp' || role === 'admin') && (
              <TouchableOpacity style={S.navBtn} onPress={() => router.push(`/(mhp)/features/register-patient?patientId=${id}&edit=1` as any)}>
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            {role !== 'mhp' && role !== 'admin' && <View style={{ width: 36 }} />}
          </View>

          {/* Avatar + name */}
          <View style={S.heroProfile}>
            {patient?.photoUrl ? (
              <Image source={{ uri: patient.photoUrl }} style={S.heroPhoto} />
            ) : (
              <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']} style={S.heroAvatar}>
                <Text style={S.heroAvatarText}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={S.heroInfo}>
              <Text style={S.heroName}>{patientName}</Text>
              <Text style={S.heroId}>{patientIdFmt}</Text>
              <View style={[S.statusPill, { backgroundColor: statusMeta.bg }]}>
                <Ionicons name={statusMeta.icon} size={12} color={statusMeta.color} />
                <Text style={[S.statusPillText, { color: statusMeta.color }]}>
                  {t(`status_values.${patient?.status}`, { defaultValue: patient?.status || 'Stable' })}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick stats */}
          <View style={S.heroStats}>
            <View style={S.heroStat}>
              <Text style={S.heroStatVal}>{patient?.age ?? '—'}</Text>
              <Text style={S.heroStatLbl}>{t('patient_detail.age')}</Text>
            </View>
            <View style={S.heroStatDiv} />
            <View style={S.heroStat}>
              <Text style={S.heroStatVal}>{t(`status_values.${patient?.gender}`, { defaultValue: patient?.gender || '—' })}</Text>
              <Text style={S.heroStatLbl}>{t('patient_detail.gender')}</Text>
            </View>
            <View style={S.heroStatDiv} />
            <View style={S.heroStat}>
              <Text style={S.heroStatVal}>{patient?.riskLevel || '—'}</Text>
              <Text style={S.heroStatLbl}>Risk</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Info cards ── */}
        <View style={S.body}>

          {/* Diagnosis & contact */}
          <View style={S.infoCard}>
            <Text style={S.infoCardTitle}>Clinical Info</Text>
            <InfoRow icon="medical-outline"  label={t('patient_detail.diagnosis')} value={patient?.diagnosis || t('common.na')} />
            <InfoRow icon="call-outline"     label={t('patient_detail.contact')}   value={patient?.contact   || t('common.na')} />
          </View>

          {/* Location */}
          <View style={S.infoCard}>
            <Text style={S.infoCardTitle}>Location</Text>
            <InfoRow icon="location-outline" label={t('patient_detail.address')} value={fullAddress} />
          </View>

          {/* Care team */}
          <View style={S.infoCard}>
            <Text style={S.infoCardTitle}>Care Team</Text>
            <InfoRow icon="walk-outline"    label={t('patient_detail.assigned_chw')}  value={assignedChwName} />
            <InfoRow icon="people-outline"  label={t('patient_detail.family_member')} value={assignedFamName} />
            {patient?.registeredByMhp && (
              <InfoRow icon="medkit-outline" label="MHP" value={`${patient.registeredByMhp.fullName}${patient.registeredByMhp.workplace ? ` · ${patient.registeredByMhp.workplace}` : ''}`} />
            )}
          </View>

          {/* Found info */}
          {patient?.foundByUser && (
            <View style={[S.infoCard, { borderLeftWidth: 3, borderLeftColor: '#2EB67D' }]}>
              <View style={S.foundHeader}>
                <Ionicons name="location" size={16} color="#2EB67D" />
                <Text style={[S.infoCardTitle, { color: '#2EB67D', marginBottom: 0 }]}>{t('patient_detail.located_info')}</Text>
              </View>
              <InfoRow icon="pin-outline"    label={t('patient_detail.located_at')} value={patient.locationFound || t('common.na')} />
              {patient.foundDetails && <InfoRow icon="document-text-outline" label={t('patient_detail.notes')} value={patient.foundDetails} />}
              <View style={S.finderBox}>
                <Text style={S.finderTitle}>{t('patient_detail.finder_details')}</Text>
                <Text style={S.finderText}>{patient.foundByUser.fullName} · {t(`status_values.${patient.foundByUser.role}`, { defaultValue: patient.foundByUser.role })}</Text>
                <Text style={S.finderText}>{patient.foundByUser.email}</Text>
                {patient.foundByUser.phone && <Text style={S.finderText}>{patient.foundByUser.phone}</Text>}
              </View>
            </View>
          )}

          {/* ── CHW follow-up form ── */}
          {role === 'chw' && (
            <View style={S.formCard}>
              <View style={S.formHeader}>
                <View style={S.formHeaderIcon}><Ionicons name="clipboard-outline" size={18} color="#3B82F6" /></View>
                <Text style={S.formHeaderTitle}>{t('patient_detail.submit_followup')}</Text>
              </View>

              <Text style={S.formLabel}>{t('patient_detail.mental_status')}</Text>
              <View style={S.statusGrid}>
                {(['Stable', 'Risk', 'Relapse'] as const).map(s => {
                  const m = STATUS_META[s]; const active = mentalStatus === s;
                  return (
                    <TouchableOpacity key={s} style={[S.statusOpt, active && { backgroundColor: m.bg, borderColor: m.color }]} onPress={() => setMentalStatus(s)}>
                      {active && <View style={[S.statusOptDot, { backgroundColor: m.color }]} />}
                      <Text style={[S.statusOptText, active && { color: m.color, fontWeight: '700' }]}>{t(`status_values.${s}`, { defaultValue: s })}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[S.formLabel, { marginTop: 14 }]}>{t('patient_detail.detailed_notes')}</Text>
              <TextInput
                style={S.textArea}
                placeholder={t('patient_detail.notes_placeholder')}
                multiline numberOfLines={4}
                value={notes} onChangeText={setNotes}
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity style={S.checkRow} onPress={() => setRelapseSigns(!relapseSigns)}>
                <View style={[S.checkbox, relapseSigns && S.checkboxActive]}>
                  {relapseSigns && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={S.checkLabel}>{t('patient_detail.relapse_signs')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[S.submitBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmitReport} disabled={isSubmitting}
              >
                {isSubmitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="send-outline" size={16} color="#fff" /><Text style={S.submitBtnText}>{t('patient_detail.submit_report')}</Text></>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* ── History ── */}
          <View style={S.historySection}>
            <Text style={S.historyTitle}>
              {role === 'chw' ? t('patient_detail.reminder_history') : t('patient_detail.followup_history')}
            </Text>

            {role === 'chw' ? (
              !reminders?.length ? (
                <EmptyHistory text={t('patient_detail.no_reminders')} />
              ) : (
                reminders.map((item: any) => {
                  const sm = FOLLOWUP_STATUS[item.status || 'PENDING'] || FOLLOWUP_STATUS.PENDING;
                  return (
                    <View key={item.id} style={S.histCard}>
                      <View style={[S.histBar, { backgroundColor: sm.color }]} />
                      <View style={S.histBody}>
                        <View style={S.histTop}>
                          <Text style={S.histTitle2}>{item.title}</Text>
                          <View style={[S.histBadge, { backgroundColor: sm.bg }]}>
                            <Text style={[S.histBadgeText, { color: sm.color }]}>
                              {t(`status_values.${item.status || 'PENDING'}`, { defaultValue: item.status || 'PENDING' })}
                            </Text>
                          </View>
                        </View>
                        <View style={S.histMeta}>
                          <Ionicons name="time-outline" size={12} color="#94A3B8" />
                          <Text style={S.histMetaText}>{item.time}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )
            ) : (
              !history?.length ? (
                <EmptyHistory text={t('patient_detail.no_history')} />
              ) : (
                history.map((item: any) => {
                  const sm = STATUS_META[item.mentalStatus] || STATUS_META.Stable;
                  return (
                    <View key={item.id} style={S.histCard}>
                      <View style={[S.histBar, { backgroundColor: sm.color }]} />
                      <View style={S.histBody}>
                        <View style={S.histTop}>
                          <View style={[S.histStatusPill, { backgroundColor: sm.bg }]}>
                            <Ionicons name={sm.icon} size={12} color={sm.color} />
                            <Text style={[S.histBadgeText, { color: sm.color }]}>
                              {t(`status_values.${item.mentalStatus}`, { defaultValue: item.mentalStatus })}
                            </Text>
                          </View>
                          <Text style={S.histDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                        {item.notes ? <Text style={S.histNotes}>{item.notes}</Text> : null}
                        <View style={S.histFooter}>
                          <Ionicons name="person-outline" size={11} color="#94A3B8" />
                          <Text style={S.histBy}>
                            {item.createdBy?.fullName || t('patients.unknown')}
                            {item.createdBy?.village ? ` · ${item.createdBy.village}` : ''}
                          </Text>
                        </View>
                        {item.relapseSigns && (
                          <View style={S.relapsePill}>
                            <Ionicons name="warning" size={11} color="#EF4444" />
                            <Text style={S.relapseText}>{t('patient_detail.relapse_detected')}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )
            )}
          </View>

        </View>
      </ScrollView>

      {toast ? (
        <View style={S.toast}><Text style={S.toastText}>{toast}</Text></View>
      ) : null}
    </Container>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={S.infoRow}>
      <View style={S.infoIconWrap}><Ionicons name={icon} size={14} color="#2EB67D" /></View>
      <View style={S.infoRowBody}>
        <Text style={S.infoLabel}>{label}</Text>
        <Text style={S.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function EmptyHistory({ text }: { text: string }) {
  return (
    <View style={S.emptyHistory}>
      <Ionicons name="document-text-outline" size={36} color="#E2E8F0" />
      <Text style={S.emptyHistoryText}>{text}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { paddingBottom: 80 },

  // Hero
  hero: { paddingBottom: 24 },
  heroNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroNavTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  heroProfile: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, marginBottom: 20 },
  heroPhoto: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  heroAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  heroAvatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroId: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 20, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  heroStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  // Body
  body: { padding: 16, gap: 14 },

  // Info card
  infoCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  infoCardTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, marginBottom: 0 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  infoIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EAF7F3', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  infoRowBody: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#1E293B', lineHeight: 20 },

  // Found info
  foundHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  finderBox: { backgroundColor: '#F0FDF4', borderRadius: 10, margin: 12, padding: 12, gap: 3 },
  finderTitle: { fontSize: 11, fontWeight: '700', color: '#2EB67D', marginBottom: 4 },
  finderText: { fontSize: 12, color: '#1E293B' },

  // Follow-up form
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  formHeaderIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  formHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  statusGrid: { flexDirection: 'row', gap: 8 },
  statusOpt: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 10, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  statusOptDot: { width: 7, height: 7, borderRadius: 4 },
  statusOptText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  textArea: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, height: 100, textAlignVertical: 'top', fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#3B82F6' },
  checkLabel: { fontSize: 14, color: '#1E293B' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // History
  historySection: { gap: 10 },
  historyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  histCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  histBar: { width: 4 },
  histBody: { flex: 1, padding: 12, gap: 6 },
  histTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histTitle2: { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1, marginRight: 8 },
  histStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  histBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  histBadgeText: { fontSize: 10, fontWeight: '700' },
  histDate: { fontSize: 11, color: '#94A3B8' },
  histMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  histMetaText: { fontSize: 12, color: '#94A3B8' },
  histNotes: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  histFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  histBy: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
  relapsePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  relapseText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  emptyHistory: { alignItems: 'center', paddingVertical: 32, gap: 10, backgroundColor: '#fff', borderRadius: 14 },
  emptyHistoryText: { fontSize: 13, color: '#94A3B8' },

  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, alignItems: 'center' },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
