import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

interface Patient {
  id: number;
  fullName: string;
  age: number;
  gender: string;
  contact?: string;
  diagnosis?: string;
  status?: string;
  riskLevel?: string;
  assignedChwId?: string;
  assignedFamilyId?: string;
}

export default function PatientManagementTab() {
  const router = useRouter();
  const { role, userId } = useLocalSearchParams<{ role: string; userId: string }>();
  const userRole = role?.toLowerCase() || 'mhp';

  const roleFilter = userRole === 'mhp' ? undefined : userRole;

  const query = useQuery({
    queryKey: ['patients', roleFilter, userId],
    queryFn: () => api.patients('', roleFilter, userRole === 'mhp' ? userId : undefined),
    staleTime: 1000 * 60,
  });

  const patients = query.data || [];
  const isLoading = query.isLoading;
  const refetch = query.refetch;

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleAddPatient = () => {
    router.push(`/(mhp)/features/register-patient`);
  };

  const handleEditPatient = (patient: Patient) => {
    router.push(`/(mhp)/features/register-patient?patientId=${patient.id}&edit=1`);
  };

  const handleDeletePatient = (patientId: string) => {
    Alert.alert('Delete Patient', 'Are you sure you want to delete this patient?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePatient(patientId);
            refetch();
          } catch (error: any) {
            Alert.alert('Unable to delete patient', error?.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Patient Management</Text>
        </View>
        <Button
          variant="primary"
          onPress={handleAddPatient}
          leftIcon={<Ionicons name="person-add" size={16} color={colors.white} />}
          size="sm"
        >
          Register
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Manage patient records</Text>

        <View style={styles.items}>
          {patients.map((patient) => (
            <Card key={patient.id} variant="elevated" style={styles.patientCard}>
              <View style={styles.patientContent}>
                <View style={styles.patientHeader}>
                  <View style={styles.headerInfo}>
                    <Text style={styles.patientName}>{patient.fullName}</Text>
                    <Text style={styles.patientId}>{`P${String(patient.id).padStart(3, '0')}`}</Text>
                    <View style={styles.badgeContainer}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{patient.diagnosis || 'No Diagnosis'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailColumn}>
                    <Text style={styles.detailLabel}>Age</Text>
                    <Text style={styles.detailValue}>{patient.age}</Text>
                  </View>
                  <View style={styles.detailColumn}>
                    <Text style={styles.detailLabel}>Gender</Text>
                    <Text style={styles.detailValue}>{patient.gender}</Text>
                  </View>
                </View>

                <View style={styles.sections}>
                  {patient.contact && (
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>Contact</Text>
                      <Text style={styles.sectionValue}>{patient.contact}</Text>
                    </View>
                  )}
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Status</Text>
                    <Text style={styles.sectionValue}>{patient.status || 'Unknown'}</Text>
                  </View>
                  {patient.riskLevel && (
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>Risk Level</Text>
                      <Text style={styles.sectionValue}>{patient.riskLevel}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditPatient(patient)}>
                    <Ionicons name="create" size={18} color={colors.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeletePatient(patient.id)}>
                    <Ionicons name="trash" size={18} color={colors.errorDark} />
                    <Text style={[styles.actionText, { color: colors.errorDark }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  items: {
    gap: spacing.md,
  },
  patientCard: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  patientContent: {
    gap: spacing.md,
  },
  patientHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.border,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  patientId: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  badgeContainer: {
    marginTop: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    ...typography.tiny,
    color: colors.primary,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailColumn: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  detailLabel: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  sections: {
    gap: spacing.sm,
  },
  section: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionLabel: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  sectionValue: {
    ...typography.body,
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  deleteBtn: {
    backgroundColor: colors.errorTint,
  },
  actionText: {
    ...typography.captionBold,
    color: colors.primary,
  },
});
