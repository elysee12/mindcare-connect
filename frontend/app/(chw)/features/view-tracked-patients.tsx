import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { Container, Card, Button, Input } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function ViewTrackedPatients() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [locationFound, setLocationFound] = useState('');
  const [foundDetails, setFoundDetails] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ['trackedPatients'],
    queryFn: () => api.trackedPatients(),
    staleTime: 1000 * 60,
  });

  const markAsFoundMutation = useMutation({
    mutationFn: ({ id, location, details }: { id: number; location: string; details?: string }) =>
      api.markPatientAsFound(id, location, details),
    onSuccess: () => {
      Alert.alert(t('common.success'), 'Patient marked as found and removed from tracking.');
      setIsModalVisible(false);
      setLocationFound('');
      setFoundDetails('');
      queryClient.invalidateQueries({ queryKey: ['trackedPatients'] });
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const handleMarkFound = (patient: any) => {
    setSelectedPatient(patient);
    setIsModalVisible(true);
  };

  const submitFound = () => {
    if (!locationFound) {
      Alert.alert(t('common.error'), 'Please provide a location.');
      return;
    }
    markAsFoundMutation.mutate({
      id: selectedPatient.id,
      location: locationFound,
      details: foundDetails,
    });
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('dashboard.tracked_patients')}</Text>
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
                .join(', ') || t('notifications.address_not_available')}
            </Text>
            <View style={styles.assignmentInfo}>
              <View style={styles.assignmentItem}>
                <Ionicons name="person-outline" size={14} color={colors.primary} />
                <Text style={styles.assignmentText}>MHP: {patient.registeredByMhp?.fullName || 'N/A'}</Text>
              </View>
              <View style={styles.assignmentItem}>
                <Ionicons name="walk-outline" size={14} color={colors.success} />
                <Text style={styles.assignmentText}>CHW: {patient.assignedChw?.fullName || t('patient_detail.unassigned')}</Text>
              </View>
            </View>
            <Button
              variant="success"
              size="small"
              onPress={() => handleMarkFound(patient)}
              style={styles.foundBtn}
            >
              Found this Patient
            </Button>
          </Card>
        ))}

        <View style={styles.buttonWrapper}>
          <Button
            variant="primary"
            fullWidth
            onPress={() => queryClient.invalidateQueries({ queryKey: ['trackedPatients'] })}
          >
            Refresh List
          </Button>
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Found Patient</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Patient: {selectedPatient?.fullName}</Text>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Location Found</Text>
                <Input
                  placeholder="Where did you find them?"
                  value={locationFound}
                  onChangeText={setLocationFound}
                />
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Additional Details</Text>
                <Input
                  placeholder="Any notes or observations?"
                  value={foundDetails}
                  onChangeText={setFoundDetails}
                  multiline
                  style={{ height: 100 }}
                />
              </View>
              <Button
                variant="primary"
                onPress={submitFound}
                loading={markAsFoundMutation.isPending}
              >
                Submit & Notify Everyone
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  infoText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  emptyCard: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm, backgroundColor: colors.white },
  emptyText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  patientCard: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm, marginBottom: spacing.sm, backgroundColor: colors.white },
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
    marginBottom: spacing.sm,
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
  foundBtn: { marginTop: spacing.xs },
  buttonWrapper: { marginTop: spacing.md },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.h3, color: colors.text },
  modalBody: { padding: spacing.lg, gap: spacing.md },
  modalSubtitle: { ...typography.bodyBold, color: colors.primary, marginBottom: spacing.sm },
  fieldWrapper: { gap: spacing.xs },
  fieldLabel: { ...typography.captionBold, color: colors.textSecondary },
});
