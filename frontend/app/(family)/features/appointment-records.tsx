import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const STATUS_META: Record<string, { color: string; bg: string; icon: any }> = {
  ATTENDED: { color: '#2EB67D', bg: '#EAF7F3', icon: 'checkmark-circle' },
  MISSED:   { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle' },
  PENDING:  { color: '#F59E0B', bg: '#FEF3C7', icon: 'time' },
};

export default function AppointmentRecords() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: patients } = useQuery({
    queryKey: ['familyPatients', user?.id],
    queryFn: () => api.patients(undefined, undefined, undefined, undefined, user?.id),
    enabled: !!user?.id,
  });
  const patient = patients?.[0];

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['patientReminders', patient?.id],
    queryFn: () => api.reminders(patient?.id?.toString()),
    enabled: !!patient?.id,
  });

  const appts = (reminders as any[]).filter(r => r.type === 'appointment');

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#A78BFA']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('appointment_records.title')}</Text>
          <Text style={S.headerSub}>{appts.length} appointment{appts.length !== 1 ? 's' : ''}</Text>
        </View>
      </LinearGradient>

      {/* Patient info strip */}
      {patient && (
        <View style={S.patientStrip}>
          <LinearGradient colors={['#7C3AEDCC', '#7C3AED']} style={S.patientAvatar}>
            <Text style={S.patientAvatarText}>{(patient.fullName || '?').charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={S.patientInfo}>
            <Text style={S.patientName}>{patient.fullName}</Text>
            <Text style={S.patientMeta}>
              {patient.registeredByMhp?.fullName ? `MHP: ${patient.registeredByMhp.fullName}` : ''}
              {patient.registeredByMhp?.workplace ? ` · ${patient.registeredByMhp.workplace}` : ''}
            </Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={S.centered}><ActivityIndicator size="large" color="#7C3AED" /></View>
        ) : appts.length === 0 ? (
          <View style={S.empty}>
            <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={S.emptyIcon}>
              <Ionicons name="calendar-outline" size={44} color="#7C3AED" />
            </LinearGradient>
            <Text style={S.emptyTitle}>{t('appointment_records.no_appointments')}</Text>
            <Text style={S.emptySub}>No appointments scheduled yet</Text>
          </View>
        ) : (
          appts.map((item: any) => {
            const sm = STATUS_META[item.status || 'PENDING'] || STATUS_META.PENDING;
            const apptDate = new Date(item.time);
            return (
              <View key={item.id} style={S.card}>
                <View style={[S.cardBar, { backgroundColor: sm.color }]} />
                <View style={S.cardBody}>
                  {/* Top row */}
                  <View style={S.cardTop}>
                    <View style={[S.typeIcon, { backgroundColor: '#EDE9FE' }]}>
                      <Ionicons name={item.type === 'medication' ? 'medkit' : 'calendar'} size={18} color="#7C3AED" />
                    </View>
                    <View style={S.cardMid}>
                      <Text style={S.cardTitle}>{item.title}</Text>
                    </View>
                    <View style={[S.statusPill, { backgroundColor: sm.bg }]}>
                      <Ionicons name={sm.icon} size={11} color={sm.color} />
                      <Text style={[S.statusText, { color: sm.color }]}>
                        {t(`status_values.${item.status || 'PENDING'}`, { defaultValue: item.status || 'PENDING' })}
                      </Text>
                    </View>
                  </View>

                  {/* Date / time */}
                  <View style={S.metaRow}>
                    <View style={S.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
                      <Text style={S.metaText}>{apptDate.toLocaleDateString()}</Text>
                    </View>
                    <View style={S.metaItem}>
                      <Ionicons name="time-outline" size={13} color="#94A3B8" />
                      <Text style={S.metaText}>{apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </View>

                  {/* Location info */}
                  <View style={S.infoBox}>
                    {patient?.province && (
                      <View style={S.infoRow}>
                        <Ionicons name="location-outline" size={13} color="#94A3B8" />
                        <Text style={S.infoLabel}>{t('appointment_records.location_label')}</Text>
                        <Text style={S.infoValue}>{patient.province}{patient.district ? `, ${patient.district}` : ''}</Text>
                      </View>
                    )}
                    {patient?.registeredByMhp?.workplace && (
                      <View style={S.infoRow}>
                        <Ionicons name="business-outline" size={13} color="#94A3B8" />
                        <Text style={S.infoLabel}>{t('appointment_records.health_center')}:</Text>
                        <Text style={S.infoValue}>{patient.registeredByMhp.workplace}</Text>
                      </View>
                    )}
                    {patient?.registeredByMhp?.fullName && (
                      <View style={S.infoRow}>
                        <Ionicons name="person-outline" size={13} color="#94A3B8" />
                        <Text style={S.infoLabel}>{t('appointment_records.mhp_label')}:</Text>
                        <Text style={S.infoValue}>{patient.registeredByMhp.fullName}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
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
  patientStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  patientAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  patientAvatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  patientMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
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
  typeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  cardMid: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#94A3B8' },
  infoBox: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', width: 88 },
  infoValue: { fontSize: 12, color: '#1E293B', flex: 1 },
});
