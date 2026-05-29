import React, { useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Text, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

const STATUS_META: Record<string, { color: string; bg: string }> = {
  stable:  { color: '#2EB67D', bg: '#EAF7F3' },
  risk:    { color: '#F59E0B', bg: '#FEF3C7' },
  relapse: { color: '#EF4444', bg: '#FEE2E2' },
  missed:  { color: '#EF4444', bg: '#FEE2E2' },
};

function getStatus(s: string) {
  return STATUS_META[(s || '').toLowerCase()] || { color: '#64748B', bg: '#F1F5F9' };
}

export default function PatientsScreenShared() {
  const { role: paramRole, userId: paramUserId } = useLocalSearchParams<{ role: string; userId?: string }>();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'tracked' | 'untracked'>('all');

  const userRole = (paramRole || authUser?.role || 'chw').toLowerCase();
  const userId   = paramUserId || authUser?.id;
  const isAdmin  = userRole === 'admin';
  const canReg   = ['mhp', 'admin'].includes(userRole);

  const { data: allItems = [], refetch } = useQuery({
    queryKey: ['patients', userRole, search, userId],
    queryFn: async () => {
      const patients = userRole === 'chw'
        ? await api.patients(search, userRole, undefined, userId?.toString())
        : await api.patients(search, userRole);
      return (patients || []).map((p: any) => ({ ...p, status: p.status || 'Stable' }));
    },
    staleTime: 1000 * 30,
    enabled: !!userRole && !!userId,
  });

  const filtered = React.useMemo(() => {
    if (isAdmin || filter === 'all') return allItems;
    if (filter === 'tracked')   return allItems.filter((p: any) => p.tracked);
    if (filter === 'untracked') return allItems.filter((p: any) => !p.tracked);
    return allItems;
  }, [allItems, filter, isAdmin]);

  const handleDelete = async (id: string, isUser: boolean) => {
    const confirmed = await new Promise<boolean>(resolve =>
      Alert.alert(
        isUser ? t('patients.delete_user_title') : t('patients.delete_patient_title'),
        isUser ? t('patients.delete_user_confirm') : t('patients.delete_patient_confirm'),
        [
          { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
          { text: t('common.delete'), style: 'destructive', onPress: () => resolve(true) },
        ]
      )
    );
    if (!confirmed) return;
    try {
      isUser ? await api.deleteUser(id) : await api.deletePatient(id);
      refetch();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    }
  };

  const accentColor = isAdmin ? '#F59E0B' : userRole === 'mhp' ? '#2EB67D' : '#3B82F6';
  const gradColors: [string, string] = isAdmin
    ? ['#B45309', '#F59E0B']
    : userRole === 'mhp'
    ? ['#1a6b4a', '#2EB67D']
    : ['#1E40AF', '#3B82F6'];

  const renderPatient = ({ item }: { item: any }) => {
    const sm = getStatus(item.status);
    return (
      <View style={S.card}>
        <View style={[S.cardBar, { backgroundColor: sm.color }]} />
        <View style={S.cardBody}>
          <View style={S.cardTop}>
            <LinearGradient colors={[accentColor + 'CC', accentColor]} style={S.avatar}>
              <Text style={S.avatarLetter}>{(item.fullName || '?').charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={S.cardMid}>
              <Text style={S.cardName} numberOfLines={1}>{item.fullName || t('patients.unknown')}</Text>
              <Text style={S.cardId}>ID: {formatPatientId(item.id)}</Text>
            </View>
            <View style={[S.statusPill, { backgroundColor: sm.bg }]}>
              <View style={[S.statusDot, { backgroundColor: sm.color }]} />
              <Text style={[S.statusText, { color: sm.color }]}>
                {t(`status_values.${item.status}`, { defaultValue: item.status })}
              </Text>
            </View>
          </View>
          <View style={S.cardActions}>
            <TouchableOpacity
              style={[S.actionBtn, { backgroundColor: accentColor + '15', borderColor: accentColor + '30' }]}
              onPress={() => router.push(`/(shared)/patient/${item.id}?role=${userRole}` as any)}
            >
              <Ionicons name="eye-outline" size={15} color={accentColor} />
              <Text style={[S.actionText, { color: accentColor }]}>{t('patients.action_view')}</Text>
            </TouchableOpacity>
            {userRole==='chw' && (
              <TouchableOpacity style={[S.actionBtn, { backgroundColor:'#EAF7F3', borderColor:'#2EB67D30' }]}
                onPress={() => router.push(`/(chw)/features/track-patient?patientId=${item.id}` as any)}>
                <Ionicons name="navigate-outline" size={15} color="#2EB67D" />
                <Text style={[S.actionText, { color:'#2EB67D' }]}>{t('patients.action_track')}</Text>
              </TouchableOpacity>
            )}
            {(userRole==='mhp'||userRole==='admin') && (
              <TouchableOpacity style={[S.actionBtn, { backgroundColor:'#FEE2E2', borderColor:'#EF444430' }]}
                onPress={() => handleDelete(item.id, false)}>
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                <Text style={[S.actionText, { color:'#EF4444' }]}>{t('common.delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderUser = ({ item }: { item: any }) => (
    <View style={S.card}>
      <View style={[S.cardBar, { backgroundColor: '#F59E0B' }]} />
      <View style={S.cardBody}>
        <View style={S.cardTop}>
          <LinearGradient colors={['#B45309', '#F59E0B']} style={S.avatar}>
            <Text style={S.avatarLetter}>{(item.fullName || item.email || '?').charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={S.cardMid}>
            <Text style={S.cardName} numberOfLines={1}>{item.fullName || item.email}</Text>
            <Text style={S.cardId}>{(item.role || '').toUpperCase()} · {item.email}</Text>
          </View>
          <View style={[S.statusPill, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[S.statusText, { color: '#B45309' }]}>{(item.role || '').toUpperCase()}</Text>
          </View>
        </View>
        <View style={S.cardActions}>
          <TouchableOpacity
            style={[S.actionBtn, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B30' }]}
            onPress={() => router.push(`/(admin)/features/edit-user?userId=${item.id}` as any)}
          >
            <Ionicons name="create-outline" size={15} color="#B45309" />
            <Text style={[S.actionText, { color: '#B45309' }]}>{t('common.edit') || 'Edit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.actionBtn, { backgroundColor: '#FEE2E2', borderColor: '#EF444430' }]}
            onPress={() => handleDelete(item.id, true)}
          >
            <Ionicons name="trash-outline" size={15} color="#EF4444" />
            <Text style={[S.actionText, { color: '#EF4444' }]}>{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* ── Gradient header ── */}
      <LinearGradient colors={gradColors} style={S.header}>
        <View style={S.headerTop}>
          <View>
            <Text style={S.headerTitle}>{isAdmin ? t('dashboard.user_management') : t('patients.title')}</Text>
            <Text style={S.headerSub}>{filtered.length} {isAdmin ? 'users' : 'patients'}</Text>
          </View>
          {canReg && (
            <TouchableOpacity
              style={S.addBtn}
              onPress={() => isAdmin
                ? router.push('/(admin)/features/add-user' as any)
                : router.push('/(mhp)/features/register-patient' as any)
              }
            >
              <Ionicons name="add" size={22} color={accentColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View style={S.searchWrap}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={S.searchInput}
            placeholder={isAdmin ? t('patients.search_users_placeholder') : t('patients.search_patients_placeholder')}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── Filter chips ── */}
      {!isAdmin && (
        <View style={S.filterRow}>
          {(['all', 'tracked', 'untracked'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[S.chip, filter === f && { backgroundColor: accentColor, borderColor: accentColor }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[S.chipText, filter === f && { color: '#fff' }]}>
                {f === 'all' ? t('patients.filter_all') : f === 'tracked' ? t('patients.filter_tracked') : t('patients.filter_untracked')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={isAdmin ? renderUser : renderPatient}
        contentContainerStyle={S.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.empty}>
            <LinearGradient colors={[accentColor + '22', accentColor + '0A']} style={S.emptyIcon}>
              <Ionicons name="people-outline" size={44} color={accentColor} />
            </LinearGradient>
            <Text style={S.emptyTitle}>No {isAdmin ? 'users' : 'patients'} found</Text>
            <Text style={S.emptySub}>{search ? 'Try a different search' : 'Nothing here yet'}</Text>
          </View>
        }
      />
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { paddingTop: 8, paddingBottom: 16, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12,
    paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  cardBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardMid: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cardId: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
});
