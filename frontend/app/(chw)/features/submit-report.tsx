import React, { useEffect, useState } from 'react';
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

  const submitMutation = useMutation({
    mutationFn: () => {
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
      
      // Force an immediate refetch of the reports list
      refetchReports();
      
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
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

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('dashboard.report_title_label')}</Text>
            <Input placeholder={t('dashboard.report_title_label')} value={title} onChangeText={setTitle} />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('dashboard.details_label')}</Text>
            <Input placeholder={t('dashboard.details_label')} value={details} onChangeText={setDetails} multiline style={{ height: 110 }} />
          </View>

          <View style={styles.buttonRow}>
            <Button 
              variant="primary" 
              onPress={() => submitMutation.mutate()} 
              disabled={!selectedPatient || !title || !details || submitMutation.isPending} 
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
          {reports.length === 0 ? (
            <Text style={styles.emptyText}>{t('dashboard.no_reports_yet')}</Text>
          ) : (
            reports.map((report: any) => (
              <Card key={report.id} style={styles.reportCard} variant="outlined">
                <View style={styles.reportHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <Text style={styles.reportPatient}>
                      {t('dashboard.patient_label')}: {report.patient?.fullName || 'N/A'} ({formatPatientId(report.patientId)})
                    </Text>
                  </View>
                  <View style={styles.reportActions}>
                    <TouchableOpacity onPress={() => handleEdit(report)} style={styles.actionBtn}>
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(report.id)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.reportDetails} numberOfLines={2}>{report.details}</Text>
                <Text style={styles.reportDate}>{new Date(report.createdAt).toLocaleDateString()}</Text>
              </Card>
            ))
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
  reportTitle: { ...typography.bodyBold, color: colors.text },
  reportPatient: { ...typography.tiny, color: colors.textSecondary },
  reportActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { padding: 4 },
  reportDetails: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  reportDate: { ...typography.tiny, color: colors.textTertiary, textAlign: 'right' },
  emptyText: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
});
