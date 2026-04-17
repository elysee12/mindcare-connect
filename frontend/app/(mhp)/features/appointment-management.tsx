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

export default function AppointmentManagement() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

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

  // For now, we'll use reminders as appointments since there's no dedicated appointments model
  // TODO: Replace with proper appointments API when implemented
  const { data: appointments = [], isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => api.reminders(),
    staleTime: 1000 * 30,
  });

  // Fetch all patients for MHP
  const { data: patientOptions = [], isLoading: isPatientsLoading } = useQuery({
    queryKey: ['allPatients'],
    queryFn: async () => api.patients(),
    staleTime: 1000 * 30,
    enabled: !!authUser?.id,
  });

  // Delete appointment mutation (using reminders for now)
  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: number) => api.deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setStatusMessage('Appointment deleted successfully');
      setTimeout(() => setStatusMessage(''), 2000);
    },
    onError: () => {
      setStatusMessage('Failed to delete appointment');
      setTimeout(() => setStatusMessage(''), 2000);
    },
  });

  // Create appointment mutation (using reminders for now)
  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => api.createReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowScheduleModal(false);
      resetForm();
      setStatusMessage('Appointment scheduled successfully');
      setTimeout(() => setStatusMessage(''), 2000);
    },
    onError: () => {
      setStatusMessage('Failed to schedule appointment');
      setTimeout(() => setStatusMessage(''), 2000);
    },
  });

  const resetForm = () => {
    setSelectedPatientId('');
    setDate(new Date());
    setTime(new Date());
    setLocation('');
  };

  const selectedPatient = patientOptions?.find((p: any) => String(p.id) === selectedPatientId);
  const selectedPatientLabel = selectedPatient ? `${formatPatientId(selectedPatient.id)} - ${selectedPatient.fullName || selectedPatient.full_name || selectedPatient.name}` : 'Select patient';

  const handleScheduleAppointment = () => {
    if (!selectedPatientId || !location.trim()) {
      setStatusMessage('Please select a patient and enter location');
      return;
    }

    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const formattedTime = time.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    createAppointmentMutation.mutate({
      patientId: parseInt(selectedPatientId),
      type: 'appointment',
      title: `Appointment with ${selectedPatient?.fullName || 'Patient'}`,
      time: `${formattedDate} ${formattedTime}`,
      completed: false,
    });
  };

  const handleDeleteAppointment = (id: number) => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAppointmentMutation.mutate(id) },
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
          onPress={() => setShowScheduleModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Appointment Management</Text>
        <Text style={styles.subtitle}>View and manage all scheduled appointments</Text>

        {isAppointmentsLoading ? (
          <Card style={styles.card}>
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </Card>
        ) : appointments.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>No appointments scheduled</Text>
          </Card>
        ) : (
          appointments
            .filter((appointment: any) => appointment.type === 'appointment')
            .map((appointment: any) => (
              <Card key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientId}>
                      {appointment.patient ? formatPatientId(appointment.patient.id) : 'Unknown'}
                    </Text>
                    <Text style={styles.patientName}>
                      {appointment.patient?.fullName || appointment.patient?.full_name || appointment.patient?.name || 'Unknown Patient'}
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
                      onPress={() => handleDeleteAppointment(appointment.id)}
                    >
                      <Ionicons name="trash" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.appointmentContent}>
                  <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                  <View style={styles.appointmentDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>
                        {new Date(appointment.time).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>
                        {new Date(appointment.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.statusText}>
                    Status: {appointment.completed ? 'Completed' : 'Scheduled'}
                  </Text>
                </View>
              </Card>
            ))
        )}
      </ScrollView>

      {/* Schedule Appointment Modal */}
      <Modal visible={showScheduleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule New Appointment</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
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

              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Location</Text>
                <Input
                  placeholder="Clinic or location"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.modalActions}>
                <View style={styles.cancelBtn}>
                  <Button
                    variant="outline"
                    size="md"
                    onPress={() => setShowScheduleModal(false)}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </View>
                <View style={styles.scheduleBtn}>
                  <Button
                    variant="primary"
                    size="md"
                    onPress={handleScheduleAppointment}
                    loading={createAppointmentMutation.isPending}
                    fullWidth
                  >
                    Schedule
                  </Button>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
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
            <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerList}>
              {dateOptions.map((item) => (
                <TouchableOpacity
                  key={item.toISOString()}
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
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
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
            <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerList}>
              {timeOptions.map((item) => (
                <TouchableOpacity
                  key={item.toISOString()}
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
              ))}
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
  appointmentCard: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm, marginBottom: spacing.sm },
  appointmentHeader: {
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
  appointmentContent: { gap: spacing.xs },
  appointmentTitle: { ...typography.bodyBold, color: colors.text },
  appointmentDetails: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailText: { ...typography.caption, color: colors.textSecondary },
  statusText: { ...typography.caption, color: colors.success, marginTop: spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
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
  modalButtonText: { ...typography.body, color: colors.primary },
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
  pickerText: { ...typography.body, color: colors.text },
  pickerList: { maxHeight: 300 },
  pickerItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: { backgroundColor: colors.primaryLight },
  pickerItemText: { ...typography.body, color: colors.text },
  pickerItemTextSelected: { color: colors.primary, fontWeight: 'bold' },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: { flex: 1 },
  scheduleBtn: { flex: 1 },
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