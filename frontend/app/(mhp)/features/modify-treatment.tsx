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

export default function ModifyTreatment() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientDrop, setShowPatientDrop]     = useState(false);
  const [currentPlan, setCurrentPlan]             = useState('');
  const [newPlan, setNewPlan]                     = useState('');
  const [notes, setNotes]                         = useState('');
  const [toast, setToast]                         = useState('');
  const [toastOk, setToastOk]                     = useState(true);

  const showToast = (msg: string, ok = true) => { setToast(msg); setToastOk(ok); setTimeout(() => setToast(''), 2500); };

  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['allPatients'],
    queryFn: () => api.patients(),
    staleTime: 1000 * 30,
    enabled: !!authUser?.id,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.createTreatmentChange(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatmentChanges'] });
      showToast(t('modify_treatment.updated'));
      setTimeout(() => router.back(), 1200);
    },
    onError: (e: any) => showToast(e?.message || 'Failed to update treatment', false),
  });

  const selectedPatient = (patients as any[]).find(p => String(p.id) === selectedPatientId);

  const handleUpdate = () => {
    if (!selectedPatientId) { showToast(t('modify_treatment.select_patient_msg'), false); return; }
    if (!newPlan.trim())    { showToast('Please enter the new treatment plan.', false); return; }
    saveMutation.mutate({
      patientId: parseInt(selectedPatientId),
      change: newPlan.trim(),
      changedBy: authUser?.fullName || authUser?.full_name || t('status_values.MHP'),
    });
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#4C1D95', '#8B5CF6']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('modify_treatment.title')}</Text>
          <Text style={S.headerSub}>{t('modify_treatment.subtitle')}</Text>
        </View>
        <View style={S.headerIcon}>
          <Ionicons name="flask" size={20} color="rgba(255,255,255,0.6)" />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Patient selector */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={S.cardIconWrap}><Ionicons name="person-outline" size={15} color="#8B5CF6" /></View>
            <Text style={S.cardTitle}>{t('appointment_mgmt.patient')}</Text>
          </View>
          <View style={S.fieldWrap}>
            <TouchableOpacity style={S.dropdown} onPress={() => setShowPatientDrop(!showPatientDrop)}>
              {selectedPatient ? (
                <View style={S.selectedPatient}>
                  <LinearGradient colors={['#8B5CF6CC', '#8B5CF6']} style={S.selectedAvatar}>
                    <Text style={S.selectedAvatarText}>{(selectedPatient.fullName || '?').charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <View>
                    <Text style={S.selectedName}>{selectedPatient.fullName}</Text>
                    <Text style={S.selectedId}>{formatPatientId(selectedPatient.id)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={S.dropdownPlaceholder}>{t('appointment_mgmt.select_patient')}</Text>
              )}
              <Ionicons name={showPatientDrop ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
            </TouchableOpacity>
            {showPatientDrop && (
              <View style={S.dropList}>
                {loadingPatients ? (
                  <View style={S.dropLoading}><ActivityIndicator size="small" color="#8B5CF6" /></View>
                ) : (patients as any[]).length === 0 ? (
                  <Text style={S.dropEmpty}>{t('appointment_mgmt.no_patients')}</Text>
                ) : (
                  (patients as any[]).map(p => (
                    <TouchableOpacity key={p.id} style={S.dropItem} onPress={() => { setSelectedPatientId(String(p.id)); setShowPatientDrop(false); }}>
                      <LinearGradient colors={['#8B5CF6CC', '#8B5CF6']} style={S.dropAvatar}>
                        <Text style={S.dropAvatarText}>{(p.fullName || '?').charAt(0).toUpperCase()}</Text>
                      </LinearGradient>
                      <View style={S.dropItemInfo}>
                        <Text style={S.dropItemName}>{p.fullName}</Text>
                        <Text style={S.dropItemId}>{formatPatientId(p.id)}</Text>
                      </View>
                      {String(selectedPatientId) === String(p.id) && (
                        <Ionicons name="checkmark-circle" size={18} color="#8B5CF6" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        </View>

        {/* Treatment details */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={S.cardIconWrap}><Ionicons name="flask-outline" size={15} color="#8B5CF6" /></View>
            <Text style={S.cardTitle}>Treatment Details</Text>
          </View>

          <View style={S.fieldWrap}>
            <Text style={S.fieldLabel}>{t('modify_treatment.current_treatment')}</Text>
            <Input
              placeholder={t('modify_treatment.current_placeholder')}
              value={currentPlan}
              onChangeText={setCurrentPlan}
              multiline
              style={{ height: 80 }}
            />
          </View>

          {/* Arrow indicator */}
          <View style={S.arrowRow}>
            <View style={S.arrowLine} />
            <View style={S.arrowCircle}>
              <Ionicons name="arrow-down" size={16} color="#8B5CF6" />
            </View>
            <View style={S.arrowLine} />
          </View>

          <View style={S.fieldWrap}>
            <Text style={S.fieldLabel}>{t('modify_treatment.new_treatment')} <Text style={{ color: '#EF4444' }}>*</Text></Text>
            <Input
              placeholder={t('modify_treatment.new_placeholder')}
              value={newPlan}
              onChangeText={setNewPlan}
              multiline
              style={{ height: 80 }}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={S.cardIconWrap}><Ionicons name="document-text-outline" size={15} color="#8B5CF6" /></View>
            <Text style={S.cardTitle}>{t('modify_treatment.notes')}</Text>
          </View>
          <View style={S.fieldWrap}>
            <Input
              placeholder={t('modify_treatment.notes_placeholder')}
              value={notes}
              onChangeText={setNotes}
              multiline
              style={{ height: 90 }}
            />
          </View>
        </View>

        {/* Summary */}
        {selectedPatient && newPlan.trim() && (
          <View style={S.summaryCard}>
            <View style={S.summaryHeader}>
              <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
              <Text style={[S.summaryTitle, { color: '#8B5CF6' }]}>Change Summary</Text>
            </View>
            <View style={S.summaryRow}><Ionicons name="person-outline" size={13} color="#94A3B8" /><Text style={S.summaryText}>{selectedPatient.fullName}</Text></View>
            <View style={S.summaryRow}><Ionicons name="flask-outline" size={13} color="#94A3B8" /><Text style={S.summaryText} numberOfLines={2}>{newPlan}</Text></View>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[S.submitBtn, saveMutation.isPending && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={saveMutation.isPending}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#4C1D95', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.submitGrad}>
            {saveMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Ionicons name="flask-outline" size={18} color="#fff" /><Text style={S.submitText}>{t('modify_treatment.update_btn')}</Text></>
            }
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

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
  cardIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  fieldWrap: { padding: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
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
  arrowRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginVertical: 4 },
  arrowLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  arrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  summaryCard: { backgroundColor: '#F5F3FF', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#DDD6FE', gap: 8 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  summaryTitle: { fontSize: 13, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  summaryText: { fontSize: 13, color: '#1E293B', flex: 1 },
  submitBtn: { borderRadius: 16, overflow: 'hidden' },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1E293B', borderRadius: 14, padding: 14 },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff', flex: 1 },
});
