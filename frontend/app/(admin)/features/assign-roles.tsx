import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

const ROLES = ['MHP', 'CHW', 'FAMILY', 'ADMIN'] as const;
type RoleType = typeof ROLES[number];

const ROLE_META: Record<RoleType, { color: string; bg: string; icon: any }> = {
  MHP:    { color: '#2EB67D', bg: '#EAF7F3', icon: 'medkit-outline' },
  CHW:    { color: '#3B82F6', bg: '#DBEAFE', icon: 'walk-outline' },
  FAMILY: { color: '#8B5CF6', bg: '#EDE9FE', icon: 'people-outline' },
  ADMIN:  { color: '#F59E0B', bg: '#FEF3C7', icon: 'shield-checkmark-outline' },
};

export default function AssignRoles() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, RoleType>>({});
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['usersForRoles'],
    queryFn: () => api.users(),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(pendingChanges);
      await Promise.all(updates.map(([id, role]) => api.updateUser(id, { role })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersForRoles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setPendingChanges({});
      showToast(t('assign_roles.assigned'));
    },
    onError: (e: any) => showToast(e?.message || 'Failed to update roles'),
  });

  const handleRoleChange = (userId: string, currentRole: string, newRole: RoleType) => {
    if (newRole === currentRole) {
      const next = { ...pendingChanges };
      delete next[userId];
      setPendingChanges(next);
    } else {
      setPendingChanges(prev => ({ ...prev, [userId]: newRole }));
    }
  };

  const hasPending = Object.keys(pendingChanges).length > 0;

  const renderItem = ({ item }: { item: any }) => {
    const effectiveRole = (pendingChanges[item.id] || item.role || 'CHW').toUpperCase() as RoleType;
    const meta = ROLE_META[effectiveRole] || ROLE_META.CHW;
    const isPending = !!pendingChanges[item.id];
    const initials = (item.fullName || '?').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();

    return (
      <View style={[S.card, isPending && S.cardPending]}>
        {isPending && <View style={S.pendingBar} />}
        <View style={S.cardTop}>
          <LinearGradient colors={[meta.color + 'CC', meta.color]} style={S.avatar}>
            <Text style={S.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={S.cardInfo}>
            <Text style={S.cardName} numberOfLines={1}>{item.fullName || item.email}</Text>
            <Text style={S.cardEmail} numberOfLines={1}>{item.email}</Text>
          </View>
          {isPending && (
            <View style={S.changedBadge}>
              <Text style={S.changedBadgeText}>Changed</Text>
            </View>
          )}
        </View>

        {/* Role selector */}
        <View style={S.roleRow}>
          {ROLES.map(r => {
            const rm = ROLE_META[r];
            const active = effectiveRole === r;
            return (
              <TouchableOpacity
                key={r}
                style={[S.roleBtn, active && { backgroundColor: rm.bg, borderColor: rm.color }]}
                onPress={() => handleRoleChange(String(item.id), item.role, r)}
                activeOpacity={0.8}
              >
                <Ionicons name={rm.icon} size={13} color={active ? rm.color : '#94A3B8'} />
                <Text style={[S.roleBtnText, active && { color: rm.color, fontWeight: '700' }]}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <LinearGradient colors={['#B45309', '#F59E0B']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('assign_roles.title')}</Text>
          <Text style={S.headerSub}>{users.length} users · {Object.keys(pendingChanges).length} pending</Text>
        </View>
        {hasPending && (
          <TouchableOpacity style={S.applyBtn} onPress={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending
              ? <ActivityIndicator size="small" color="#F59E0B" />
              : <Text style={S.applyBtnText}>Apply</Text>
            }
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Legend */}
      <View style={S.legend}>
        {ROLES.map(r => {
          const m = ROLE_META[r];
          return (
            <View key={r} style={S.legendItem}>
              <View style={[S.legendDot, { backgroundColor: m.color }]} />
              <Text style={S.legendText}>{r}</Text>
            </View>
          );
        })}
      </View>

      {isLoading ? (
        <View style={S.centered}><ActivityIndicator size="large" color="#F59E0B" /></View>
      ) : (
        <FlatList
          data={users as any[]}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={S.empty}>
              <Ionicons name="people-outline" size={48} color="#E2E8F0" />
              <Text style={S.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {/* Sticky apply bar */}
      {hasPending && (
        <View style={S.stickyBar}>
          <View style={S.stickyLeft}>
            <Ionicons name="swap-horizontal-outline" size={16} color="#F59E0B" />
            <Text style={S.stickyText}>{Object.keys(pendingChanges).length} role change{Object.keys(pendingChanges).length !== 1 ? 's' : ''} pending</Text>
          </View>
          <TouchableOpacity
            style={[S.stickyBtn, updateMutation.isPending && { opacity: 0.7 }]}
            onPress={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={S.stickyBtnText}>{t('assign_roles.apply_btn')}</Text>
            }
          </TouchableOpacity>
        </View>
      )}

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
  applyBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  applyBtnText: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
  legend: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  list: { padding: 16, paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  cardPending: { borderWidth: 1.5, borderColor: '#FDE68A' },
  pendingBar: { height: 3, backgroundColor: '#F59E0B' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  cardEmail: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  changedBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  changedBadgeText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  roleRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingBottom: 14 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  roleBtnText: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  stickyBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  stickyLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stickyText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  stickyBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  stickyBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  toast: { position: 'absolute', bottom: 80, left: 16, right: 16, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, alignItems: 'center' },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
