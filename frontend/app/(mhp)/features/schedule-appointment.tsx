import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Container, Card, Input, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function ScheduleAppointment() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const getDateOptions = () => { const opts = []; const today = new Date(); for (let i = 0; i < 30; i++) { const d = new Date(today); d.setDate(today.getDate() + i); opts.push(d); } return opts; };
  const getTimeOptions = () => { const opts = []; for (let h = 8; h <= 18; h++) { for (let m = 0; m < 60; m += 30) { const t = new Date(); t.setHours(h, m, 0, 0); opts.push(t); } } return opts; };
  const dateOptions = getDateOptions();
  const timeOptions = getTimeOptions();

  const { data: patientOptions = [], isLoading: isPatientsLoading } = useQuery({
    queryKey: ['allPatients'],
    queryFn: async () => api.patients(),
    staleTime: 1000 * 30,
    enabled: !!authUser?.id,
  });

  const selectedPatient = patientOptions?.find((p: any) => String(p.id) === selectedPatientId);
  const selectedPatientLabel = selectedPatient?.fullName || selectedPatient?.full_name || selectedPatient?.name || t('schedule_appt.select_patient');

  const scheduleAppointment = () => {
    if (!selectedPatientId) { setStatusMessage(t('schedule_appt.select_patient_msg')); return; }
    const formattedDate = date.toISOString().split('T')[0];
    const formattedTime = time.toTimeString().split(' ')[0].substring(0, 5);
    if (!formattedDate || !formattedTime || !location) { setStatusMessage(t('schedule_appt.fill_fields_msg')); return; }
    setStatusMessage(t('schedule_appt.scheduled'));
    setTimeout(() => { setStatusMessage(''); router.back(); }, 900);
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
        <Text style={styles.title}>{t('schedule_appt.title')}</Text>
        <Text style={styles.subtitle}>{t('schedule_appt.subtitle')}</Text>
        <Card style={styles.card} variant="elevated">
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('schedule_appt.patient')}</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowPatientDropdown(!showPatientDropdown)}>
              <Text style={styles.dropdownText}>{selectedPatientId ? selectedPatientLabel : t('schedule_appt.select_patient')}</Text>
              <Ionicons name="chevron-down-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {showPatientDropdown && (
              <View style={styles.dropdownOptions}>
                {isPatientsLoading ? <Text style={styles.dropdownOptionText}>{t('schedule_appt.loading_patients')}</Text>
                  : patientOptions?.length ? patientOptions.map((patient: any) => (
                    <TouchableOpacity key={patient.id} style={styles.dropdownOption} onPress={() => { setSelectedPatientId(String(patient.id)); setShowPatientDropdown(false); }}>
                      <Text style={styles.dropdownOptionText}>{patient.fullName || patient.full_name || patient.name || formatPatientId(patient.id)}</Text>
                    </TouchableOpacity>
                  )) : <Text style={styles.dropdownOptionText}>{t('schedule_appt.no_patients')}</Text>}
              </View>
            )}
          </View>
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('schedule_appt.date')}</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.pickerText}>{date.toDateString()}</Text>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('schedule_appt.time')}</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.pickerText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('schedule_appt.location')}</Text>
            <Input placeholder={t('schedule_appt.location_placeholder')} value={location} onChangeText={setLocation} />
          </View>
          <Button variant="primary" size="lg" style={styles.button} onPress={scheduleAppointment}>{t('schedule_appt.schedule_btn')}</Button>
        </Card>

        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.modalOverlay}><View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={styles.modalButtonText}>{t('schedule_appt.cancel')}</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>{t('schedule_appt.select_date')}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={styles.modalButtonText}>{t('schedule_appt.done')}</Text></TouchableOpacity>
            </View>
            <FlatList data={dateOptions} keyExtractor={(item) => item.toISOString()} showsVerticalScrollIndicator={false} style={styles.pickerList}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.pickerItem, date.toDateString() === item.toDateString() && styles.pickerItemSelected]} onPress={() => { setDate(item); setShowDatePicker(false); }}>
                  <Text style={[styles.pickerItemText, date.toDateString() === item.toDateString() && styles.pickerItemTextSelected]}>{item.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                </TouchableOpacity>
              )} />
          </View></View>
        </Modal>

        <Modal visible={showTimePicker} transparent animationType="slide">
          <View style={styles.modalOverlay}><View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}><Text style={styles.modalButtonText}>{t('schedule_appt.cancel')}</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>{t('schedule_appt.select_time')}</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}><Text style={styles.modalButtonText}>{t('schedule_appt.done')}</Text></TouchableOpacity>
            </View>
            <FlatList data={timeOptions} keyExtractor={(item) => item.toISOString()} showsVerticalScrollIndicator={false} style={styles.pickerList}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.pickerItem, time.getHours() === item.getHours() && time.getMinutes() === item.getMinutes() && styles.pickerItemSelected]} onPress={() => { setTime(item); setShowTimePicker(false); }}>
                  <Text style={[styles.pickerItemText, time.getHours() === item.getHours() && time.getMinutes() === item.getMinutes() && styles.pickerItemTextSelected]}>{item.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
              )} />
          </View></View>
        </Modal>

        {statusMessage ? <View style={styles.toast}><Text style={styles.toastText}>{statusMessage}</Text></View> : null}
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
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.background },
  dropdownText: { ...typography.body, color: colors.text },
  dropdownOptions: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.background, overflow: 'hidden' },
  dropdownOption: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownOptionText: { ...typography.body, color: colors.text },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.background },
  pickerText: { ...typography.body, color: colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, paddingBottom: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.bodyBold, color: colors.text },
  modalButtonText: { ...typography.body, color: colors.primary },
  pickerList: { maxHeight: 300 },
  pickerItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerItemSelected: { backgroundColor: colors.primaryLight },
  pickerItemText: { ...typography.body, color: colors.text },
  pickerItemTextSelected: { color: colors.primary, fontWeight: 'bold' },
  button: { marginTop: spacing.md },
  toast: { position: 'absolute', bottom: 32, left: spacing.md, right: spacing.md, backgroundColor: colors.primary, padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  toastText: { ...typography.captionBold, color: colors.white },
});
