import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

const STATUS_OPTS = ['Stable', 'Risk', 'Relapse'] as const;
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Stable:  { color: '#2EB67D', bg: '#EAF7F3' },
  Risk:    { color: '#F59E0B', bg: '#FEF3C7' },
  Relapse: { color: '#EF4444', bg: '#FEE2E2' },
};

export default function SubmitReport() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [reportType, setReportType]       = useState<'regular' | 'followup'>('regular');
  const [title, setTitle]                 = useState('');
  const [details, setDetails]             = useState('');
  const [selectedPatient, setSelectedP]   = useState<number | null>(null);
  const [mentalStatus, setMentalStatus]   = useState('Stable');
  const [relapseSigns, setRelapseSigns]   = useState(false);
  const [editingId, setEditingId]         = useState<number | null>(null);
  const [toast, setToast]                 = useState('');
  const [toastError, setToastError]       = useState(false);

  const showToast = (msg: string, err = false) => { setToast(msg); setToastError(err); setTimeout(() => setToast(''), 3000); };

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: () => api.patients(undefined, undefined, undefined, user?.id),
    staleTime: 1000 * 60, enabled: !!user?.id,
  });
  const { data: reports = [], refetch: refetchReports } = useQuery({
    queryKey: ['reports', user?.id],
    queryFn: () => api.reports({ chwId: String(user?.id) }),
    staleTime: 1000 * 30, enabled: !!user?.id,
  });
  const { data: followups = [], refetch: refetchFollowups } = useQuery({
    queryKey: ['followups', user?.id],
    queryFn: () => api.globalFollowups(),
    staleTime: 1000 * 30, enabled: !!user?.id,
  });

  const history = useMemo(() => {
    const src = reportType === 'followup' ? followups : reports;
    return [...(src as any[])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, followups, reportType]);

  useEffect(() => {
    if ((patients as any[]).length > 0 && selectedPatient === null && !editingId) {
      setSelectedP((patients as any[])[0]?.id ?? null);
    }
  }, [patients]);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (reportType === 'followup') {
        return api.createFollowup(String(selectedPatient), { mentalStatus, notes: details, relapseSigns });
      }
      const payload = { patientId: selectedPatient, createdByChwId: Number(user?.id || 0), title, details };
      return editingId ? api.updateReport(editingId, payload) : api.submitReport(payload);
    },
    onSuccess: () => {
      showToast(editingId ? t('dashboard.report_update_success') : t('dashboard.report_submit_success'));
      setTitle(''); setDetails(''); setSelectedP(null); setEditingId(null);
      setRelapseSigns(false); setMentalStatus('Stable');
      refetchReports(); refetchFollowups();
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    },
    onError: (e: any) => showToast(`${t('common.error')}: ${e.message}`, true),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteReport(id),
    onSuccess: () => { refetchReports(); queryClient.invalidateQueries({ queryKey: ['reports', user?.id] }); },
    onError: (e: any) => Alert.alert(t('common.error'), e.message),
  });

  const handleEdit = (r: any) => { setEditingId(r.id); setTitle(r.title); setDetails(r.details); setSelectedP(r.patientId); };
  const handleDelete = (id: number) => Alert.alert(
    t('dashboard.delete_report_title'), t('dashboard.delete_report_confirm'),
    [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(id) }]
  );

  const canSubmit = !!selectedPatient && (reportType === 'followup' || !!title) && !!details;

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('dashboard.report')}</Text>
          <Text style={S.headerSub}>{editingId ? t('dashboard.update_clinical_report') : t('dashboard.send_clinical_report')}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Report type toggle */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>{t('dashboard.select_report_type')}</Text>
          <View style={S.typeRow}>
            {(['regular', 'followup'] as const).map(rt => (
              <TouchableOpacity
                key={rt}
                style={[S.typeBtn, reportType === rt && S.typeBtnActive]}
                onPress={() => setReportType(rt)}
              >
                <Ionicons
                  name={rt === 'regular' ? 'document-text-outline' : 'calendar-outline'}
                  size={16}
                  color={reportType === rt ? '#fff' : '#64748B'}
                />
                <Text style={[S.typeBtnText, reportType === rt && S.typeBtnTextActive]}>
                  {rt === 'regular' ? t('dashboard.regular_report') : t('dashboard.followup_report')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Patient selector */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>{t('dashboard.patient_label')}</Text>
          <View style={S.patientGrid}>
            {(patients as any[]).map((p: any) => (
              <TouchableOpacity
                key={p.id}
                style={[S.patientChip, selectedPatient === p.id && S.patientChipActive]}
                onPress={() => setSelectedP(p.id)}
              >
                <Text style={[S.patientChipText, selectedPatient === p.id && S.patientChipTextActive]}>
                  {p.fullName} ({formatPatientId(p.id)})
                </Text>
              </TouchableOpacity>
            ))}
            {!(patients as any[]).length && <Text style={S.emptyText}>{t('patients.unknown')}</Text>}
          </View>
        </View>

        {/* Regular: title */}
        {reportType === 'regular' && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>{t('dashboard.report_title_label')}</Text>
            <Input placeholder={t('dashboard.report_title_label')} value={title} onChangeText={setTitle} />
          </View>
        )}

        {/* Follow-up: mental status + relapse */}
        {reportType === 'followup' && (
          <>
            <View style={S.section}>
              <Text style={S.sectionLabel}>{t('submit_report.mental_status')}</Text>
              <View style={S.statusRow}>
                {STATUS_OPTS.map(s => {
                  const meta = STATUS_COLORS[s];
                  const active = mentalStatus === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[S.statusBtn, active && { backgroundColor: meta.bg, borderColor: meta.color }]}
                      onPress={() => setMentalStatus(s)}
                    >
                      {active && <View style={[S.statusDot, { backgroundColor: meta.color }]} />}
                      <Text style={[S.statusBtnText, active && { color: meta.color, fontWeight: '700' }]}>
                        {t(`status_values.${s}`, { defaultValue: s })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={S.section}>
              <TouchableOpacity style={S.checkRow} onPress={() => setRelapseSigns(!relapseSigns)}>
                <View style={[S.checkbox, relapseSigns && S.checkboxChecked]}>
                  {relapseSigns && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={S.checkLabel}>{t('submit_report.observed_relapse')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Details */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>{t('dashboard.details_label')}</Text>
          <Input placeholder={t('dashboard.details_label')} value={details} onChangeText={setDetails} multiline style={{ height: 110 }} />
        </View>

        {/* Submit button */}
        <View style={S.section}>
          <TouchableOpacity
            style={[S.submitBtn, (!canSubmit || submitMutation.isPending) && S.submitBtnDisabled]}
            onPress={() => submitMutation.mutate()}
            disabled={!canSubmit || submitMutation.isPending}
          >
            {submitMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Ionicons name="send-outline" size={16} color="#fff" /><Text style={S.submitBtnText}>{editingId ? t('dashboard.update_btn') : t('dashboard.submit_btn')}</Text></>
            }
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity style={S.cancelBtn} onPress={() => { setEditingId(null); setTitle(''); setDetails(''); setSelectedP((patients as any[])[0]?.id || null); }}>
              <Text style={S.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* History */}
        <View style={S.historySection}>
          <Text style={S.historyTitle}>{t('dashboard.submitted_reports')}</Text>
          {history.length === 0 ? (
            <View style={S.emptyHistory}>
              <Ionicons name="document-text-outline" size={36} color="#E2E8F0" />
              <Text style={S.emptyText}>{t('dashboard.no_reports_yet')}</Text>
            </View>
          ) : (
            history.map((r: any) => {
              const isF = !!r.mentalStatus;
              const accent = isF ? '#2EB67D' : '#3B82F6';
              const sc = r.mentalStatus === 'Stable' ? '#2EB67D' : r.mentalStatus === 'Relapse' ? '#EF4444' : '#F59E0B';
              return (
                <View key={`${isF ? 'f' : 'r'}-${r.id}`} style={S.histCard}>
                  <View style={[S.histBar, { backgroundColor: accent }]} />
                  <View style={S.histBody}>
                    <View style={S.histTop}>
                      <View style={S.histLeft}>
                        <Text style={S.histTitle} numberOfLines={1}>{isF ? t('dashboard.followup_report') : r.title}</Text>
                        <Text style={S.histPatient}>{r.patient?.fullName || 'N/A'} · {formatPatientId(r.patientId)}</Text>
                      </View>
                      <View style={[S.histBadge, { backgroundColor: accent + '18' }]}>
                        <Text style={[S.histBadgeText, { color: accent }]}>{isF ? t('submit_report.followup_badge') : t('submit_report.regular_badge')}</Text>
                      </View>
                    </View>
                    {isF ? (
                      <View style={S.histStatusRow}>
                        <View style={[S.histStatusDot, { backgroundColor: sc }]} />
                        <Text style={[S.histStatusText, { color: sc }]}>{t(`status_values.${r.mentalStatus}`, { defaultValue: r.mentalStatus })}</Text>
                        {r.relapseSigns && (
                          <View style={S.relapsePill}>
                            <Ionicons name="warning" size={10} color="#EF4444" />
                            <Text style={S.relapseText}>{t('patient_detail.relapse_detected')}</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={S.histDetails} numberOfLines={2}>{r.details}</Text>
                    )}
                    <View style={S.histFooter}>
                      <Text style={S.histDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                      {!isF && (
                        <View style={S.histActions}>
                          <TouchableOpacity style={S.histActionBtn} onPress={() => handleEdit(r)}>
                            <Ionicons name="create-outline" size={16} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity style={[S.histActionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleDelete(r.id)}>
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      {toast ? (
        <View style={[S.toast, toastError && { backgroundColor: '#EF4444' }]}>
          <Text style={S.toastText}>{toast}</Text>
        </View>
      ) : null}
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 80 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  typeBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  typeBtnTextActive: { color: '#fff' },
  patientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  patientChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  patientChipActive: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  patientChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  patientChipTextActive: { color: '#1D4ED8', fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 10, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBtnText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#3B82F6' },
  checkLabel: { fontSize: 14, color: '#1E293B' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 14 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  emptyText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
  historySection: { marginTop: 8 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  emptyHistory: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  histCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  histBar: { width: 4 },
  histBody: { flex: 1, padding: 12, gap: 6 },
  histTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  histLeft: { flex: 1, marginRight: 8 },
  histTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  histPatient: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  histBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  histBadgeText: { fontSize: 10, fontWeight: '700' },
  histStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  histStatusDot: { width: 7, height: 7, borderRadius: 4 },
  histStatusText: { fontSize: 12, fontWeight: '600' },
  relapsePill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  relapseText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  histDetails: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  histFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histDate: { fontSize: 10, color: '#CBD5E1' },
  histActions: { flexDirection: 'row', gap: 6 },
  histActionBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, alignItems: 'center' },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
