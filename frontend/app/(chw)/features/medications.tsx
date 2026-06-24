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

export default function Medications() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: treatmentChanges = [], isLoading } = useQuery({
    queryKey: ['chwTreatmentChanges', user?.id],
    queryFn: () => api.treatmentChanges(),
    enabled: !!user?.id,
  });

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#10B981', '#059669']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Treatments</Text>
          <Text style={S.headerSub}>
            {(treatmentChanges as any[]).length} treatment{(treatmentChanges as any[]).length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={S.centered}><ActivityIndicator size="large" color="#10B981" /></View>
        ) : !treatmentChanges || (treatmentChanges as any[]).length === 0 ? (
          <View style={S.empty}>
            <LinearGradient colors={['#EAF7F3', '#C6F6D5']} style={S.emptyIcon}>
              <Ionicons name="medkit-outline" size={44} color="#10B981" />
            </LinearGradient>
            <Text style={S.emptyTitle}>No treatments</Text>
            <Text style={S.emptySub}>No treatment changes recorded for your patients yet</Text>
          </View>
        ) : (
          (treatmentChanges as any[]).map((item: any) => {
            const changeDate = new Date(item.createdAt);
            return (
              <View key={item.id} style={S.card}>
                <View style={[S.cardBar, { backgroundColor: '#10B981' }]} />
                <View style={S.cardBody}>
                  {/* Patient info strip */}
                  <View style={S.patientRow}>
                    <LinearGradient colors={['#10B981CC', '#10B981']} style={S.patientAvatar}>
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
                    <View style={[S.typeIcon, { backgroundColor: '#EAF7F3' }]}>
                      <Ionicons name="medkit" size={18} color="#10B981" />
                    </View>
                    <View style={S.cardMid}>
                      <Text style={S.cardTitle}>Treatment Update</Text>
                    </View>
                    {item.changedBy && (
                      <View style={S.changedByPill}>
                        <Text style={S.changedByText}>{item.changedBy}</Text>
                      </View>
                    )}
                  </View>

                  {/* Treatment details */}
                  <Text style={S.changeText}>{item.change}</Text>

                  {/* Date / time */}
                  <View style={S.metaRow}>
                    <View style={S.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
                      <Text style={S.metaText}>{changeDate.toLocaleDateString()}</Text>
                    </View>
                    <View style={S.metaItem}>
                      <Ionicons name="time-outline" size={13} color="#94A3B8" />
                      <Text style={S.metaText}>{changeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
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
  changedByPill: { backgroundColor: '#EAF7F3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  changedByText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
  changeText: { fontSize: 14, color: '#475569', lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#94A3B8' },
});
