import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Container, Card, Input, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatPatientId } from '@/lib/format';

export default function SubmitReport() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: () => api.patients(undefined, undefined, undefined, user?.id),
    staleTime: 1000 * 60,
    enabled: !!user?.id,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.submitReport({
        patientId: selectedPatient,
        createdByChwId: Number(user?.id || 0),
        title,
        details,
      }),
    onSuccess: () => {
      setStatusMessage('Report submitted successfully');
      setTitle('');
      setDetails('');
      setSelectedPatient(null);
      queryClient.invalidateQueries(['reports', user?.id]);
      setTimeout(() => setStatusMessage(''), 3000);
    },
    onError: (error: any) => {
      setStatusMessage(`Failed to submit report: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
    },
  });

  useEffect(() => {
    if (patients.length > 0 && selectedPatient === null) {
      setSelectedPatient(patients[0]?.id ?? null);
    }
  }, [patients, selectedPatient]);

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Submit Report</Text>
        <Text style={styles.subtitle}>Send a clinical report for MHP review.</Text>
        <Card style={styles.card} variant="elevated">
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Patient</Text>
            {patients.map((patient: any) => (
              <TouchableOpacity
                key={patient.id}
                onPress={() => setSelectedPatient(patient.id)}
                style={[
                  styles.patientOption,
                  selectedPatient === patient.id ? styles.patientOptionActive : null,
                ]}
              >
                <Text style={styles.patientOptionText}>{patient.fullName} ({formatPatientId(patient.id)})</Text>
              </TouchableOpacity>
            ))}
            {!patients.length ? <Text style={styles.infoText}>No patients found.</Text> : null}
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Report Title</Text>
            <Input placeholder="Title" value={title} onChangeText={setTitle} />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Details</Text>
            <Input placeholder="Details" value={details} onChangeText={setDetails} multiline style={{ height: 110 }} />
          </View>

          <Button variant="primary" onPress={() => submitMutation.mutate()} disabled={!selectedPatient || !title || !details} style={styles.button}>
            Submit Report
          </Button>

          {statusMessage ? (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{statusMessage}</Text>
            </View>
          ) : null}
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
  patientOption: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  patientOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  patientOptionText: { ...typography.caption, color: colors.text },
  button: { marginTop: spacing.md },
  toast: { position: 'absolute', bottom: 24, left: spacing.md, right: spacing.md, backgroundColor: colors.success, borderRadius: borderRadius.lg, padding: spacing.sm, alignItems: 'center' },
  toastText: { ...typography.captionBold, color: colors.white },
});
