import React from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const ROLE_META: Record<string, { color: string; bg: string }> = {
  MHP:    { color: '#2EB67D', bg: '#EAF7F3' },
  CHW:    { color: '#3B82F6', bg: '#DBEAFE' },
  FAMILY: { color: '#7C3AED', bg: '#EDE9FE' },
  ADMIN:  { color: '#F59E0B', bg: '#FEF3C7' },
};
function getRoleMeta(role: string) {
  return ROLE_META[(role || '').toUpperCase()] || { color: '#64748B', bg: '#F1F5F9' };
}

export default function UserManagement() {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users(),
    staleTime: 1000 * 60,
  });

  useFocusEffect(React.useCallback(() => { refetch(); }, [refetch]));

  const handleDelete = (userId: string) => Alert.alert(
    t('user_mgmt.delete_title'), t('user_mgmt.delete_confirm'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try { await api.deleteUser(userId); refetch(); }
        catch (e: any) { Alert.alert(t('user_mgmt.delete_error'), e?.message || ''); }
      }},
    ]
  );

  const renderItem = ({ item }: { item: any }) => {
    const rm = getRoleMeta(item.role);
    const initials = (item.fullName || item.email || '?').substring(0, 2).toUpperCase();
    return (
      <View style={S.card}>
        <LinearGradient colors={[rm.color + 'CC', rm.color]} style={S.avatar}>
          <Text style={S.avatarText}>{initials}</Text>
        </LinearGradient>
        <View style={S.cardBody}>
          <View style={S.cardTop}>
            <Text style={S.cardName} numberOfLines={1}>{item.fullName || item.email}</Text>
            <View style={[S.rolePill, { backgroundColor: rm.bg }]}>
              <Text style={[S.roleText, { color: rm.color }]}>
                {t(`status_values.${item.role}`, { defaultValue: item.role })}
              </Text>
            </View>
          </View>
          <Text style={S.cardEmail}>{item.email}</Text>
          {item.phone ? <Text style={S.cardMeta}>{item.phone}</Text> : null}
          {item.workplace ? (
            <View style={S.metaRow}>
              <Ionicons name="business-outline" size={11} color="#94A3B8" />
              <Text style={S.cardMeta}>{item.workplace}</Text>
            </View>
          ) : null}
          {item.village ? (
            <View style={S.metaRow}>
              <Ionicons name="location-outline" size={11} color="#94A3B8" />
              <Text style={S.cardMeta}>{[item.province, item.district, item.village].filter(Boolean).join(', ')}</Text>
            </View>
          ) : null}
        </View>
        <View style={S.actions}>
          <TouchableOpacity style={S.actionBtn} onPress={() => router.push(`/(admin)/features/view-user?id=${encodeURIComponent(item.id)}` as any)}>
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity style={[S.actionBtn, { backgroundColor: '#FEF3C7' }]} onPress={() => router.push(`/(admin)/features/edit-user?id=${encodeURIComponent(item.id)}` as any)}>
            <Ionicons name="create-outline" size={16} color="#B45309" />
          </TouchableOpacity>
          <TouchableOpacity style={[S.actionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#B45309', '#F59E0B']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('user_mgmt.title')}</Text>
          <Text style={S.headerSub}>{(users as any[]).length} user{(users as any[]).length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={() => router.push('/(admin)/features/add-user' as any)}>
          <Ionicons name="person-add" size={18} color="#B45309" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Role legend */}
      <View style={S.legend}>
        {Object.entries(ROLE_META).map(([role, meta]) => (
          <View key={role} style={S.legendItem}>
            <View style={[S.legendDot, { backgroundColor: meta.color }]} />
            <Text style={S.legendText}>{role}</Text>
          </View>
        ))}
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
              <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={S.emptyIcon}>
                <Ionicons name="people-outline" size={44} color="#F59E0B" />
              </LinearGradient>
              <Text style={S.emptyTitle}>No users found</Text>
            </View>
          }
        />
      )}
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
  legend: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  list: { padding: 16, paddingBottom: 80 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cardBody: { flex: 1, gap: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  roleText: { fontSize: 10, fontWeight: '700' },
  cardEmail: { fontSize: 12, color: '#64748B' },
  cardMeta: { fontSize: 11, color: '#94A3B8' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
});
