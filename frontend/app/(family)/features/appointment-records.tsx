import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Container, Card } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function AppointmentRecords() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: patients } = useQuery({
    queryKey: ['familyPatients', user?.id],
    queryFn: () => api.patients(undefined, undefined, undefined, undefined, user?.id),
    enabled: !!user?.id,
  });

  const patient = patients?.[0];

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['patientReminders', patient?.id],
    queryFn: () => api.reminders(patient?.id?.toString()),
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
        <Text style={styles.title}>{t('appointment_records.title')}</Text>
        <Text style={styles.subtitle}>{t('appointment_records.subtitle')}</Text>

        {isLoading ? (
          <Text style={styles.infoText}>{t('appointment_records.loading')}</Text>
        ) : !reminders || reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>{t('appointment_records.no_appointments')}</Text>
          </View>
        ) : (
          reminders.map((item: any) => (
            <Card key={item.id} style={styles.card} variant="elevated">
              <View style={styles.cardHeader}>
                <View style={[styles.typeIcon, { backgroundColor: colors.primaryTint }]}>
                  <Ionicons name={item.type === 'Medication' ? 'medical' : 'calendar'} size={20} color={colors.primary} />
                </View>
                <View style={styles.headerText}>
                  {/* Appointment title is user-entered data — display as-is */}
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
                {item.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  </View>
                )}
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>{t('appointment_records.location_label')}</Text>
                  <Text style={styles.infoValue}>{patient?.province}, {patient?.district}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={14} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>{t('appointment_records.health_center')}:</Text>
                  <Text style={styles.infoValue}>{patient?.registeredByMhp?.workplace || t('common.na')}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
                  <Text style={styles.infoLabel}>{t('appointment_records.mhp_label')}:</Text>
                  <Text style={styles.infoValue}>{patient?.registeredByMhp?.fullName || t('common.na')}</Text>
                </View>
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
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  card: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  typeIcon: { width: 40, height: 40, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  headerText: { flex: 1 },
  cardTitle: { ...typography.bodyBold, color: colors.text },
  cardTime: { ...typography.tiny, color: colors.textSecondary, marginTop: 2 },
  completedBadge: { marginLeft: spacing.sm },
  cardFooter: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { ...typography.tinyBold, color: colors.textSecondary, width: 90 },
  infoValue: { ...typography.tiny, color: colors.text, flex: 1 },
  infoText: { textAlign: 'center', ...typography.body, color: colors.textTertiary, marginTop: spacing.xl },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textTertiary },
});
