import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Input, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function SubmitReport() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  
  // Follow-up specific fields
  const [reportType, setReportType] = useState<'regular' | 'followup'>('regular');
  const [mentalStatus, setMentalStatus] = useState('Stable');
  const [relapseSigns, setRelapseSigns] = useState(false);

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: () => api.patients(undefined, undefined, undefined, user?.id),
    staleTime: 1000 * 60,
    enabled: !!user?.id,
  });

  const { data: reports = [], refetch: refetchReports } = useQuery({
    queryKey: ['reports', user?.id],
    queryFn: () => api.reports({ chwId: String(user?.id) }),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const { data: followups = [], refetch: refetchFollowups } = useQuery({
    queryKey: ['followups', user?.id],
    queryFn: () => api.globalFollowups({ chwId: String(user?.id) }),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const filteredHistory = useMemo(() => {
    const history = reportType === 'followup' ? followups : reports;
    return [...(history || [])].sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reports, followups, reportType]);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (reportType === 'followup') {
        return api.createFollowup(String(selectedPatient), {
          mentalStatus,
          notes: details,
          relapseSigns,
        });
      }
      
      const payload = {
        patientId: selectedPatient,
        createdByChwId: Number(user?.id || 0),
        title,
        details,
      };
      if (editingReportId) {
        return api.updateReport(editingReportId, payload);
      }
      return api.submitReport(payload);
    },
    onSuccess: () => {
      setStatusMessage(editingReportId ? t('dashboard.report_update_success') : t('dashboard.report_submit_success'));
      setTitle('');
      setDetails('');
      setSelectedPatient(null);
      setEditingReportId(null);
      setRelapseSigns(false);
      setMentalStatus('Stable');
      
      // Force an immediate refetch of the reports list
      refetchReports();
      refetchFollowups();
      
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      setTimeout(() => setStatusMessage(''), 3000);
    },
    onError: (error: any) => {
      setStatusMessage(`${t('common.error')}: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteReport(id),
    onSuccess: () => {
      refetchReports();
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const handleEdit = (report: any) => {
    setEditingReportId(report.id);
    setTitle(report.title);
    setDetails(report.details);
    setSelectedPatient(report.patientId);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      t('dashboard.delete_report_title'),
      t('dashboard.delete_report_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]
    );
  };

  useEffect(() => {
    if (patients.length > 0 && selectedPatient === null && !editingReportId) {
      setSelectedPatient(patients[0]?.id ?? null);
    }
  }, [patients, selectedPatient, editingReportId]);

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('dashboard.report')}</Text>
        <Text style={styles.subtitle}>{editingReportId ? t('dashboard.update_clinical_report') : t('dashboard.send_clinical_report')}</Text>
        
        <Card style={styles.card} variant="elevated">
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('dashboard.select_report_type')}</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeOption, reportType === 'regular' && styles.typeOptionActive]}
                onPress={() => setReportType('regular')}
              >
                <Text style={[styles.typeText, reportType === 'regular' && styles.typeTextActive]}>
                  {t('dashboard.regular_report')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeOption, reportType === 'followup' && styles.typeOptionActive]}
                onPress={() => setReportType('followup')}
              >
                <Text style={[styles.typeText, reportType === 'followup' && styles.typeTextActive]}>
                  {t('dashboard.followup_report')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('dashboard.patient_label')}</Text>
            <View style={styles.patientList}>
              {patients.map((patient: any) => (
                <TouchableOpacity
                  key={patient.id}
                  onPress={() => setSelectedPatient(patient.id)}
                  style={[
                    styles.patientOption,
                    selectedPatient === patient.id ? styles.patientOptionActive : null,
                  ]}
                >
                  <Text style={[
                    styles.patientOptionText,
                    selectedPatient === patient.id ? styles.patientOptionTextActive : null
                  ]}>
                    {patient.fullName} ({formatPatientId(patient.id)})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {!patients.length ? <Text style={styles.infoText}>{t('patients.unknown')}</Text> : null}
          </View>

          {reportType === 'regular' && (
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>{t('dashboard.report_title_label')}</Text>
              <Input placeholder={t('dashboard.report_title_label')} value={title} onChangeText={setTitle} />
            </View>
          )}

          {reportType === 'followup' && (
            <>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{t('submit_report.mental_status')}</Text>
                <View style={styles.statusGrid}>
                  {(['Stable', 'Risk', 'Relapse'] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusOption, mentalStatus === s && styles.statusOptionActive]}
                      onPress={() => setMentalStatus(s)}
                    >
                      <Text style={[styles.statusOptionText, mentalStatus === s && styles.statusOptionTextActive]}>
                        {t(`status_values.${s}`, { defaultValue: s })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldWrapper}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setRelapseSigns(!relapseSigns)}
                >
                  <View style={[styles.checkbox, relapseSigns && styles.checkboxChecked]}>
                    {relapseSigns && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{t('submit_report.observed_relapse')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('dashboard.details_label')}</Text>
            <Input placeholder={t('dashboard.details_label')} value={details} onChangeText={setDetails} multiline style={{ height: 110 }} />
          </View>

          <View style={styles.buttonRow}>
            <Button 
              variant="primary" 
              onPress={() => submitMutation.mutate()} 
              disabled={!selectedPatient || (reportType === 'regular' && !title) || !details || submitMutation.isPending} 
              style={styles.button}
              loading={submitMutation.isPending}
            >
              {editingReportId ? t('dashboard.update_btn') : t('dashboard.submit_btn')}
            </Button>
            {editingReportId && (
              <Button 
                variant="ghost" 
                onPress={() => {
                  setEditingReportId(null);
                  setTitle('');
                  setDetails('');
                  setSelectedPatient(patients[0]?.id || null);
                }} 
                style={styles.cancelBtn}
              >
                {t('common.cancel')}
              </Button>
            )}
          </View>

          {statusMessage ? (
            <View style={[styles.toast, statusMessage.includes(t('common.error')) && { backgroundColor: colors.error }]}>
              <Text style={styles.toastText}>{statusMessage}</Text>
            </View>
          ) : null}
        </Card>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>{t('dashboard.submitted_reports')}</Text>
          {filteredHistory.length === 0 ? (
            <Text style={styles.emptyText}>{t('dashboard.no_reports_yet')}</Text>
          ) : (
            filteredHistory.map((report: any) => {
              const isFollowup = !!report.mentalStatus;
              return (
                <Card key={`${isFollowup ? 'f' : 'r'}-${report.id}`} style={styles.reportCard} variant="outlined">
                  <View style={styles.reportHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.reportTypeRow}>
                        <Text style={styles.reportTitle}>
                          {isFollowup ? t('dashboard.followup_report') : report.title}
                        </Text>
                        <View style={[styles.typeBadge, { backgroundColor: isFollowup ? colors.successTint : colors.primaryTint }]}>
                          <Text style={[styles.typeBadgeText, { color: isFollowup ? colors.success : colors.primary }]}>
                            {isFollowup ? t('submit_report.followup_badge') : t('submit_report.regular_badge')}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.reportPatient}>
                        {t('dashboard.patient_label')}: {report.patient?.fullName || 'N/A'} ({formatPatientId(report.patientId)})
                      </Text>
                    </View>
                    {!isFollowup && (
                      <View style={styles.reportActions}>
                        <TouchableOpacity onPress={() => handleEdit(report)} style={styles.actionBtn}>
                          <Ionicons name="create-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(report.id)} style={styles.actionBtn}>
                          <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Text style={styles.reportDetails} numberOfLines={2}>
                    {isFollowup ? `${t('submit_report.status_prefix')}: ${t(`status_values.${report.mentalStatus}`, { defaultValue: report.mentalStatus })}\n${report.notes}` : report.details}
                  </Text>
                  {isFollowup && report.relapseSigns && (
                    <View style={styles.relapseBadge}>
                      <Ionicons name="warning" size={12} color={colors.error} />
                      <Text style={styles.relapseText}>{t('patient_detail.relapse_detected')}</Text>
                    </View>
                  )}
                  <Text style={styles.reportDate}>{new Date(report.createdAt).toLocaleDateString()}</Text>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  headbar: { padding: spacing.md, backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.primary, marginLeft: spacing.xs },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxxl, gap: spacing.sm },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  card: { borderRadius: borderRadius.xl, padding: spacing.md, ...shadows.sm },
  fieldWrapper: { marginBottom: spacing.md },
  fieldLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  
  typeSelector: { flexDirection: 'row', gap: spacing.sm },
  typeOption: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  typeOptionActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  typeText: { ...typography.captionBold, color: colors.textSecondary },
  typeTextActive: { color: colors.primary },

  statusGrid: { flexDirection: 'row', gap: spacing.sm },
  statusOption: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  statusOptionActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  statusOptionText: { ...typography.caption, color: colors.textSecondary },
  statusOptionTextActive: { color: colors.primary, fontWeight: '700' },

  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary },
  checkboxLabel: { ...typography.caption, color: colors.text },

  patientList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  patientOption: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  patientOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  patientOptionText: { ...typography.caption, color: colors.text },
  patientOptionTextActive: { color: colors.primary, fontWeight: '700' },
  buttonRow: { gap: spacing.sm },
  button: { flex: 1 },
  cancelBtn: { flex: 1 },
  toast: { position: 'absolute', bottom: -10, left: 0, right: 0, backgroundColor: colors.success, borderRadius: borderRadius.lg, padding: spacing.sm, alignItems: 'center', zIndex: 10 },
  toastText: { ...typography.captionBold, color: colors.white },
  infoText: { ...typography.caption, color: colors.textTertiary, fontStyle: 'italic' },
  
  historySection: { marginTop: spacing.xl },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  reportCard: { marginBottom: spacing.sm, padding: spacing.md, backgroundColor: colors.white },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  reportTypeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  typeBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.sm },
  typeBadgeText: { ...typography.tiny, fontWeight: '700' },
  reportTitle: { ...typography.bodyBold, color: colors.text },
  reportPatient: { ...typography.tiny, color: colors.textSecondary },
  reportActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { padding: 4 },
  reportDetails: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  relapseBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.errorTint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: spacing.xs },
  relapseText: { ...typography.tiny, color: colors.error, fontWeight: '700' },
  reportDate: { ...typography.tiny, color: colors.textTertiary, textAlign: 'right' },
  emptyText: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
});
