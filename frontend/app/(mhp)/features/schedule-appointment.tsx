import React, { useState } from 'react';
import {
  View, StyleSheet, Text, ScrollView, TouchableOpacity,
  Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Input } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function ScheduleAppointment() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientDrop, setShowPatientDrop]     = useState(false);
  const [date, setDate]                           = useState(new Date());
  const [time, setTime]                           = useState(new Date());
  const [showDatePicker, setShowDatePicker]       = useState(false);
  const [showTimePicker, setShowTimePicker]       = useState(false);
  const [location, setLocation]                   = useState('');
  const [toast, setToast]                         = useState('');
  const [toastOk, setToastOk]                     = useState(true);

  const showToast = (msg: string, ok = true) => { setToast(msg); setToastOk(ok); setTimeout(() => setToast(''), 2500); };

  const dateOptions = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  const timeOptions = Array.from({ length: 22 }, (_, i) => { const t = new Date(); t.setHours(8 + Math.floor(i / 2), (i % 2) * 30, 0, 0); return t; });

  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['allPatients'],
    queryFn: () => api.patients(),
    staleTime: 1000 * 30,
    enabled: !!authUser?.id,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.createReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      showToast(t('schedule_appt.scheduled'));
      setTimeout(() => router.back(), 1200);
    },
    onError: (e: any) => showToast(e?.message || 'Failed to schedule', false),
  });

  const selectedPatient = (patients as any[]).find(p => String(p.id) === selectedPatientId);

  const handleSchedule = () => {
    if (!selectedPatientId) { showToast(t('schedule_appt.select_patient_msg'), false); return; }
    if (!location.trim())   { showToast(t('schedule_appt.fill_fields_msg'), false); return; }
    const d = date.toISOString().split('T')[0];
    const tm = time.toTimeString().substring(0, 5);
    saveMutation.mutate({
      patientId: parseInt(selectedPatientId),
      type: 'appointment',
      title: `Appointment with ${selectedPatient?.fullName || 'Patient'} at ${location}`,
      time: `${d} ${tm}`,
      completed: false,
    });
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#1a6b4a', '#2EB67D']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('schedule_appt.title')}</Text>
          <Text style={S.headerSub}>{t('schedule_appt.subtitle')}</Text>
        </View>
        <View style={S.headerIcon}>
          <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.6)" />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Patient selector */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={S.cardIconWrap}><Ionicons name="person-outline" size={15} color="#2EB67D" /></View>
            <Text style={S.cardTitle}>{t('schedule_appt.patient')}</Text>
          </View>
          <View style={S.fieldWrap}>
            <TouchableOpacity style={S.dropdown} onPress={() => setShowPatientDrop(!showPatientDrop)}>
              {selectedPatient ? (
                <View style={S.selectedPatient}>
                  <LinearGradient colors={['#2EB67DCC', '#2EB67D']} style={S.selectedAvatar}>
                    <Text style={S.selectedAvatarText}>{(selectedPatient.fullName || '?').charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <View>
                    <Text style={S.selectedName}>{selectedPatient.fullName}</Text>
                    <Text style={S.selectedId}>{formatPatientId(selectedPatient.id)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={S.dropdownPlaceholder}>{t('schedule_appt.select_patient')}</Text>
              )}
              <Ionicons name={showPatientDrop ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
            </TouchableOpacity>
            {showPatientDrop && (
              <View style={S.dropList}>
                {loadingPatients ? (
                  <View style={S.dropLoading}><ActivityIndicator size="small" color="#2EB67D" /></View>
                ) : (patients as any[]).length === 0 ? (
                  <Text style={S.dropEmpty}>{t('schedule_appt.no_patients')}</Text>
                ) : (
                  (patients as any[]).map(p => (
                    <TouchableOpacity key={p.id} style={S.dropItem} onPress={() => { setSelectedPatientId(String(p.id)); setShowPatientDrop(false); }}>
                      <LinearGradient colors={['#2EB67DCC', '#2EB67D']} style={S.dropAvatar}>
                        <Text style={S.dropAvatarText}>{(p.fullName || '?').charAt(0).toUpperCase()}</Text>
                      </LinearGradient>
                      <View style={S.dropItemInfo}>
                        <Text style={S.dropItemName}>{p.fullName}</Text>
                        <Text style={S.dropItemId}>{formatPatientId(p.id)}</Text>
                      </View>
                      {String(selectedPatientId) === String(p.id) && (
                        <Ionicons name="checkmark-circle" size={18} color="#2EB67D" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        </View>

        {/* Date & Time */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={S.cardIconWrap}><Ionicons name="calendar-outline" size={15} color="#2EB67D" /></View>
            <Text style={S.cardTitle}>Date & Time</Text>
          </View>
          <View style={S.dateTimeRow}>
            <TouchableOpacity style={S.dateTimeBtn} onPress={() => setShowDatePicker(true)}>
              <View style={S.dateTimeBtnIcon}><Ionicons name="calendar-outline" size={18} color="#2EB67D" /></View>
              <View>
                <Text style={S.dateTimeBtnLabel}>{t('schedule_appt.date')}</Text>
                <Text style={S.dateTimeBtnValue}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={S.dateTimeBtn} onPress={() => setShowTimePicker(true)}>
              <View style={S.dateTimeBtnIcon}><Ionicons name="time-outline" size={18} color="#2EB67D" /></View>
              <View>
                <Text style={S.dateTimeBtnLabel}>{t('schedule_appt.time')}</Text>
                <Text style={S.dateTimeBtnValue}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={S.cardIconWrap}><Ionicons name="location-outline" size={15} color="#2EB67D" /></View>
            <Text style={S.cardTitle}>{t('schedule_appt.location')}</Text>
          </View>
          <View style={S.fieldWrap}>
            <Input placeholder={t('schedule_appt.location_placeholder')} value={location} onChangeText={setLocation} />
          </View>
        </View>

        {/* Summary preview */}
        {selectedPatient && location.trim() && (
          <View style={S.summaryCard}>
            <View style={S.summaryHeader}>
              <Ionicons name="checkmark-circle" size={16} color="#2EB67D" />
              <Text style={S.summaryTitle}>Appointment Summary</Text>
            </View>
            <View style={S.summaryRow}><Ionicons name="person-outline" size={13} color="#94A3B8" /><Text style={S.summaryText}>{selectedPatient.fullName}</Text></View>
            <View style={S.summaryRow}><Ionicons name="calendar-outline" size={13} color="#94A3B8" /><Text style={S.summaryText}>{date.toLocaleDateString()} at {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>
            <View style={S.summaryRow}><Ionicons name="location-outline" size={13} color="#94A3B8" /><Text style={S.summaryText}>{location}</Text></View>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[S.submitBtn, saveMutation.isPending && { opacity: 0.7 }]}
          onPress={handleSchedule}
          disabled={saveMutation.isPending}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#1a6b4a', '#2EB67D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.submitGrad}>
            {saveMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Ionicons name="calendar-outline" size={18} color="#fff" /><Text style={S.submitText}>{t('schedule_appt.schedule_btn')}</Text></>
            }
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* Date picker sheet */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={S.overlay}>
          <View style={S.sheet}>
            <View style={S.sheetHandle} />
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{t('schedule_appt.select_date')}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={S.sheetDone}>{t('schedule_appt.done')}</Text></TouchableOpacity>
            </View>
            <FlatList
              data={dateOptions}
              keyExtractor={item => item.toISOString()}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const active = date.toDateString() === item.toDateString();
                return (
                  <TouchableOpacity style={[S.pickerItem, active && S.pickerItemActive]} onPress={() => { setDate(item); setShowDatePicker(false); }}>
                    <Text style={[S.pickerItemText, active && S.pickerItemTextActive]}>
                      {item.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                    {active && <Ionicons name="checkmark-circle" size={18} color="#2EB67D" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Time picker sheet */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={S.overlay}>
          <View style={S.sheet}>
            <View style={S.sheetHandle} />
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{t('schedule_appt.select_time')}</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}><Text style={S.sheetDone}>{t('schedule_appt.done')}</Text></TouchableOpacity>
            </View>
            <FlatList
              data={timeOptions}
              keyExtractor={item => item.toISOString()}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const active = time.getHours() === item.getHours() && time.getMinutes() === item.getMinutes();
                return (
                  <TouchableOpacity style={[S.pickerItem, active && S.pickerItemActive]} onPress={() => { setTime(item); setShowTimePicker(false); }}>
                    <Text style={[S.pickerItemText, active && S.pickerItemTextActive]}>
                      {item.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {active && <Ionicons name="checkmark-circle" size={18} color="#2EB67D" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {toast ? (
        <View style={[S.toast, !toastOk && { backgroundColor: '#EF4444' }]}>
          <Ionicons name={toastOk ? 'checkmark-circle' : 'alert-circle'} size={16} color="#fff" />
          <Text style={S.toastText}>{toast}</Text>
        </View>
      ) : null}
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  cardIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EAF7F3', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  fieldWrap: { padding: 14 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  dropdownPlaceholder: { fontSize: 14, color: '#94A3B8', flex: 1 },
  selectedPatient: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  selectedAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  selectedAvatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  selectedName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  selectedId: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  dropList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 6, maxHeight: 220, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  dropLoading: { padding: 20, alignItems: 'center' },
  dropEmpty: { padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  dropItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  dropAvatar: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  dropAvatarText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  dropItemInfo: { flex: 1 },
  dropItemName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  dropItemId: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  dateTimeRow: { flexDirection: 'row', gap: 10, padding: 14 },
  dateTimeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  dateTimeBtnIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EAF7F3', justifyContent: 'center', alignItems: 'center' },
  dateTimeBtnLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  dateTimeBtnValue: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  summaryCard: { backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#BBF7D0', gap: 8 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#2EB67D' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { fontSize: 13, color: '#1E293B' },
  submitBtn: { borderRadius: 16, overflow: 'hidden' },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  sheetDone: { fontSize: 14, fontWeight: '700', color: '#2EB67D' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  pickerItemActive: { backgroundColor: '#EAF7F3' },
  pickerItemText: { fontSize: 14, color: '#1E293B' },
  pickerItemTextActive: { color: '#2EB67D', fontWeight: '700' },
  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1E293B', borderRadius: 14, padding: 14 },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff', flex: 1 },
});
