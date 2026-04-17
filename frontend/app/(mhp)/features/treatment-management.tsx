import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Container, Card, Input, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { formatPatientId } from '@/lib/format';

export default function TreatmentManagement() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [treatmentChange, setTreatmentChange] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch all treatments
  const { data: treatments = [], isLoading: isTreatmentsLoading } = useQuery({
    queryKey: ['treatmentChanges'],
    queryFn: async () => api.treatmentChanges(),
    staleTime: 1000 * 30,
  });

  // Fetch all patients for MHP
  const { data: patientOptions = [], isLoading: isPatientsLoading } = useQuery({
    queryKey: ['allPatients'],
    queryFn: async () => api.patients(),
    staleTime: 1000 * 30,
    enabled: !!authUser?.id,
  });

  // Delete treatment mutation
  const deleteTreatmentMutation = useMutation({
    mutationFn: (id: number) => api.deleteTreatmentChange(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatmentChanges'] });
      setStatusMessage('Treatment deleted successfully');
      setTimeout(() => setStatusMessage(''), 2000);
    },
    onError: () => {
      setStatusMessage('Failed to delete treatment');
      setTimeout(() => setStatusMessage(''), 2000);
    },
  });

  // Create treatment mutation
  const createTreatmentMutation = useMutation({
    mutationFn: (data: { patientId: number; change: string; changedBy?: string }) =>
      api.createTreatmentChange(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatmentChanges'] });
      setShowAddModal(false);
      setSelectedPatientId('');
      setTreatmentChange('');
      setStatusMessage('Treatment added successfully');
      setTimeout(() => setStatusMessage(''), 2000);
    },
    onError: () => {
      setStatusMessage('Failed to add treatment');
      setTimeout(() => setStatusMessage(''), 2000);
    },
  });

  const selectedPatient = patientOptions?.find((p: any) => String(p.id) === selectedPatientId);
  const selectedPatientLabel = selectedPatient ? `${formatPatientId(selectedPatient.id)} - ${selectedPatient.fullName || selectedPatient.full_name || selectedPatient.name}` : 'Select patient';

  const handleAddTreatment = () => {
    if (!selectedPatientId || !treatmentChange.trim()) {
      setStatusMessage('Please select a patient and enter treatment details');
      return;
    }

    createTreatmentMutation.mutate({
      patientId: parseInt(selectedPatientId),
      change: treatmentChange.trim(),
      changedBy: authUser?.full_name || 'MHP',
    });
  };

  const handleDeleteTreatment = (id: number) => {
    Alert.alert(
      'Delete Treatment',
      'Are you sure you want to delete this treatment record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTreatmentMutation.mutate(id) },
      ]
    );
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Treatment Management</Text>
        <Text style={styles.subtitle}>View and manage all patient treatments</Text>

        {isTreatmentsLoading ? (
          <Card style={styles.card}>
            <Text style={styles.loadingText}>Loading treatments...</Text>
          </Card>
        ) : treatments.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>No treatments found</Text>
          </Card>
        ) : (
          treatments.map((treatment: any) => (
            <Card key={treatment.id} style={styles.treatmentCard}>
              <View style={styles.treatmentHeader}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientId}>
                    {treatment.patient ? formatPatientId(treatment.patient.id) : 'Unknown'}
                  </Text>
                  <Text style={styles.patientName}>
                    {treatment.patient?.fullName || treatment.patient?.full_name || treatment.patient?.name || 'Unknown Patient'}
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => {
                      // TODO: Implement edit functionality
                      Alert.alert('Edit', 'Edit functionality coming soon');
                    }}
                  >
                    <Ionicons name="pencil" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteTreatment(treatment.id)}
                  >
                    <Ionicons name="trash" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.treatmentContent}>
                <Text style={styles.treatmentText}>{treatment.change}</Text>
                <View style={styles.treatmentMeta}>
                  <Text style={styles.metaText}>
                    Changed by: {treatment.changedBy || 'Unknown'}
                  </Text>
                  <Text style={styles.metaText}>
                    Date: {new Date(treatment.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Treatment Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Treatment</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Patient</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowPatientDropdown(!showPatientDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {selectedPatientId ? selectedPatientLabel : 'Select patient'}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {showPatientDropdown && (
                  <View style={styles.dropdownOptions}>
                    {isPatientsLoading ? (
                      <Text style={styles.dropdownOptionText}>Loading patients...</Text>
                    ) : patientOptions?.length ? (
                      patientOptions.map((patient: any) => (
                        <TouchableOpacity
                          key={patient.id}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setSelectedPatientId(String(patient.id));
                            setShowPatientDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>
                            {formatPatientId(patient.id)} - {patient.fullName || patient.full_name || patient.name}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.dropdownOptionText}>No patients available</Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Treatment Details</Text>
                <Input
                  placeholder="Describe the treatment plan or changes"
                  value={treatmentChange}
                  onChangeText={setTreatmentChange}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.modalActions}>
                <View style={styles.cancelBtn}>
                  <Button
                    variant="outline"
                    size="md"
                    onPress={() => setShowAddModal(false)}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </View>
                <View style={styles.addBtnModal}>
                  <Button
                    variant="primary"
                    size="md"
                    onPress={handleAddTreatment}
                    loading={createTreatmentMutation.isPending}
                    fullWidth
                  >
                    Add Treatment
                  </Button>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {statusMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{statusMessage}</Text>
        </View>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.backgroundSecondary, flex: 1 },
  headbar: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.primary, marginLeft: spacing.xs },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  card: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm },
  loadingText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  treatmentCard: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm, marginBottom: spacing.sm },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  patientInfo: { flex: 1 },
  patientId: { ...typography.captionBold, color: colors.primary, marginBottom: spacing.xs },
  patientName: { ...typography.bodyBold, color: colors.text },
  actionButtons: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: { backgroundColor: colors.primaryLight },
  deleteBtn: { backgroundColor: colors.errorLight },
  treatmentContent: { gap: spacing.xs },
  treatmentText: { ...typography.body, color: colors.text, lineHeight: 20 },
  treatmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  metaText: { ...typography.caption, color: colors.textSecondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...typography.h3, color: colors.primaryDark },
  modalBody: { padding: spacing.lg },
  fieldWrapper: { marginBottom: spacing.md },
  fieldLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  dropdownText: { ...typography.body, color: colors.text },
  dropdownOptions: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    maxHeight: 200,
    ...shadows.sm,
  },
  dropdownOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownOptionText: { ...typography.body, color: colors.text },
  multilineInput: { height: 100, textAlignVertical: 'top' },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: { flex: 1 },
  addBtnModal: { flex: 1 },
  toast: {
    position: 'absolute',
    bottom: 32,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  toastText: { ...typography.captionBold, color: colors.white },
});