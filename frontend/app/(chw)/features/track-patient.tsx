import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function TrackPatient() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const queryClient = useQueryClient();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.patients(),
    staleTime: 1000 * 60,
  });

  const trackMutation = useMutation({
    mutationFn: (id: number) => api.trackPatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['trackedPatients'] });
      showToast('Patient marked as tracked');
    },
    onError: () => showToast('Failed to track patient'),
  });

  const filtered = useMemo(() => {
    if (!query.trim()) return patients as any[];
    const q = query.trim().toLowerCase();
    return (patients as any[]).filter(p =>
      p.fullName?.toLowerCase().includes(q) ||
      String(p.id).includes(q) ||
      formatPatientId(p.id).toLowerCase().includes(q)
    );
  }, [query, patients]);

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('dashboard.track_patient')}</Text>
          <Text style={S.headerSub}>Mark patients for cross-CHW tracking</Text>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={S.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          style={S.searchInput}
          placeholder="Search by name or ID…"
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={S.centered}>
            <Text style={S.infoText}>Loading patients…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={S.empty}>
            <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={S.emptyIcon}>
              <Ionicons name="people-outline" size={44} color="#3B82F6" />
            </LinearGradient>
            <Text style={S.emptyTitle}>No patients found</Text>
            <Text style={S.emptySub}>{query ? 'Try a different search' : 'No patients assigned yet'}</Text>
          </View>
        ) : (
          filtered.map((p: any) => (
            <View key={p.id} style={S.card}>
              <View style={[S.cardBar, { backgroundColor: p.tracked ? '#2EB67D' : '#3B82F6' }]} />
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
                    {p.diagnosis && <Text style={S.cardDiag}>{p.diagnosis}</Text>}
                  </View>
                  {p.tracked && (
                    <View style={S.trackedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#2EB67D" />
                      <Text style={S.trackedText}>Tracked</Text>
                    </View>
                  )}
                </View>

                {(p.province || p.district || p.village) && (
                  <View style={S.addressRow}>
                    <Ionicons name="location-outline" size={12} color="#94A3B8" />
                    <Text style={S.addressText}>
                      {[p.province, p.district, p.sector, p.cell, p.village].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[S.trackBtn, p.tracked && S.trackBtnDone]}
                  onPress={() => !p.tracked && trackMutation.mutate(p.id)}
                  disabled={p.tracked || trackMutation.isPending}
                >
                  <Ionicons name={p.tracked ? 'checkmark-circle' : 'navigate-outline'} size={15} color={p.tracked ? '#2EB67D' : '#fff'} />
                  <Text style={[S.trackBtnText, p.tracked && { color: '#2EB67D' }]}>
                    {p.tracked ? 'Already Tracked' : 'Track Patient'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

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
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, marginBottom: 8, paddingHorizontal: 14, height: 46, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },
  scroll: { padding: 16, paddingBottom: 80 },
  centered: { alignItems: 'center', paddingVertical: 40 },
  infoText: { fontSize: 13, color: '#94A3B8' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  cardBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardMid: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cardId: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  cardDiag: { fontSize: 11, color: '#64748B', marginTop: 2 },
  trackedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EAF7F3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  trackedText: { fontSize: 10, fontWeight: '700', color: '#2EB67D' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addressText: { fontSize: 11, color: '#94A3B8', flex: 1 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 10 },
  trackBtnDone: { backgroundColor: '#EAF7F3' },
  trackBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, alignItems: 'center' },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
