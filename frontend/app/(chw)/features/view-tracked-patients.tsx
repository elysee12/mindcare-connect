import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function ViewTrackedPatients() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selPatient, setSelPatient]     = useState<any>(null);
  const [location, setLocation]         = useState('');
  const [details, setDetails]           = useState('');
  const [showModal, setShowModal]       = useState(false);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['trackedPatients'],
    queryFn: () => api.trackedPatients(),
    staleTime: 1000 * 60,
  });

  const foundMutation = useMutation({
    mutationFn: ({ id, loc, det }: { id: number; loc: string; det?: string }) =>
      api.markPatientAsFound(id, loc, det),
    onSuccess: () => {
      Alert.alert(t('common.success'), 'Patient marked as found and removed from tracking.');
      setShowModal(false); setLocation(''); setDetails('');
      queryClient.invalidateQueries({ queryKey: ['trackedPatients'] });
    },
    onError: (e: any) => Alert.alert(t('common.error'), e.message),
  });

  const handleFound = (p: any) => { setSelPatient(p); setShowModal(true); };

  const submitFound = () => {
    if (!location.trim()) { Alert.alert(t('common.error'), 'Please provide a location.'); return; }
    foundMutation.mutate({ id: selPatient.id, loc: location, det: details });
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('dashboard.tracked_patients')}</Text>
          <Text style={S.headerSub}>{(patients as any[]).length} patient{(patients as any[]).length !== 1 ? 's' : ''} tracked</Text>
        </View>
        <TouchableOpacity style={S.refreshBtn} onPress={() => queryClient.invalidateQueries({ queryKey: ['trackedPatients'] })}>
          <Ionicons name="refresh-outline" size={18} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={S.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
        ) : (patients as any[]).length === 0 ? (
          <View style={S.empty}>
            <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={S.emptyIcon}>
              <Ionicons name="people-circle-outline" size={44} color="#3B82F6" />
            </LinearGradient>
            <Text style={S.emptyTitle}>No tracked patients</Text>
            <Text style={S.emptySub}>Track a patient to see them here</Text>
          </View>
        ) : (
          (patients as any[]).map((p: any) => (
            <View key={p.id} style={S.card}>
              <View style={S.cardBody}>
                <View style={S.cardTop}>
                  {p.photoUrl ? (
                    <Image source={{ uri: p.photoUrl }} style={S.avatar} />
                  ) : (
                    <LinearGradient colors={['#3B82F6CC', '#3B82F6']} style={S.avatar}>
                      <Text style={S.avatarLetter}>{(p.fullName || '?').charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                  )}
                  <View style={S.cardMid}>
                    <Text style={S.cardName}>{p.fullName}</Text>
                    <Text style={S.cardId}>{formatPatientId(p.id)}</Text>
                  </View>
                  <View style={S.trackBadge}>
                    <Ionicons name="navigate" size={12} color="#3B82F6" />
                    <Text style={S.trackBadgeText}>Tracked</Text>
                  </View>
                </View>

                {(p.province || p.village) && (
                  <View style={S.addressRow}>
                    <Ionicons name="location-outline" size={12} color="#94A3B8" />
                    <Text style={S.addressText}>
                      {[p.province, p.district, p.sector, p.cell, p.village].filter(Boolean).join(', ') || t('notifications.address_not_available')}
                    </Text>
                  </View>
                )}

                <View style={S.assignRow}>
                  <View style={S.assignItem}>
                    <Ionicons name="medkit-outline" size={12} color="#2EB67D" />
                    <Text style={S.assignText}>MHP: {p.registeredByMhp?.fullName || 'N/A'}</Text>
                  </View>
                  <View style={S.assignItem}>
                    <Ionicons name="walk-outline" size={12} color="#3B82F6" />
                    <Text style={S.assignText}>CHW: {p.assignedChw?.fullName || t('patient_detail.unassigned')}</Text>
                  </View>
                </View>

                <TouchableOpacity style={S.foundBtn} onPress={() => handleFound(p)}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                  <Text style={S.foundBtnText}>Found this Patient</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Found modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={S.overlay}>
          <View style={S.sheet}>
            <View style={S.sheetHandle} />
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>Log Found Patient</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={22} color="#64748B" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={S.sheetBody} keyboardShouldPersistTaps="handled">
              {selPatient && (
                <View style={S.patientChip}>
                  <LinearGradient colors={['#3B82F6CC', '#3B82F6']} style={S.chipAvatar}>
                    <Text style={S.chipAvatarText}>{(selPatient.fullName || '?').charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <View>
                    <Text style={S.chipName}>{selPatient.fullName}</Text>
                    <Text style={S.chipId}>{formatPatientId(selPatient.id)}</Text>
                  </View>
                </View>
              )}

              <Text style={S.fieldLabel}>Location Found *</Text>
              <Input placeholder="Where did you find them?" value={location} onChangeText={setLocation} />

              <Text style={[S.fieldLabel, { marginTop: 16 }]}>Additional Details</Text>
              <Input placeholder="Any notes or observations?" value={details} onChangeText={setDetails} multiline style={{ height: 90 }} />

              <TouchableOpacity style={S.submitBtn} onPress={submitFound} disabled={foundMutation.isPending}>
                {foundMutation.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="notifications-outline" size={16} color="#fff" /><Text style={S.submitBtnText}>Submit & Notify Everyone</Text></>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 80 },
  centered: { alignItems: 'center', paddingVertical: 60 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  cardBody: { padding: 16, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cardMid: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cardId: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  trackBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  trackBadgeText: { fontSize: 10, fontWeight: '700', color: '#3B82F6' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addressText: { fontSize: 11, color: '#94A3B8', flex: 1 },
  assignRow: { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  assignItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  assignText: { fontSize: 11, color: '#64748B' },
  foundBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#2EB67D', borderRadius: 12, paddingVertical: 12 },
  foundBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  sheetBody: { padding: 20, paddingBottom: 40, gap: 4 },
  patientChip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EFF6FF', borderRadius: 14, padding: 12, marginBottom: 16 },
  chipAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  chipAvatarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  chipName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  chipId: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2EB67D', borderRadius: 14, paddingVertical: 14, marginTop: 20 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
