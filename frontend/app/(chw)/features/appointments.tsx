import React, { useState } from 'react';
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

export default function Appointments() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['chwPatients', user?.id],
    queryFn: () => api.patients(undefined, undefined, undefined, user?.id?.toString()),
    enabled: !!user?.id,
  });

  const allAppointments: any[] = [];

  // Collect all appointments from all patients
  (patients || []).forEach((patient: any) => {
    // We'll need to fetch each patient's reminders
    // For now, let's just collect patient info and we'll fetch reminders on demand or in parallel
  });

  // Let's use a better approach - fetch all patients' reminders
  const { data: allReminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['allChwPatientsReminders', user?.id, patients],
    queryFn: async () => {
      const reminders = [];
      for (const patient of (patients || [])) {
        try {
          const patientReminders = await api.reminders(patient.id.toString());
          const patientAppointments = (patientReminders as any[]).filter(r => r.type === 'appointment').map(r => ({
            ...r,
            patient,
          }));
          reminders.push(...patientAppointments);
        } catch (e) {
          console.error(`Failed to fetch reminders for patient ${patient.id}:`, e);
        }
      }
      return reminders;
    },
    enabled: !!user?.id && !!patients,
  });

  const isLoading = patientsLoading || remindersLoading;

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#3B82F6', '#1E40AF']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Appointments</Text>
          <Text style={S.headerSub}>
            {allReminders?.length || 0} appointment{allReminders?.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={S.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
        ) : !allReminders || allReminders.length === 0 ? (
          <View style={S.empty}>
            <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={S.emptyIcon}>
              <Ionicons name="calendar-outline" size={44} color="#3B82F6" />
            </LinearGradient>
            <Text style={S.emptyTitle}>No appointments</Text>
            <Text style={S.emptySub}>No appointments scheduled for your patients yet</Text>
          </View>
        ) : (
          allReminders.map((item: any) => {
            const sm = STATUS_META[item.status || 'PENDING'] || STATUS_META.PENDING;
            const apptDate = new Date(item.time);
            return (
              <View key={item.id} style={S.card}>
                <View style={[S.cardBar, { backgroundColor: sm.color }]} />
                <View style={S.cardBody}>
                  {/* Patient info strip */}
                  <View style={S.patientRow}>
                    <LinearGradient colors={['#3B82F6CC', '#3B82F6']} style={S.patientAvatar}>
                      <Text style={S.patientAvatarText}>
                        {(item.patient?.fullName || '?').charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                    <View style={S.patientInfo}>
                      <Text style={S.patientName}>{item.patient?.fullName || 'Unknown Patient'}</Text>
                      <Text style={S.patientMeta}>Patient</Text>
                    </View>
                  </View>

                  {/* Top row */}
                  <View style={S.cardTop}>
                    <View style={[S.typeIcon, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="calendar" size={18} color="#3B82F6" />
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
                    {item.patient?.province && (
                      <View style={S.infoRow}>
                        <Ionicons name="location-outline" size={13} color="#94A3B8" />
                        <Text style={S.infoLabel}>Location:</Text>
                        <Text style={S.infoValue}>
                          {item.patient.province}{item.patient.district ? `, ${item.patient.district}` : ''}
                        </Text>
                      </View>
                    )}
                    {item.patient?.registeredByMhp?.workplace && (
                      <View style={S.infoRow}>
                        <Ionicons name="business-outline" size={13} color="#94A3B8" />
                        <Text style={S.infoLabel}>Health Center:</Text>
                        <Text style={S.infoValue}>{item.patient.registeredByMhp.workplace}</Text>
                      </View>
                    )}
                    {item.patient?.registeredByMhp?.fullName && (
                      <View style={S.infoRow}>
                        <Ionicons name="person-outline" size={13} color="#94A3B8" />
                        <Text style={S.infoLabel}>MHP:</Text>
                        <Text style={S.infoValue}>{item.patient.registeredByMhp.fullName}</Text>
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
  scroll: { padding: 16, paddingBottom: 80 },
  centered: { alignItems: 'center', paddingVertical: 60 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  cardBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  patientAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  patientAvatarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  patientMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
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
