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
import { useTranslation } from 'react-i18next';

export default function AppointmentManagement() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
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
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  const getDateOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      options.push(d);
    }
    return options;
  };

  const getTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const t = new Date();
        t.setHours(hour, minute, 0, 0);
        options.push(t);
      }
    }
    return options;
  };

  const dateOptions = getDateOptions();
  const timeOptions = getTimeOptions();

  const { data: appointments = [], isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => api.reminders(),
    staleTime: 1000 * 30,
  });

  const { data: patientOptions = [], isLoading: isPatientsLoading } = useQuery({
    queryKey: ['allPatients'],
    queryFn: async () => api.patients(),
    staleTime: 1000 * 30,
    enabled: !!authUser?.id,
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: number) => api.deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setStatusMessage(t('appointment_mgmt.deleted'));
      setTimeout(() => setStatusMessage(''), 2000);
    },
    onError: () => {
      setStatusMessage(t('appointment_mgmt.delete_failed'));
      setTimeout(() => setStatusMessage(''), 2000);
    },
  });

  const saveAppointmentMutation = useMutation({
    mutationFn: (data: any) => {
      const { id, ...payload } = data;
      if (id || editingAppointment) {
        return api.updateReminder(id || editingAppointment.id, payload);
      }
      return api.createReminder(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowScheduleModal(false);
      resetForm();
      setStatusMessage(editingAppointment ? t('appointment_mgmt.updated') : t('appointment_mgmt.saved'));
      setEditingAppointment(null);
      setTimeout(() => setStatusMessage(''), 2000);
    },
    onError: () => {
      setStatusMessage(t('appointment_mgmt.op_failed'));
      setTimeout(() => setStatusMessage(''), 2000);
    },
  });

  const resetForm = () => {
    setSelectedPatientId('');
    setLocation('');
    setDate(new Date());
    setTime(new Date());
    setEditingAppointment(null);
  };

  const selectedPatient = patientOptions?.find((p: any) => String(p.id) === selectedPatientId);
  const selectedPatientLabel = selectedPatient
    ? `${formatPatientId(selectedPatient.id)} - ${selectedPatient.fullName || selectedPatient.full_name || selectedPatient.name}`
    : t('appointment_mgmt.select_patient');

  const handleScheduleAppointment = () => {
    if (!selectedPatientId || !location.trim()) {
      setStatusMessage(t('appointment_mgmt.validation_msg'));
      return;
    }
    const formattedDate = date.toISOString().split('T')[0];
    const formattedTime = time.toTimeString().split(' ')[0].substring(0, 5);
    saveAppointmentMutation.mutate({
      patientId: parseInt(selectedPatientId),
      type: 'appointment',
      title: `Appointment with ${selectedPatient?.fullName || 'Patient'}`,
      time: `${formattedDate} ${formattedTime}`,
      completed: false,
    });
  };

  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setSelectedPatientId(appointment.patientId?.toString() || appointment.patient?.id?.toString() || '');
    setLocation(appointment.title.split(' with ')[1] || '');
    const appointmentDate = new Date(appointment.time);
    setDate(appointmentDate);
    setTime(appointmentDate);
    setShowScheduleModal(true);
  };

  const handleConfirmAttendance = (id: number, status: 'ATTENDED' | 'MISSED') => {
    saveAppointmentMutation.mutate({ id, status, completed: status === 'ATTENDED' });
  };

  const handleDeleteAppointment = (id: number) => {
    Alert.alert(
      t('appointment_mgmt.delete_title'),
      t('appointment_mgmt.delete_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => deleteAppointmentMutation.mutate(id) },
      ]
    );
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowScheduleModal(true)}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('appointment_mgmt.title')}</Text>
        <Text style={styles.subtitle}>{t('appointment_mgmt.subtitle')}</Text>

        {isAppointmentsLoading ? (
          <Card style={styles.card}><Text style={styles.loadingText}>{t('appointment_mgmt.loading')}</Text></Card>
        ) : appointments.filter((a: any) => a.type === 'appointment').length === 0 ? (
          <Card style={styles.card}><Text style={styles.emptyText}>{t('appointment_mgmt.no_appointments')}</Text></Card>
        ) : (
          appointments
            .filter((appointment: any) => appointment.type === 'appointment')
            .map((appointment: any) => (
              <Card key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientId}>
                      {appointment.patient ? formatPatientId(appointment.patient.id) : t('common.unknown')}
                    </Text>
                    <Text style={styles.patientName}>
                      {appointment.patient?.fullName || appointment.patient?.full_name || t('view_reports.unknown_patient')}
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.actionBtn, styles.editBtnStyle]} onPress={() => handleEditAppointment(appointment)}>
                      <Ionicons name="pencil" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtnStyle]} onPress={() => handleDeleteAppointment(appointment.id)}>
                      <Ionicons name="trash" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.appointmentContent}>
                  <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                  <View style={styles.appointmentDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{new Date(appointment.time).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{new Date(appointment.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </View>
                  <View style={styles.statusContainer}>
                    <Text style={[
                      styles.statusText,
                      appointment.status === 'ATTENDED' && { color: colors.success },
                      appointment.status === 'MISSED' && { color: colors.error },
                      appointment.status === 'PENDING' && { color: colors.warning },
                    ]}>
                      {t('appointment_mgmt.status_prefix')}: {t(`status_values.${appointment.status || (appointment.completed ? 'ATTENDED' : 'PENDING')}`, { defaultValue: appointment.status || 'PENDING' })}
                    </Text>
                    {appointment.status === 'PENDING' && new Date(appointment.time) < new Date() && (
                      <View style={styles.confirmActions}>
                        <TouchableOpacity style={[styles.confirmBtn, styles.attendBtn]} onPress={() => handleConfirmAttendance(appointment.id, 'ATTENDED')}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.white} />
                          <Text style={styles.confirmBtnText}>{t('appointment_mgmt.attended')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.confirmBtn, styles.missBtn]} onPress={() => handleConfirmAttendance(appointment.id, 'MISSED')}>
                          <Ionicons name="close-circle" size={14} color={colors.white} />
                          <Text style={styles.confirmBtnText}>{t('appointment_mgmt.missed')}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            ))
        )}
      </ScrollView>

      {/* Schedule Modal */}
      <Modal visible={showScheduleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('appointment_mgmt.schedule_title')}</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{t('appointment_mgmt.patient')}</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowPatientDropdown(!showPatientDropdown)}>
                  <Text style={styles.dropdownText}>{selectedPatientId ? selectedPatientLabel : t('appointment_mgmt.select_patient')}</Text>
                  <Ionicons name="chevron-down-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {showPatientDropdown && (
                  <View style={styles.dropdownOptions}>
                    {isPatientsLoading ? (
                      <Text style={styles.dropdownOptionText}>{t('appointment_mgmt.loading_patients')}</Text>
                    ) : patientOptions?.length ? (
                      patientOptions.map((patient: any) => (
                        <TouchableOpacity key={patient.id} style={styles.dropdownOption} onPress={() => { setSelectedPatientId(String(patient.id)); setShowPatientDropdown(false); }}>
                          <Text style={styles.dropdownOptionText}>{formatPatientId(patient.id)} - {patient.fullName || patient.full_name || patient.name}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.dropdownOptionText}>{t('appointment_mgmt.no_patients')}</Text>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{t('appointment_mgmt.date')}</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.pickerText}>{date.toLocaleDateString()}</Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{t('appointment_mgmt.time')}</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.pickerText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{t('appointment_mgmt.location')}</Text>
                <Input placeholder={t('appointment_mgmt.location_placeholder')} value={location} onChangeText={setLocation} />
              </View>
              <View style={styles.modalActions}>
                <View style={styles.cancelBtnWrapper}>
                  <Button variant="outline" size="md" onPress={() => setShowScheduleModal(false)} fullWidth>{t('appointment_mgmt.cancel')}</Button>
                </View>
                <View style={styles.scheduleBtnWrapper}>
                  <Button variant="primary" size="md" onPress={handleScheduleAppointment} loading={saveAppointmentMutation.isPending} fullWidth>{t('appointment_mgmt.schedule_btn')}</Button>
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
              <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={styles.modalButtonText}>{t('appointment_mgmt.cancel')}</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>{t('appointment_mgmt.select_date')}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={styles.modalButtonText}>{t('appointment_mgmt.done')}</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerList}>
              {dateOptions.map((item) => (
                <TouchableOpacity key={item.toISOString()} style={[styles.pickerItem, date.toDateString() === item.toDateString() && styles.pickerItemSelected]} onPress={() => { setDate(item); setShowDatePicker(false); }}>
                  <Text style={[styles.pickerItemText, date.toDateString() === item.toDateString() && styles.pickerItemTextSelected]}>
                    {item.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
              <TouchableOpacity onPress={() => setShowTimePicker(false)}><Text style={styles.modalButtonText}>{t('appointment_mgmt.cancel')}</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>{t('appointment_mgmt.select_time')}</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}><Text style={styles.modalButtonText}>{t('appointment_mgmt.done')}</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerList}>
              {timeOptions.map((item) => (
                <TouchableOpacity key={item.toISOString()} style={[styles.pickerItem, time.getHours() === item.getHours() && time.getMinutes() === item.getMinutes() && styles.pickerItemSelected]} onPress={() => { setTime(item); setShowTimePicker(false); }}>
                  <Text style={[styles.pickerItemText, time.getHours() === item.getHours() && time.getMinutes() === item.getMinutes() && styles.pickerItemTextSelected]}>
                    {item.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {statusMessage ? (
        <View style={styles.toast}><Text style={styles.toastText}>{statusMessage}</Text></View>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.backgroundSecondary, flex: 1 },
  headbar: { padding: spacing.md, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.primary, marginLeft: spacing.xs },
  addBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  card: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm },
  loadingText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  appointmentCard: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm, marginBottom: spacing.sm },
  appointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  patientInfo: { flex: 1 },
  patientId: { ...typography.captionBold, color: colors.primary, marginBottom: spacing.xs },
  patientName: { ...typography.bodyBold, color: colors.text },
  actionButtons: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: { width: 32, height: 32, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  editBtnStyle: { backgroundColor: colors.primaryLight },
  deleteBtnStyle: { backgroundColor: colors.errorLight },
  appointmentContent: { gap: spacing.xs },
  appointmentTitle: { ...typography.bodyBold, color: colors.text },
  appointmentDetails: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailText: { ...typography.caption, color: colors.textSecondary },
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  statusText: { ...typography.captionBold, color: colors.primary },
  confirmActions: { flexDirection: 'row', gap: spacing.xs },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  attendBtn: { backgroundColor: colors.success },
  missBtn: { backgroundColor: colors.error },
  confirmBtnText: { ...typography.tinyBold, color: colors.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.h3, color: colors.primaryDark },
  modalButtonText: { ...typography.body, color: colors.primary },
  modalBody: { padding: spacing.lg },
  fieldWrapper: { marginBottom: spacing.md },
  fieldLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.background },
  dropdownText: { ...typography.body, color: colors.text },
  dropdownOptions: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.background, maxHeight: 200, ...shadows.sm },
  dropdownOption: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownOptionText: { ...typography.body, color: colors.text },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.background },
  pickerText: { ...typography.body, color: colors.text },
  pickerList: { maxHeight: 300 },
  pickerItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerItemSelected: { backgroundColor: colors.primaryLight },
  pickerItemText: { ...typography.body, color: colors.text },
  pickerItemTextSelected: { color: colors.primary, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancelBtnWrapper: { flex: 1 },
  scheduleBtnWrapper: { flex: 1 },
  toast: { position: 'absolute', bottom: 32, left: spacing.md, right: spacing.md, backgroundColor: colors.primary, padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  toastText: { ...typography.captionBold, color: colors.white },
});
