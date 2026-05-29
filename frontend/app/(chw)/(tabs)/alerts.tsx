import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { translateNotifications, TranslatedNotification } from '@/lib/notificationTranslation';

function getMeta(type: string): { icon: any; color: string; bg: string } {
  const t = (type||'').toLowerCase();
  if (t.includes('appointment')||t.includes('reminder')) return { icon:'calendar',      color:'#3B82F6', bg:'#DBEAFE' };
  if (t.includes('found'))                                return { icon:'location',      color:'#2EB67D', bg:'#EAF7F3' };
  if (t.includes('treatment'))                            return { icon:'medkit',        color:'#F59E0B', bg:'#FEF3C7' };
  if (t.includes('followup'))                             return { icon:'document-text', color:'#2EB67D', bg:'#EAF7F3' };
  if (t.includes('report'))                               return { icon:'analytics',     color:'#EC4899', bg:'#FCE7F3' };
  return { icon:'notifications', color:'#3B82F6', bg:'#DBEAFE' };
}

export default function AlertsScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: raw = [], refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.notifications(user?.id),
    staleTime: 1000*30,
  });
  const alerts: TranslatedNotification[] = translateNotifications(raw, t);

  const dismiss = useMutation({
    mutationFn: (id: number) => api.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const renderItem = ({ item }: { item: TranslatedNotification }) => {
    const meta = getMeta(item.type);
    return (
      <View style={S.card}>
        <View style={[S.iconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={S.cardBody}>
          <View style={S.cardTop}>
            <Text style={S.cardTitle} numberOfLines={1}>{item.translatedTitle}</Text>
            <Text style={S.cardTime}>{t('notifications.just_now')}</Text>
          </View>
          <Text style={S.cardMsg}>{item.translatedMessage}</Text>
          <View style={S.cardActions}>
            <TouchableOpacity style={[S.actionBtn, { backgroundColor: meta.bg }]}>
              <Text style={[S.actionText, { color: meta.color }]}>{t('notifications.take_action')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => dismiss.mutate(item.id)}>
              <Text style={S.dismissText}>{t('notifications.dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#1E40AF','#3B82F6']} style={S.header}>
        <Text style={S.headerTitle}>{t('notifications.system_alerts')}</Text>
        <TouchableOpacity style={S.refreshBtn} onPress={() => refetch()}>
          <Ionicons name="refresh-outline" size={20} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Count bar */}
      {alerts.length > 0 && (
        <View style={S.countBar}>
          <View style={S.countDot} />
          <Text style={S.countText}>{alerts.length} active alert{alerts.length!==1?'s':''}</Text>
        </View>
      )}

      <FlatList
        data={alerts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={S.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.empty}>
            <LinearGradient colors={['#EFF6FF','#DBEAFE']} style={S.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={44} color="#3B82F6" />
            </LinearGradient>
            <Text style={S.emptyTitle}>{t('notifications.no_alerts')}</Text>
            <Text style={S.emptySub}>You're all caught up!</Text>
          </View>
        }
      />
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F1F5F9' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:16 },
  headerTitle: { fontSize:20, fontWeight:'800', color:'#fff' },
  refreshBtn: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center' },
  countBar: { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:20, paddingVertical:10, backgroundColor:'#EFF6FF', borderBottomWidth:1, borderBottomColor:'#DBEAFE' },
  countDot: { width:8, height:8, borderRadius:4, backgroundColor:'#3B82F6' },
  countText: { fontSize:13, fontWeight:'600', color:'#3B82F6' },
  list: { padding:16, paddingBottom:80 },
  card: {
    flexDirection:'row', alignItems:'flex-start', gap:14,
    backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:12,
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:8, elevation:2,
  },
  iconWrap: { width:48, height:48, borderRadius:24, justifyContent:'center', alignItems:'center' },
  cardBody: { flex:1, gap:6 },
  cardTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  cardTitle: { fontSize:15, fontWeight:'700', color:'#1E293B', flex:1, marginRight:8 },
  cardTime: { fontSize:11, color:'#94A3B8' },
  cardMsg: { fontSize:13, color:'#64748B', lineHeight:18 },
  cardActions: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:4 },
  actionBtn: { paddingHorizontal:14, paddingVertical:6, borderRadius:20 },
  actionText: { fontSize:12, fontWeight:'700' },
  dismissText: { fontSize:12, color:'#94A3B8' },
  empty: { alignItems:'center', paddingVertical:80, gap:16 },
  emptyIcon: { width:88, height:88, borderRadius:44, justifyContent:'center', alignItems:'center' },
  emptyTitle: { fontSize:17, fontWeight:'700', color:'#1E293B' },
  emptySub: { fontSize:13, color:'#94A3B8' },
});
