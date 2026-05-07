import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPatientId } from '@/lib/format';

export default function ViewTrackedPatients() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ['trackedPatients'],
    queryFn: () => api.trackedPatients(),
    staleTime: 1000 * 60,
  });

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tracked Patients</Text>
        <Text style={styles.subtitle}>All CHWs can view patients marked for tracking.</Text>

        {isLoading && <Text style={styles.infoText}>Loading tracked patients...</Text>}
        {error && (
          <Text style={[styles.infoText, { color: colors.error }]}>Error loading patients: {(error as any).message || 'Unknown error'}</Text>
        )}

        {patients.length === 0 && !isLoading ? (
          <Card style={styles.emptyCard} variant="outlined">
            <Text style={styles.emptyText}>No tracked patients yet. Track a patient to make them visible here.</Text>
          </Card>
        ) : null}

        {patients.map((patient: any) => (
          <Card key={patient.id} style={styles.patientCard} variant="elevated">
            <View style={styles.patientCardHeader}>
              {patient.photoUrl ? (
                <Image source={{ uri: patient.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
              )}
              <View style={styles.headerText}>
                <Text style={styles.patientName}>{patient.fullName}</Text>
                <Text style={styles.patientId}>{formatPatientId(patient.id)}</Text>
              </View>
            </View>
            <Text style={styles.patientAddress}>
              {['province', 'district', 'sector', 'cell', 'village']
                .map((field) => patient[field])
                .filter(Boolean)
                .join(', ') || 'Address not available'}
            </Text>
            <View style={styles.assignmentInfo}>
              <View style={styles.assignmentItem}>
                <Ionicons name="person-outline" size={14} color={colors.primary} />
                <Text style={styles.assignmentText}>MHP: {patient.registeredByMhp?.fullName || 'N/A'}</Text>
              </View>
              <View style={styles.assignmentItem}>
                <Ionicons name="walk-outline" size={14} color={colors.success} />
                <Text style={styles.assignmentText}>CHW: {patient.assignedChw?.fullName || 'Unassigned'}</Text>
              </View>
            </View>
          </Card>
        ))}

        <View style={styles.buttonWrapper}>
          <Button
            variant="primary"
            fullWidth
            onPress={() => queryClient.invalidateQueries({ queryKey: ['trackedPatients'] })}
          >
            Refresh
          </Button>
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
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  infoText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  emptyCard: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm },
  emptyText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  patientCard: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm, marginBottom: spacing.sm },
  patientCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  avatar: { width: 56, height: 56, borderRadius: borderRadius.full, backgroundColor: colors.primaryTint },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: borderRadius.full, backgroundColor: colors.primaryTint, justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1 },
  patientName: { ...typography.bodyBold, color: colors.text },
  patientId: { ...typography.caption, color: colors.textSecondary },
  patientAddress: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  assignmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  assignmentText: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  buttonWrapper: { marginTop: spacing.md },
});
