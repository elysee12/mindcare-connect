import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Container, Card, Input, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function ModifyTreatment() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Generate date options (next 30 days)
  const getDateOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const dateOption = new Date(today);
      dateOption.setDate(today.getDate() + i);
      options.push(dateOption);
    }
    return options;
  };

  // Generate time options (every 30 minutes from 8 AM to 6 PM)
  const getTimeOptions = () => {
    const options = [];
    const startHour = 8;
    const endHour = 18;
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeOption = new Date();
        timeOption.setHours(hour, minute, 0, 0);
        options.push(timeOption);
      }
    }
    return options;
  };

  const dateOptions = getDateOptions();
  const timeOptions = getTimeOptions();

  const { data: patientOptions = [], isLoading: isPatientsLoading } = useQuery({
    queryKey: authUser?.role?.toLowerCase() === 'mhp' ? ['allPatients'] : ['patients', authUser?.id, authUser?.role],
    queryFn: async () => {
      if (!authUser?.id) return [];

      const role = authUser.role?.toLowerCase();
      // For MHP, show all patients as requested
      if (role === 'mhp') {
        return api.patients();
      }

      if (role === 'chw') {
        return api.patients(undefined, undefined, undefined, String(authUser.id));
      }

      return api.patients();
    },
    staleTime: 1000 * 30,
    enabled: !!authUser?.id, // Enable query only when authUser.id is available
  });

  const selectedPatient = patientOptions?.find((p: any) => String(p.id) === selectedPatientId);
  const selectedPatientLabel = selectedPatient?.fullName || selectedPatient?.full_name || selectedPatient?.name || 'Select patient';

  const updateTreatment = () => {
    if (!selectedPatientId) {
      setStatusMessage('Please select a patient before updating treatment.');
      return;
    }

    setStatusMessage('Treatment updated successfully');
    setTimeout(() => {
      setStatusMessage('');
      router.back();
    }, 900);
  }
  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Modify Treatment</Text>
        <Text style={styles.subtitle}>Update medication or therapy plan</Text>

        <Card style={styles.card} variant="elevated">
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Patient</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowPatientDropdown(!showPatientDropdown)}>
              <Text style={styles.dropdownText}>{selectedPatientId ? selectedPatientLabel : 'Select patient'}</Text>
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
                      <Text style={styles.dropdownOptionText}>{patient.fullName || patient.full_name || patient.name || `Patient ${patient.id}`}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.dropdownOptionText}>No patients available</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Current Treatment</Text>
            <Input placeholder="Current plan details" value={currentPlan} onChangeText={setCurrentPlan} />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>New Treatment</Text>
            <Input placeholder="New treatment plan" value={newPlan} onChangeText={setNewPlan} />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <Input placeholder="Additional notes" value={notes} onChangeText={setNotes} />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.pickerText}>{date.toLocaleDateString()}</Text>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Time</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.pickerText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonWrapper}>
            <Button variant="primary" size="lg" fullWidth onPress={updateTreatment}>
              Update Treatment (Static)
            </Button>
          </View>
        </Card>

        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={dateOptions}
                keyExtractor={(item) => item.toISOString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      date.toDateString() === item.toDateString() && styles.pickerItemSelected
                    ]}
                    onPress={() => {
                      setDate(item);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      date.toDateString() === item.toDateString() && styles.pickerItemTextSelected
                    ]}>
                      {item.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                style={styles.pickerList}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showTimePicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={timeOptions}
                keyExtractor={(item) => item.toISOString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      time.getHours() === item.getHours() && time.getMinutes() === item.getMinutes() && styles.pickerItemSelected
                    ]}
                    onPress={() => {
                      setTime(item);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      time.getHours() === item.getHours() && time.getMinutes() === item.getMinutes() && styles.pickerItemTextSelected
                    ]}>
                      {item.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                style={styles.pickerList}
              />
            </View>
          </View>
        </Modal>

        {statusMessage ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{statusMessage}</Text>
          </View>
        ) : null}
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
  fieldWrapper: { marginBottom: spacing.md },
  fieldLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  button: { marginTop: spacing.md },
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
  dropdownText: {
    ...typography.body,
    color: colors.text,
  },
  dropdownOptions: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  dropdownOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownOptionText: {
    ...typography.body,
    color: colors.text,
  },
  buttonWrapper: { marginTop: spacing.md },
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
  toastText: {
    ...typography.captionBold,
    color: colors.white,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  pickerText: {
    ...typography.body,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
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
  modalTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  modalButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  pickerItemText: {
    ...typography.body,
    color: colors.text,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
