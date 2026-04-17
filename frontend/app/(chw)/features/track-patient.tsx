import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Container, Card, Input, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPatientId } from '@/lib/format';

export default function TrackPatient() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.patients(),
    staleTime: 1000 * 60,
  });

  const trackMutation = useMutation({
    mutationFn: (patientId: number) => api.trackPatient(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries(['patients']);
      queryClient.invalidateQueries(['trackedPatients']);
      setStatusMessage('Patient marked as tracked successfully');
      setTimeout(() => setStatusMessage(''), 1800);
    },
    onError: () => {
      setStatusMessage('Failed to track patient. Please try again.');
      setTimeout(() => setStatusMessage(''), 1800);
    },
  });

  const matchingPatients = useMemo(() => {
    if (!query) return patients;
    const normalized = query.trim().toLowerCase();
    return patients.filter((patient: any) =>
      `${patient.fullName}`.toLowerCase().includes(normalized) || 
      `${patient.id}`.includes(normalized) ||
      formatPatientId(patient.id).toLowerCase().includes(normalized),
    );
  }, [query, patients]);

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Track Patient</Text>
        <Text style={styles.subtitle}>Mark patient coordination as tracked across CHWs.</Text>

        <Card style={styles.card} variant="elevated">
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Search by patient name or ID</Text>
            <Input placeholder="i.e. Jane Doe or 102" value={query} onChangeText={setQuery} />
          </View>
          {statusMessage ? <Text style={styles.infoText}>{statusMessage}</Text> : null}

          {isLoading ? (
            <Text style={styles.infoText}>Loading patients...</Text>
          ) : (
            matchingPatients.map((patient: any) => (
              <Card key={patient.id} variant="outlined" style={styles.patientCard}>
                <View style={styles.patientTopRow}>
                  <View style={styles.patientTextGroup}>
                    <Text style={styles.patientId}>{formatPatientId(patient.id)}</Text>
                    <Text style={styles.patientName}>{patient.fullName}</Text>
                    <Text style={styles.patientMeta}>{patient.diagnosis || 'No diagnosis yet'} • {patient.status}</Text>
                  </View>
                  {patient.photoUrl ? (
                    <Image source={{ uri: patient.photoUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={20} color={colors.primaryDark} />
                    </View>
                  )}
                </View>
                <Text style={styles.patientAddress}>
                  {['district', 'sector', 'cell', 'village'].map((k) => patient[k]).filter(Boolean).join(', ') || 'Address not available'}
                </Text>
                <Button
                  variant={patient.tracked ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={patient.tracked}
                  onPress={() => trackMutation.mutate(patient.id)}
                >
                  {patient.tracked ? 'Already Tracked' : 'Track Patient'}
                </Button>
              </Card>
            ))
          )}
        </Card>
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
  card: { borderRadius: borderRadius.xl, padding: spacing.md, ...shadows.sm },
  fieldWrapper: { marginBottom: spacing.md },
  fieldLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  infoText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  patientCard: { marginBottom: spacing.sm, borderRadius: borderRadius.xl, padding: spacing.md },
  patientTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  patientTextGroup: { flex: 1 },
  patientId: { ...typography.captionBold, color: colors.textSecondary },
  patientName: { ...typography.bodyBold, color: colors.text, marginTop: spacing.xs },
  patientMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  patientAddress: { ...typography.caption, color: colors.textSecondary, marginVertical: spacing.sm },
  avatar: { width: 45, height: 45, borderRadius: borderRadius.full, backgroundColor: colors.primaryTint },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: borderRadius.full, backgroundColor: colors.primaryTint, justifyContent: 'center', alignItems: 'center' },
});
