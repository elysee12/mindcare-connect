import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Input } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function TreatmentManagement() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showModal, setShowModal]             = useState(false);
  const [selectedPId, setSelectedPId]         = useState('');
  const [showPatientDrop, setShowPatientDrop] = useState(false);
  const [change, setChange]                   = useState('');
  const [toast, setToast]                     = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const { data: treatments = [], isLoading } = useQuery({
    queryKey: ['treatmentChanges'],
    queryFn: () => api.treatmentChanges(),
    staleTime: 1000 * 30,
  });
  const { data: patients = [] } = useQuery({
    queryKey: ['allPatients'],
    queryFn: () => api.patients(),
    staleTime: 1000 * 30,
    enabled: !!authUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createTreatmentChange(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatmentChanges'] });
      setShowModal(false); setSelectedPId(''); setChange('');
      showToast(t('treatment_mgmt.added'));
    },
    onError: () => showToast(t('treatment_mgmt.add_failed')),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteTreatmentChange(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['treatmentChanges'] }); showToast(t('treatment_mgmt.deleted')); },
    onError: () => showToast(t('treatment_mgmt.delete_failed')),
  });

  const selectedPatient = (patients as any[]).find(p => String(p.id) === selectedPId);

  const handleSave = () => {
    if (!selectedPId || !change.trim()) { showToast(t('treatment_mgmt.validation_msg')); return; }
    createMutation.mutate({
      patientId: parseInt(selectedPId),
      change: change.trim(),
      changedBy: authUser?.fullName || authUser?.full_name || t('status_values.MHP'),
    });
  };

  const handleDelete = (id: number) => Alert.alert(
    t('treatment_mgmt.delete_title'), t('treatment_mgmt.delete_confirm'),
    [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(id) }]
  );

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <LinearGradient colors={['#7C3AED', '#A78BFA']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('treatment_mgmt.title')}</Text>
          <Text style={S.headerSub}>{(treatments as any[]).length} record{(treatments as any[]).length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#7C3AED" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={S.centered}><ActivityIndicator size="large" color="#7C3AED" /></View>
        ) : (treatments as any[]).length === 0 ? (
          <View style={S.empty}>
            <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={S.emptyIcon}>
              <Ionicons name="flask-outline" size={44} color="#7C3AED" />
            </LinearGradient>
            <Text style={S.emptyTitle}>{t('treatment_mgmt.no_treatments')}</Text>
            <Text style={S.emptySub}>Tap + to add a treatment change</Text>
          </View>
        ) : (
          (treatments as any[]).map((tr: any) => (
            <View key={tr.id} style={S.card}>
              <View style={[S.cardBar, { backgroundColor: '#7C3AED' }]} />
              <View style={S.cardBody}>
                <View style={S.cardTop}>
                  <LinearGradient colors={['#7C3AEDCC', '#7C3AED']} style={S.avatar}>
                    <Text style={S.avatarLetter}>{(tr.patient?.fullName || '?').charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={S.cardMid}>
                    <Text style={S.cardName} numberOfLines={1}>{tr.patient?.fullName || t('view_reports.unknown_patient')}</Text>
                    <Text style={S.cardId}>{tr.patient ? formatPatientId(tr.patient.id) : ''}</Text>
                  </View>
                  <TouchableOpacity style={[S.iconBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleDelete(tr.id)}>
                    <Ionicons name="trash" size={15} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={S.changeBox}>
                  <Text style={S.changeText}>{tr.change}</Text>
                </View>

                <View style={S.metaRow}>
                  <View style={S.metaItem}>
                    <Ionicons name="person-outline" size={12} color="#94A3B8" />
                    <Text style={S.metaText}>{tr.changedBy || t('status_values.MHP')}</Text>
                  </View>
                  <View style={S.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                    <Text style={S.metaText}>{new Date(tr.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={S.overlay}>
          <View style={S.sheet}>
            <View style={S.sheetHandle} />
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{t('treatment_mgmt.add_title')}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={22} color="#64748B" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={S.sheetBody} keyboardShouldPersistTaps="handled">
              <Text style={S.fieldLabel}>{t('treatment_mgmt.patient')}</Text>
              <TouchableOpacity style={S.dropdown} onPress={() => setShowPatientDrop(!showPatientDrop)}>
                <Text style={[S.dropdownText, !selectedPId && { color: '#94A3B8' }]}>
                  {selectedPatient ? `${formatPatientId(selectedPatient.id)} – ${selectedPatient.fullName}` : t('treatment_mgmt.select_patient')}
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

              <Text style={[S.fieldLabel, { marginTop: 16 }]}>{t('treatment_mgmt.treatment_details')}</Text>
              <Input
                placeholder={t('treatment_mgmt.treatment_placeholder')}
                value={change} onChangeText={setChange}
                multiline style={{ height: 110 }}
              />

              <View style={S.modalBtns}>
                <TouchableOpacity style={S.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={S.cancelBtnText}>{t('treatment_mgmt.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.saveBtn, { backgroundColor: '#7C3AED' }]} onPress={handleSave}>
                  {createMutation.isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={S.saveBtnText}>{t('treatment_mgmt.add_btn')}</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {toast ? <View style={S.toast}><Text style={S.toastText}>{toast}</Text></View> : null}
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
  iconBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  changeBox: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#7C3AED' },
  changeText: { fontSize: 13, color: '#1E293B', lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#94A3B8' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
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
  saveBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, alignItems: 'center' },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
