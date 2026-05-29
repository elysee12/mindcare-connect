import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function ViewTreatmentChanges() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showPatient, setShowPatient] = useState(false);

  const { data: patients } = useQuery({
    queryKey: ['familyPatients', user?.id],
    queryFn: () => api.patients(undefined, undefined, undefined, undefined, user?.id),
    enabled: !!user?.id,
  });
  const patient = patients?.[0];

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['treatmentChanges', patient?.id],
    queryFn: () => api.treatmentChanges(),
    enabled: !!patient?.id,
  });

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#A78BFA']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('treatment_changes.title')}</Text>
          <Text style={S.headerSub}>{(updates as any[]).length} record{(updates as any[]).length !== 1 ? 's' : ''}</Text>
        </View>
        {patient && (
          <TouchableOpacity
            style={[S.infoBtn, showPatient && { backgroundColor: '#fff' }]}
            onPress={() => setShowPatient(!showPatient)}
          >
            <Ionicons name="person" size={16} color={showPatient ? '#7C3AED' : '#fff'} />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Patient info panel */}
      {showPatient && patient && (
        <View style={S.patientPanel}>
          <View style={S.patientPanelTop}>
            {patient.photoUrl ? (
              <Image source={{ uri: patient.photoUrl }} style={S.patientPhoto} />
            ) : (
              <LinearGradient colors={['#7C3AEDCC', '#7C3AED']} style={S.patientAvatar}>
                <Text style={S.patientAvatarText}>{(patient.fullName || '?').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <View style={S.patientPanelInfo}>
              <Text style={S.patientName}>{patient.fullName}</Text>
              <Text style={S.patientId}>ID: {patient.id}</Text>
            </View>
          </View>
          <View style={S.detailGrid}>
            {[
              { label: t('treatment_changes.gender_label'), value: t(`status_values.${patient.gender}`, { defaultValue: patient.gender }) },
              { label: t('treatment_changes.age_label'), value: String(patient.age || t('common.na')) },
              { label: t('treatment_changes.diagnosis_label'), value: patient.diagnosis || t('common.na') },
              { label: t('treatment_changes.assigned_chw'), value: patient.assignedChw?.fullName || t('common.na') },
              { label: t('treatment_changes.registered_mhp'), value: patient.registeredByMhp?.fullName || t('common.na') },
              { label: t('treatment_changes.health_center'), value: patient.registeredByMhp?.workplace || t('common.na') },
            ].map(d => (
              <View key={d.label} style={S.detailRow}>
                <Text style={S.detailLabel}>{d.label}</Text>
                <Text style={S.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={S.centered}><ActivityIndicator size="large" color="#7C3AED" /></View>
        ) : (updates as any[]).length === 0 ? (
          <View style={S.empty}>
            <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={S.emptyIcon}>
              <Ionicons name="flask-outline" size={44} color="#7C3AED" />
            </LinearGradient>
            <Text style={S.emptyTitle}>{t('treatment_changes.no_changes')}</Text>
            <Text style={S.emptySub}>No treatment changes recorded yet</Text>
          </View>
        ) : (
          (updates as any[]).map((item: any, idx: number) => (
            <View key={item.id} style={S.card}>
              <View style={S.cardLeft}>
                <View style={S.timelineDot} />
                {idx < (updates as any[]).length - 1 && <View style={S.timelineLine} />}
              </View>
              <View style={S.cardBody}>
                <View style={S.cardHeader}>
                  <View style={S.changeBadge}>
                    <Ionicons name="flask" size={12} color="#7C3AED" />
                    <Text style={S.changeBadgeText}>Treatment Change</Text>
                  </View>
                  <Text style={S.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={S.cardChange}>{item.change}</Text>
                <View style={S.cardFooter}>
                  <Ionicons name="person-outline" size={12} color="#94A3B8" />
                  <Text style={S.cardBy}>{t('treatment_changes.by_label')}: {item.changedBy || t('status_values.MHP')}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  infoBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  patientPanel: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  patientPanelTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  patientPhoto: { width: 52, height: 52, borderRadius: 26 },
  patientAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  patientAvatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  patientPanelInfo: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  patientId: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  detailGrid: { gap: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  detailLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  detailValue: { fontSize: 12, color: '#1E293B', fontWeight: '500' },
  scroll: { padding: 16, paddingBottom: 80 },
  centered: { alignItems: 'center', paddingVertical: 60 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
  card: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  cardLeft: { alignItems: 'center', width: 20 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#7C3AED', borderWidth: 2, borderColor: '#EDE9FE', marginTop: 4 },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#E2E8F0', marginTop: 4 },
  cardBody: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  changeBadgeText: { fontSize: 10, fontWeight: '700', color: '#7C3AED' },
  cardDate: { fontSize: 11, color: '#94A3B8' },
  cardChange: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardBy: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
});
