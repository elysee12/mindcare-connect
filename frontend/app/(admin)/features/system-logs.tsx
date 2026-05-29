import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

function getLogMeta(event: string): { icon: any; color: string; bg: string } {
  const e = (event || '').toLowerCase();
  if (e.includes('login') || e.includes('auth'))   return { icon: 'log-in-outline',      color: '#3B82F6', bg: '#DBEAFE' };
  if (e.includes('delete') || e.includes('remov')) return { icon: 'trash-outline',        color: '#EF4444', bg: '#FEE2E2' };
  if (e.includes('create') || e.includes('add'))   return { icon: 'add-circle-outline',   color: '#2EB67D', bg: '#EAF7F3' };
  if (e.includes('update') || e.includes('edit'))  return { icon: 'create-outline',       color: '#F59E0B', bg: '#FEF3C7' };
  if (e.includes('report'))                         return { icon: 'document-text-outline',color: '#8B5CF6', bg: '#EDE9FE' };
  if (e.includes('patient'))                        return { icon: 'person-outline',       color: '#EC4899', bg: '#FCE7F3' };
  return { icon: 'server-outline', color: '#64748B', bg: '#F1F5F9' };
}

export default function SystemLogs() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState('');
  const [toastErr, setToastErr] = useState(false);

  const showToast = (msg: string, err = false) => { setToast(msg); setToastErr(err); setTimeout(() => setToast(''), 2500); };

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: () => api.systemLogs(),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.clearLogs(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['systemLogs'] }); showToast(t('system_logs.cleared')); },
    onError: () => showToast(t('system_logs.clear_failed'), true),
  });

  const handleClear = () => Alert.alert(
    t('system_logs.clear_btn'), 'This will permanently delete all system logs.',
    [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => clearMutation.mutate() }]
  );

  const renderItem = ({ item }: { item: any }) => {
    const meta = getLogMeta(item.event);
    return (
      <View style={S.card}>
        <View style={[S.iconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={S.cardBody}>
          <Text style={S.cardEvent}>{item.event}</Text>
          {item.user && (
            <Text style={S.cardUser}>
              {item.user.fullName} · {item.user.email}
            </Text>
          )}
          <Text style={S.cardTime}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
        <View style={[S.dot, { backgroundColor: meta.color }]} />
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
          <Text style={S.headerTitle}>{t('system_logs.title')}</Text>
          <Text style={S.headerSub}>{(logs as any[]).length} log{(logs as any[]).length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={S.clearBtn} onPress={handleClear} disabled={clearMutation.isPending}>
          {clearMutation.isPending
            ? <ActivityIndicator size="small" color="#EF4444" />
            : <Ionicons name="trash-outline" size={18} color="#EF4444" />
          }
        </TouchableOpacity>
      </LinearGradient>

      {isLoading ? (
        <View style={S.centered}><ActivityIndicator size="large" color="#F59E0B" /></View>
      ) : (logs as any[]).length === 0 ? (
        <View style={S.empty}>
          <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={S.emptyIcon}>
            <Ionicons name="server-outline" size={44} color="#F59E0B" />
          </LinearGradient>
          <Text style={S.emptyTitle}>{t('system_logs.no_logs')}</Text>
          <Text style={S.emptySub}>No activity recorded yet</Text>
        </View>
      ) : (
        <FlatList
          data={logs as any[]}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {toast ? (
        <View style={[S.toast, toastErr && { backgroundColor: '#EF4444' }]}>
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
  clearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 80 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, gap: 3 },
  cardEvent: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  cardUser: { fontSize: 12, color: '#64748B' },
  cardTime: { fontSize: 11, color: '#94A3B8' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, alignItems: 'center' },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
