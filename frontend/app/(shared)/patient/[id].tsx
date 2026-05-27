import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Text, Image } from 'react-native';
import { Container, Card, Avatar, Button, Input } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius, iconSize } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { api } from '@/lib/api';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function PatientDetailScreen() {
  const { id, role } = useLocalSearchParams<{ id: string, role: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [mentalStatus, setMentalStatus] = useState('Stable');
  const [notes, setNotes] = useState('');
  const [relapseSigns, setRelapseSigns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => api.patientById(id as string),
  });

  const patientName = patient?.fullName || patient?.full_name || t('common.unknown');
  const patientIdFormatted = formatPatientId(patient?.id);
  const fullAddress = [patient?.province, patient?.district, patient?.sector, patient?.cell, patient?.village]
    .filter(Boolean)
    .join(', ') || t('patient_detail.no_address');
  const assignedChwName = patient?.assignedChw?.fullName || patient?.assignedChw?.full_name || t('patient_detail.unassigned');
  const assignedFamilyName = patient?.assignedFamily?.fullName || patient?.assignedFamily?.full_name || t('patient_detail.unassigned');

  const { data: history } = useQuery({
    queryKey: ['followups', id],
    queryFn: async () => api.followups(id as string),
    enabled: role !== 'chw',
  });

  const { data: reminders } = useQuery({
    queryKey: ['reminders', id],
    queryFn: async () => api.reminders(id as string),
    enabled: role === 'chw',
  });

  const handleSubmitReport = async () => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      await api.createFollowup(id as string, {
        mentalStatus,
        notes,
        relapseSigns,
      });
      await queryClient.invalidateQueries({ queryKey: ['followups', id] });
      await queryClient.invalidateQueries({ queryKey: ['patient', id] });

      setNotes('');
      setRelapseSigns(false);
      setMentalStatus('Stable');

      alert(t('patient_detail.submit_report') + ' ' + t('common.success'));
    } catch (error: any) {
      alert(error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('patient_detail.title')}</Text>
        <TouchableOpacity style={styles.editBtn}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card variant="elevated" style={styles.profileCard}>
          <Card.Content>
            {patient?.photoUrl ? (
              <Image source={{ uri: patient.photoUrl }} style={styles.profileImage} />
            ) : (
              <Avatar
                name={patientName}
                size="xl"
              />
            )}
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientId}>{patientIdFormatted}</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>{t('patient_detail.address')}</Text>
                <Text style={styles.detailValue}>{fullAddress}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>{t('patient_detail.assigned_chw')}</Text>
                <Text style={styles.detailValue}>{assignedChwName}</Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>{t('patient_detail.family_member')}</Text>
                <Text style={styles.detailValue}>{assignedFamilyName}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>{t('patient_detail.gender')}</Text>
                <Text style={styles.detailValue}>{patient?.gender ? t(`status_values.${patient.gender}`, { defaultValue: patient.gender }) : t('common.unknown')}</Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>{t('patient_detail.age')}</Text>
                <Text style={styles.detailValue}>{patient?.age ?? t('common.na')}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>{t('patient_detail.contact')}</Text>
                <Text style={styles.detailValue}>{patient?.contact || t('common.na')}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>{t('patient_detail.diagnosis')}</Text>
                <Text style={styles.detailValue}>{patient?.diagnosis || t('common.na')}</Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>{t('patient_detail.status')}</Text>
                <Text style={styles.detailValue}>{patient?.status ? t(`status_values.${patient.status}`, { defaultValue: patient.status }) : t('common.na')}</Text>
              </View>
            </View>

            {patient?.foundByUser && (
              <View style={styles.foundInfoContainer}>
                <View style={styles.foundHeader}>
                  <Ionicons name="location" size={20} color={colors.success} />
                  <Text style={styles.foundTitle}>{t('patient_detail.located_info')}</Text>
                </View>
                <View style={styles.foundContent}>
                  <Text style={styles.foundLabel}>{t('patient_detail.located_at')}: <Text style={styles.foundValue}>{patient.locationFound}</Text></Text>
                  {patient.foundDetails ? <Text style={styles.foundLabel}>{t('patient_detail.notes')}: <Text style={styles.foundValue}>{patient.foundDetails}</Text></Text> : null}
                  
                  <View style={styles.finderDetails}>
                    <Text style={styles.finderTitle}>{t('patient_detail.finder_details')}:</Text>
                    <View style={styles.finderRow}>
                      <Ionicons name="person" size={14} color={colors.textSecondary} />
                      <Text style={styles.finderText}>{patient.foundByUser.fullName} ({t(`status_values.${patient.foundByUser.role}`, { defaultValue: patient.foundByUser.role })})</Text>
                    </View>
                    <View style={styles.finderRow}>
                      <Ionicons name="mail" size={14} color={colors.textSecondary} />
                      <Text style={styles.finderText}>{patient.foundByUser.email}</Text>
                    </View>
                    {patient.foundByUser.phone && (
                      <View style={styles.finderRow}>
                        <Ionicons name="call" size={14} color={colors.textSecondary} />
                        <Text style={styles.finderText}>{patient.foundByUser.phone}</Text>
                      </View>
                    )}
                    {patient.foundByUser.workplace && (
                      <View style={styles.finderRow}>
                        <Ionicons name="business" size={14} color={colors.textSecondary} />
                        <Text style={styles.finderText}>{patient.foundByUser.workplace}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {role === 'chw' && (
          <>
            <Text style={styles.sectionTitle}>{t('patient_detail.submit_followup')}</Text>
            <Card variant="elevated" style={styles.formCard}>
              <Card.Content>
                <Text style={styles.label}>{t('patient_detail.mental_status')}</Text>
                <View style={styles.statusGrid}>
                  {(['Stable', 'Risk', 'Relapse'] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusOption, mentalStatus === s && styles.statusOptionActive]}
                      onPress={() => setMentalStatus(s)}
                    >
                      <Text style={[styles.statusOptionText, mentalStatus === s && styles.statusOptionTextActive]}>{t(`status_values.${s}`, { defaultValue: s })}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { marginTop: spacing.md }]}>{t('patient_detail.detailed_notes')}</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder={t('patient_detail.notes_placeholder')}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setRelapseSigns(!relapseSigns)}
                >
                  <View style={[styles.checkbox, relapseSigns && styles.checkboxActive]}>
                    {relapseSigns && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{t('patient_detail.relapse_signs')}</Text>
                </TouchableOpacity>

                <Button
                  variant="primary"
                  size="lg"
                  onPress={handleSubmitReport}
                  loading={isSubmitting}
                >
                  {t('patient_detail.submit_report')}
                </Button>
              </Card.Content>
            </Card>
          </>
        )}

        <Text style={styles.sectionTitle}>{role === 'chw' ? t('patient_detail.reminder_history') : t('patient_detail.followup_history')}</Text>
        {role === 'chw' ? (
          reminders?.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>{t('patient_detail.no_reminders')}</Text>
            </View>
          ) : (
            reminders?.map((item: any) => (
              <Card key={item.id} style={styles.historyCard}>
                <Card.Content>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyStatus}>{item.title}</Text>
                    <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.historyNotes}>{t('patient_detail.notes')}: {item.type}</Text>
                  <Text style={styles.historyNotes}>{t('notifications.time_found')}: {item.time}</Text>
                  {item.status && (
                    <View style={[
                      styles.relapseBadge, 
                      { backgroundColor: item.status === 'ATTENDED' ? colors.successTint : item.status === 'MISSED' ? colors.errorTint : colors.warningTint }
                    ]}>
                      <Ionicons 
                        name={item.status === 'ATTENDED' ? "checkmark-circle" : item.status === 'MISSED' ? "close-circle" : "time"} 
                        size={12} 
                        color={item.status === 'ATTENDED' ? colors.success : item.status === 'MISSED' ? colors.error : colors.warning} 
                      />
                      <Text style={[
                        styles.relapseText, 
                        { color: item.status === 'ATTENDED' ? colors.success : item.status === 'MISSED' ? colors.error : colors.warning }
                      ]}>
                        {t(`status_values.${item.status}`, { defaultValue: item.status })}
                      </Text>
                    </View>
                  )}
                  {item.completed && !item.status && (
                    <View style={[styles.relapseBadge, { backgroundColor: colors.successTint }]}>
                      <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                      <Text style={[styles.relapseText, { color: colors.success }]}>{t('patient_detail.completed')}</Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          )
        ) : (
          history?.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>{t('patient_detail.no_history')}</Text>
            </View>
          ) : (
            history?.map((item: any) => (
              <Card key={item.id} style={styles.historyCard}>
                <Card.Content>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyStatus}>{t(`status_values.${item.mentalStatus}`, { defaultValue: item.mentalStatus })}</Text>
                    <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.historyNotes}>{item.notes}</Text>
                  <Text style={styles.historySubmitter}>
                    {t('patient_detail.by')}: {item.createdBy?.fullName || t('patients.unknown')}{item.createdBy?.village ? ` (${item.createdBy.village})` : ''}
                  </Text>
                  {item.relapseSigns && (
                    <View style={styles.relapseBadge}>
                      <Ionicons name="warning" size={12} color={colors.error} />
                      <Text style={styles.relapseText}>{t('patient_detail.relapse_detected')}</Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          )
        )}
      </ScrollView>
    </Container>
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
    padding: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  profileCard: {
    borderRadius: borderRadius.xxl,
    marginBottom: spacing.xxl,
  },
  profileContent: {
    alignItems: 'flex-start',
    paddingVertical: spacing.xl,
  },
  avatar: {
    backgroundColor: colors.primaryTint,
    marginBottom: spacing.md,
  },
  patientName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    ...typography.tiny,
    fontWeight: '700',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryTint,
  },
  patientId: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    width: '100%',
  },
  detailBlock: {
    flex: 1,
    minWidth: '45%',
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
  },
  foundInfoContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  foundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  foundTitle: {
    ...typography.bodyBold,
    color: colors.success,
  },
  foundContent: {
    gap: spacing.xs,
  },
  foundLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  foundValue: {
    ...typography.caption,
    color: colors.text,
  },
  finderDetails: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.success + '20',
    gap: 4,
  },
  finderTitle: {
    ...typography.tinyBold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  finderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  finderText: {
    ...typography.tiny,
    color: colors.text,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  formCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
  },
  formContent: {
    padding: spacing.md,
  },
  label: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusOption: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  statusOptionTextActive: {
    color: colors.white,
  },
  textArea: {
    ...typography.body,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.text,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  historyCard: {
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  historyContent: {
    padding: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  historyStatus: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  historyDate: {
    ...typography.tiny,
    color: colors.textTertiary,
  },
  historyNotes: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  historySubmitter: {
    ...typography.tiny,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  relapseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  relapseText: {
    ...typography.tiny,
    color: colors.error,
    fontWeight: '700',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyHistoryText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});
