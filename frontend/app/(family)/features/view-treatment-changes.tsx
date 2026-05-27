import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Container, Card, Avatar } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function ViewTreatmentChanges() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showPatientInfo, setShowPatientInfo] = useState(false);

  const { data: patients } = useQuery({
    queryKey: ['familyPatients', user?.id],
    queryFn: () => api.patients(undefined, undefined, undefined, undefined, user?.id),
    enabled: !!user?.id,
  });

  const patient = patients?.[0];

  const { data: updates, isLoading } = useQuery({
    queryKey: ['treatmentChanges', patient?.id],
    queryFn: () => api.treatmentChanges(),
    enabled: !!patient?.id,
  });

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.title}>{t('treatment_changes.title')}</Text>
            <Text style={styles.subtitle}>{t('treatment_changes.subtitle')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.infoToggle, showPatientInfo && styles.infoToggleActive]}
            onPress={() => setShowPatientInfo(!showPatientInfo)}
          >
            <Ionicons name={showPatientInfo ? 'person' : 'person-outline'} size={20} color={showPatientInfo ? colors.white : colors.primary} />
          </TouchableOpacity>
        </View>

        {showPatientInfo && patient && (
          <Card style={styles.patientInfoCard} variant="elevated">
            <View style={styles.patientInfoHeader}>
              {patient.photoUrl ? (
                <Image source={{ uri: patient.photoUrl }} style={styles.patientImage} />
              ) : (
                <Avatar name={patient.fullName} size="lg" style={styles.patientAvatar} />
              )}
              <View style={styles.patientNameContainer}>
                {/* Patient name is real user data — display as-is */}
                <Text style={styles.patientName}>{patient.fullName}</Text>
                <Text style={styles.patientId}>ID: {patient.id}</Text>
              </View>
            </View>
            <View style={styles.patientDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('treatment_changes.gender_label')}:</Text>
                <Text style={styles.detailValue}>{t(`status_values.${patient.gender}`, { defaultValue: patient.gender })}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('treatment_changes.age_label')}:</Text>
                <Text style={styles.detailValue}>{patient.age}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('treatment_changes.diagnosis_label')}:</Text>
                <Text style={styles.detailValue}>{patient.diagnosis || t('common.na')}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('treatment_changes.assigned_chw')}:</Text>
                <Text style={styles.detailValue}>{patient.assignedChw?.fullName || t('common.na')}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('treatment_changes.registered_mhp')}:</Text>
                <Text style={styles.detailValue}>{patient.registeredByMhp?.fullName || t('common.na')}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('treatment_changes.health_center')}:</Text>
                <Text style={styles.detailValue}>{patient.registeredByMhp?.workplace || t('common.na')}</Text>
              </View>
            </View>
          </Card>
        )}

        {isLoading ? (
          <Text style={styles.infoText}>{t('treatment_changes.loading')}</Text>
        ) : !updates || updates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>{t('treatment_changes.no_changes')}</Text>
          </View>
        ) : (
          updates.map((item: any) => (
            <Card key={item.id} style={styles.card} variant="elevated">
              {/* Treatment change text is user-entered data — display as-is */}
              <Text style={styles.cardTitle}>{item.change}</Text>
              <View style={styles.cardFooter}>
                <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                <Text style={styles.cardSubtitle}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : t('common.na')}
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.recordedBy}>{t('treatment_changes.by_label')}: {item.changedBy || t('status_values.MHP')}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.backgroundSecondary, flex: 1 },
  headbar: { padding: spacing.md, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.primary, marginLeft: spacing.xs },
  content: { padding: spacing.lg, gap: spacing.sm },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  infoToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryTint, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
  infoToggleActive: { backgroundColor: colors.primary },
  patientInfoCard: { padding: spacing.md, borderRadius: borderRadius.xl, marginBottom: spacing.md, backgroundColor: colors.background, ...shadows.md },
  patientInfoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  patientImage: { width: 60, height: 60, borderRadius: 30, marginRight: spacing.md },
  patientAvatar: { marginRight: spacing.md },
  patientNameContainer: { flex: 1 },
  patientName: { ...typography.bodyBold, color: colors.text },
  patientId: { ...typography.tiny, color: colors.textTertiary, marginTop: 2 },
  patientDetails: { gap: spacing.xs },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4 },
  detailLabel: { ...typography.tinyBold, color: colors.textSecondary },
  detailValue: { ...typography.tiny, color: colors.text },
  card: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm },
  cardTitle: { ...typography.bodyBold, color: colors.text },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 4 },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary },
  recordedBy: { ...typography.tiny, color: colors.textTertiary, fontStyle: 'italic' },
  infoText: { textAlign: 'center', ...typography.body, color: colors.textTertiary, marginTop: spacing.xl },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textTertiary },
});
