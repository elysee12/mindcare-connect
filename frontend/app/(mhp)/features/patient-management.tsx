import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPatientId } from '@/lib/format';

export default function PatientManagement() {
  const router = useRouter();
  const { role, userId } = useLocalSearchParams<{ role: string; userId?: string }>();
  const { user: authUser } = useAuth();
  const activeRole = (role || authUser?.role || 'mhp').toLowerCase();
  const activeUserId = userId || (authUser?.id != null ? String(authUser.id) : undefined);

  const { isLoading, error, data: patientsData = [] } = useQuery({
    queryKey: ['patients', activeRole, activeUserId],
    queryFn: async () => {
      try {
        if (activeRole === 'mhp' && activeUserId) {
          return await api.patients(undefined, undefined, activeUserId);
        }
        if (activeRole === 'chw' && activeUserId) {
          return await api.patients(undefined, undefined, undefined, activeUserId);
        }
        return await api.patients(undefined, activeRole);
      } catch (err) {
        console.error('Error fetching patients:', err);
        throw err;
      }
    },
    staleTime: 1000 * 30,
  });

  const handleEdit = (patient: any) => {
    router.push(`/(mhp)/features/register-patient?patientId=${patient.id}&edit=1`);
  };

  const handleDelete = async (patientId: string) => {
    Alert.alert('Delete Patient', 'Confirm deletion of this patient ?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePatient(patientId);
            queryClient.invalidateQueries({ queryKey: ['patients', activeRole, activeUserId] });
            Alert.alert('Success', 'Patient deleted successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete patient');
          }
        },
      },
    ]);
  };

  const handleViewDetails = (patient: any) => {
    const address = `${patient.province || 'N/A'}, ${patient.district || 'N/A'}, ${patient.sector || 'N/A'}, ${patient.cell || 'N/A'}, ${patient.village || 'N/A'}`;
    const detailLines = [
      `ID: ${formatPatientId(patient.id)}`,
      `Name: ${patient.fullName || patient.full_name || patient.name || 'N/A'}`,
      `Age: ${patient.age || patient.age === 0 ? patient.age : 'N/A'}`,
      `Gender: ${patient.gender || 'N/A'}`,
      `Contact: ${patient.contact || patient.phone || 'N/A'}`,
      `Diagnosis: ${patient.diagnosis || 'N/A'}`,
      `Status: ${patient.status || 'N/A'}`,
      `Risk Level: ${patient.risk_level || patient.riskLevel || 'N/A'}`,
      `Address: ${address}`,
      `Assigned CHW: ${patient.assignedChwId ? `CHW #${patient.assignedChwId}` : 'None'}`,
      `Assigned Family: ${patient.assignedFamilyId ? `Family #${patient.assignedFamilyId}` : 'None'}`,
    ];
    Alert.alert('Patient Details', detailLines.join('\n'));
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Button
          variant="primary"
          onPress={() => router.push('/(mhp)/features/register-patient')}
          leftIcon={<Ionicons name="person-add" size={16} color={colors.white} />}
          size="sm"
        >
          Register Patient
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Patient Management</Text>
        <Text style={styles.pageSubtitle}>View and manage patient records</Text>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading patients...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>Failed to load patients</Text>
            <Text style={styles.errorSubtext}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
            <Button variant="primary" onPress={() => window.location.reload()} style={{ marginTop: spacing.md }}>
              Retry
            </Button>
          </View>
        ) : (
          <View style={styles.items}>
            {patientsData.length > 0 ? (
              patientsData.map((patient) => (
                <Card key={patient.id} variant="elevated" style={styles.patientCard}>
                  <View style={styles.patientInfo}>
                    {patient.photoUrl ? (
                      <Image source={{ uri: patient.photoUrl }} style={styles.photo} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Ionicons name="person" size={32} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.infoText}>
                      <Text style={styles.patientName}>{patient.fullName || patient.full_name || patient.name || 'Unknown'}</Text>
                      <Text style={styles.patientId}>{formatPatientId(patient.id)}</Text>
                      <Text style={styles.patientDetail}>Age: {patient.age ?? 'N/A'}</Text>
                      <Text style={styles.patientDetail}>Gender: {patient.gender || 'N/A'}</Text>
                      {patient.contact ? <Text style={styles.patientDetail}>Phone: {patient.contact}</Text> : <Text style={styles.patientDetail}>(Phone optional)</Text>}
                      <Text style={styles.patientDetail}>Location: {patient.province || 'N/A'}, {patient.district || 'N/A'}</Text>
                      <Text style={styles.patientDetail}>CHW: {patient.assignedChw?.fullName || 'None'}</Text>
                      {patient.diagnosis ? <Text style={styles.patientDetail}>Diagnosis: {patient.diagnosis}</Text> : null}
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewDetails(patient)}>
                      <Ionicons name="eye" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(patient)}>
                      <Ionicons name="create" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(patient.id)}>
                      <Ionicons name="trash" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No patients found</Text>
                <Text style={styles.emptySubtext}>Create a new patient to get started</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  headbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.primary, marginLeft: spacing.xs },
  topButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  topButtonText: { ...typography.bodyBold, color: colors.white },
  content: { padding: spacing.lg, gap: spacing.md, minHeight: '100%' },
  pageTitle: { ...typography.h2, color: colors.primaryDark },
  pageSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  loaderContainer: { justifyContent: 'center', alignItems: 'center', padding: spacing.xlg, minHeight: 300 },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  errorContainer: { justifyContent: 'center', alignItems: 'center', padding: spacing.xlg, minHeight: 300 },
  errorText: { ...typography.bodyBold, color: colors.error, marginTop: spacing.md },
  errorSubtext: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', padding: spacing.xlg, minHeight: 300 },
  emptyText: { ...typography.bodyBold, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
  items: { gap: spacing.md },
  patientCard: { padding: spacing.md, borderRadius: borderRadius.xl },
  patientInfo: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  photo: { width: 80, height: 80, borderRadius: borderRadius.xl, backgroundColor: colors.border },
  photoPlaceholder: { width: 80, height: 80, borderRadius: borderRadius.xl, backgroundColor: colors.primaryTint, justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1 },
  patientName: { ...typography.bodyBold, color: colors.text },
  patientId: { ...typography.tiny, color: colors.textSecondary, marginBottom: spacing.xs },
  patientDetail: { ...typography.caption, color: colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  actionBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, backgroundColor: colors.background },
});
