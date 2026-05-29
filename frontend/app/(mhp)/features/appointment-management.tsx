import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Input, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

const STATUS_META: Record<string, { color: string; bg: string; icon: any }> = {
  ATTENDED: { color: '#2EB67D', bg: '#EAF7F3', icon: 'checkmark-circle' },
  MISSED:   { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle' },
  PENDING:  { color: '#F59E0B', bg: '#FEF3C7', icon: 'time' },
};

export default function AppointmentManagement() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showModal, setShowModal]               = useState(false);
  const [selectedPatientId, setSelectedPId]     = useState('');
  const [showPatientDrop, setShowPatientDrop]   = useState(false);
  const [date, setDate]                         = useState(new Date());
  const [time, setTime]                         = useState(new Date());
  const [showDatePicker, setShowDatePicker]     = useState(false);
  const [showTimePicker, setShowTimePicker]     = useState(false);
  const [location, setLocation]                 = useState('');
  const [editingAppt, setEditingAppt]           = useState<any>(null);
  const [toast, setToast]                       = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d;
  });
  const timeOptions = Array.from({ length: 22 }, (_, i) => {
    const t = new Date(); t.setHours(8 + Math.floor(i / 2), (i % 2) * 30, 0, 0); return t;
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => api.reminders(),
    staleTime: 1000 * 30,
  });
  const { data: patients = [] } = useQuery({
    queryKey: ['allPatients'],
    queryFn: () => api.patients(),
    staleTime: 1000 * 30,
    enabled: !!authUser?.id,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const { id, ...payload } = data;
      return id ? api.updateReminder(id, payload) : api.createReminder(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowModal(false); resetForm();
      showToast(editingAppt ? t('appointment_mgmt.updated') : t('appointment_mgmt.saved'));
      setEditingAppt(null);
    },
    onError: () => showToast(t('appointment_mgmt.op_failed')),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteReminder(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reminders'] }); showToast(t('appointment_mgmt.deleted')); },
    onError: () => showToast(t('appointment_mgmt.delete_failed')),
  });

  const resetForm = () => { setSelectedPId(''); setLocation(''); setDate(new Date()); setTime(new Date()); setEditingAppt(null); };

  const selectedPatient = patients?.find((p: any) => String(p.id) === selectedPatientId);

  const handleSave = () => {
    if (!selectedPatientId || !location.trim()) { showToast(t('appointment_mgmt.validation_msg')); return; }
    const d = date.toISOString().split('T')[0];
    const tm = time.toTimeString().substring(0, 5);
    saveMutation.mutate({
      ...(editingAppt ? { id: editingAppt.id } : {}),
      patientId: parseInt(selectedPatientId),
      type: 'appointment',
      title: `Appointment with ${selectedPatient?.fullName || 'Patient'}`,
      time: `${d} ${tm}`,
      completed: false,
    });
  };

  const handleEdit = (a: any) => {
    setEditingAppt(a);
    setSelectedPId(a.patientId?.toString() || a.patient?.id?.toString() || '');
    setLocation(a.title?.split(' with ')[1] || '');
    const dt = new Date(a.time); setDate(dt); setTime(dt);
    setShowModal(true);
  };

  const handleDelete = (id: number) => Alert.alert(
    t('appointment_mgmt.delete_title'), t('appointment_mgmt.delete_confirm'),
    [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(id) }]
  );

  const handleStatus = (id: number, status: 'ATTENDED' | 'MISSED') =>
    saveMutation.mutate({ id, status, completed: status === 'ATTENDED' });

  const appts = (appointments as any[]).filter(a => a.type === 'appointment');

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#1a6b4a', '#2EB67D']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('appointment_mgmt.title')}</Text>
          <Text style={S.headerSub}>{appts.length} appointment{appts.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={() => { resetForm(); setShowModal(true); }}>
          <Ionicons name="add" size={22} color="#2EB67D" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={S.centered}><ActivityIndicator size="large" color="#2EB67D" /></View>
        ) : appts.length === 0 ? (
          <View style={S.empty}>
            <LinearGradient colors={['#EAF7F3', '#D1FAE5']} style={S.emptyIcon}>
              <Ionicons name="calendar-outline" size={44} color="#2EB67D" />
            </LinearGradient>
            <Text style={S.emptyTitle}>{t('appointment_mgmt.no_appointments')}</Text>
            <Text style={S.emptySub}>Tap + to schedule one</Text>
          </View>
        ) : (
          appts.map((a: any) => {
            const sm = STATUS_META[a.status || 'PENDING'] || STATUS_META.PENDING;
            const isPast = new Date(a.time) < new Date();
            return (
              <View key={a.id} style={S.card}>
                <View style={[S.cardBar, { backgroundColor: sm.color }]} />
                <View style={S.cardBody}>
                  <View style={S.cardTop}>
                    <LinearGradient colors={['#2EB67DCC', '#2EB67D']} style={S.avatar}>
                      <Text style={S.avatarLetter}>{(a.patient?.fullName || '?').charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                    <View style={S.cardMid}>
                      <Text style={S.cardName} numberOfLines={1}>{a.patient?.fullName || t('view_reports.unknown_patient')}</Text>
                      <Text style={S.cardId}>{a.patient ? formatPatientId(a.patient.id) : ''}</Text>
                    </View>
                    <View style={S.cardActions}>
                      <TouchableOpacity style={S.iconBtn} onPress={() => handleEdit(a)}>
                        <Ionicons name="pencil" size={15} color="#2EB67D" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[S.iconBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleDelete(a.id)}>
                        <Ionicons name="trash" size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={S.cardTitle}>{a.title}</Text>

                  <View style={S.metaRow}>
                    <View style={S.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
                      <Text style={S.metaText}>{new Date(a.time).toLocaleDateString()}</Text>
                    </View>
                    <View style={S.metaItem}>
                      <Ionicons name="time-outline" size={13} color="#94A3B8" />
                      <Text style={S.metaText}>{new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View style={[S.statusPill, { backgroundColor: sm.bg }]}>
                      <Ionicons name={sm.icon} size={11} color={sm.color} />
                      <Text style={[S.statusText, { color: sm.color }]}>
                        {t(`status_values.${a.status || 'PENDING'}`, { defaultValue: a.status || 'PENDING' })}
                      </Text>
                    </View>
                  </View>

                  {(a.status === 'PENDING' || !a.status) && isPast && (
                    <View style={S.confirmRow}>
                      <TouchableOpacity style={S.attendBtn} onPress={() => handleStatus(a.id, 'ATTENDED')}>
                        <Ionicons name="checkmark-circle" size={14} color="#fff" />
                        <Text style={S.confirmText}>{t('appointment_mgmt.attended')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={S.missBtn} onPress={() => handleStatus(a.id, 'MISSED')}>
                        <Ionicons name="close-circle" size={14} color="#fff" />
                        <Text style={S.confirmText}>{t('appointment_mgmt.missed')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Schedule modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={S.overlay}>
          <View style={S.sheet}>
            <View style={S.sheetHandle} />
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{editingAppt ? t('appointment_mgmt.edit_title') || 'Edit Appointment' : t('appointment_mgmt.schedule_title')}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={22} color="#64748B" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={S.sheetBody} keyboardShouldPersistTaps="handled">
              {/* Patient picker */}
              <Text style={S.fieldLabel}>{t('appointment_mgmt.patient')}</Text>
              <TouchableOpacity style={S.dropdown} onPress={() => setShowPatientDrop(!showPatientDrop)}>
                <Text style={[S.dropdownText, !selectedPatientId && { color: '#94A3B8' }]}>
                  {selectedPatient ? `${formatPatientId(selectedPatient.id)} – ${selectedPatient.fullName}` : t('appointment_mgmt.select_patient')}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </TouchableOpacity>
              {showPatientDrop && (
                <View style={S.dropList}>
                  {(patients as any[]).map((p: any) => (
                    <TouchableOpacity key={p.id} style={S.dropItem} onPress={() => { setSelectedPId(String(p.id)); setShowPatientDrop(false); }}>
                      <Text style={S.dropItemText}>{formatPatientId(p.id)} – {p.fullName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Date */}
              <Text style={[S.fieldLabel, { marginTop: 16 }]}>{t('appointment_mgmt.date')}</Text>
              <TouchableOpacity style={S.dropdown} onPress={() => setShowDatePicker(true)}>
                <Text style={S.dropdownText}>{date.toLocaleDateString()}</Text>
                <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Time */}
              <Text style={[S.fieldLabel, { marginTop: 16 }]}>{t('appointment_mgmt.time')}</Text>
              <TouchableOpacity style={S.dropdown} onPress={() => setShowTimePicker(true)}>
                <Text style={S.dropdownText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                <Ionicons name="time-outline" size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Location */}
              <Text style={[S.fieldLabel, { marginTop: 16 }]}>{t('appointment_mgmt.location')}</Text>
              <Input placeholder={t('appointment_mgmt.location_placeholder')} value={location} onChangeText={setLocation} />

              <View style={S.modalBtns}>
                <TouchableOpacity style={S.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={S.cancelBtnText}>{t('appointment_mgmt.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={S.saveBtn} onPress={handleSave}>
                  {saveMutation.isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={S.saveBtnText}>{editingAppt ? t('appointment_mgmt.update_btn') || 'Update' : t('appointment_mgmt.schedule_btn')}</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date picker modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={S.overlay}>
          <View style={S.pickerSheet}>
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{t('appointment_mgmt.select_date')}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: '#2EB67D', fontWeight: '700' }}>{t('appointment_mgmt.done')}</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {dateOptions.map(d => (
                <TouchableOpacity key={d.toISOString()} style={[S.pickerItem, date.toDateString() === d.toDateString() && S.pickerItemActive]}
                  onPress={() => { setDate(d); setShowDatePicker(false); }}>
                  <Text style={[S.pickerItemText, date.toDateString() === d.toDateString() && { color: '#2EB67D', fontWeight: '700' }]}>
                    {d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time picker modal */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={S.overlay}>
          <View style={S.pickerSheet}>
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{t('appointment_mgmt.select_time')}</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}><Text style={{ color: '#2EB67D', fontWeight: '700' }}>{t('appointment_mgmt.done')}</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {timeOptions.map(tm => (
                <TouchableOpacity key={tm.toISOString()} style={[S.pickerItem, time.getHours() === tm.getHours() && time.getMinutes() === tm.getMinutes() && S.pickerItemActive]}
                  onPress={() => { setTime(tm); setShowTimePicker(false); }}>
                  <Text style={[S.pickerItemText, time.getHours() === tm.getHours() && time.getMinutes() === tm.getMinutes() && { color: '#2EB67D', fontWeight: '700' }]}>
                    {tm.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {toast ? (
        <View style={S.toast}><Text style={S.toastText}>{toast}</Text></View>
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
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 80 },
  centered: { alignItems: 'center', paddingVertical: 60 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  cardBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cardMid: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  cardId: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  cardActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EAF7F3', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 13, color: '#64748B' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#94A3B8' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  confirmRow: { flexDirection: 'row', gap: 8 },
  attendBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#2EB67D', borderRadius: 10, paddingVertical: 8 },
  missBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 8 },
  confirmText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  sheetBody: { padding: 20, paddingBottom: 40 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  dropdownText: { fontSize: 14, color: '#1E293B', flex: 1 },
  dropList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4, maxHeight: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  dropItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropItemText: { fontSize: 14, color: '#1E293B' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  saveBtn: { flex: 1, backgroundColor: '#2EB67D', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  pickerItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerItemActive: { backgroundColor: '#EAF7F3' },
  pickerItemText: { fontSize: 14, color: '#1E293B' },
  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
