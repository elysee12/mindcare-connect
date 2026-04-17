import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPatientId } from '@/lib/format';

export default function PatientList() {
  const router = useRouter();
  const { role, userId } = useLocalSearchParams<{ role?: string; userId?: string }>();
  const [status, setStatus] = useState('');

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patientList', role, userId],
    queryFn: () => api.patients('', role, undefined, role === 'chw' ? userId : undefined),
  });

  const refresh = () => {
    setStatus('Patient list refreshed');
    setTimeout(() => setStatus(''), 1000);
  };

  return (
    <Container safeArea edges={[ 'top', 'bottom' ]} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Patient List</Text>
        <Text style={styles.subtitle}>Shared patient list for your role</Text>

        {patients.map((p) => (
          <Card key={p.id} style={styles.card} variant="elevated">
            <View style={styles.patientRow}>
              {p.photoUrl ? (
                <Image source={{ uri: p.photoUrl }} style={styles.patientImage} />
              ) : (
                <View style={styles.patientImagePlaceholder}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
              )}
              <View style={styles.patientInfo}>
                <Text style={styles.cardTitle}>{p.fullName}</Text>
                <Text style={styles.cardSubtitle}>ID: {formatPatientId(p.id)}</Text>
                <Text style={styles.cardSubtitle}>Family: {p.assignedFamily?.fullName ?? 'Unassigned'}</Text>
              </View>
            </View>
          </Card>
        ))}

        <View style={styles.buttonWrapper}>
          <Button variant="primary" fullWidth onPress={refresh}>
            Refresh
          </Button>
        </View>

        {status ? <Text style={styles.toast}>{status}</Text> : null}
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
  cardTitle: { ...typography.bodyBold, color: colors.text },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  patientImage: { width: 46, height: 46, borderRadius: 46, backgroundColor: colors.primaryTint },
  patientImagePlaceholder: { width: 46, height: 46, borderRadius: 46, backgroundColor: colors.primaryTint, justifyContent: 'center', alignItems: 'center' },
  patientInfo: { flex: 1, marginLeft: spacing.sm },
  button: { marginTop: spacing.md },
  buttonWrapper: { marginTop: spacing.md },
  toast: { marginTop: spacing.sm, ...typography.captionBold, color: colors.success },
});
