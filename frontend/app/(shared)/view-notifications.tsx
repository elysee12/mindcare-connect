import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { translateNotifications, TranslatedNotification } from '@/lib/notificationTranslation';

const TYPE_META: Record<string, { icon: any; color: string; bg: string }> = {
  appointment: { icon:'calendar',       color:'#3B82F6', bg:'#DBEAFE' },
  reminder:    { icon:'alarm',          color:'#8B5CF6', bg:'#EDE9FE' },
  found:       { icon:'location',       color:'#2EB67D', bg:'#EAF7F3' },
  treatment:   { icon:'medkit',         color:'#F59E0B', bg:'#FEF3C7' },
  followup:    { icon:'document-text',  color:'#2EB67D', bg:'#EAF7F3' },
  report:      { icon:'analytics',      color:'#EC4899', bg:'#FCE7F3' },
  user:        { icon:'person',         color:'#6366F1', bg:'#EEF2FF' },
  default:     { icon:'notifications',  color:'#64748B', bg:'#F1F5F9' },
};

function getMeta(type: string) {
  const lower = (type||'').toLowerCase();
  for (const key of Object.keys(TYPE_META)) {
    if (lower.includes(key)) return TYPE_META[key];
  }
  return TYPE_META.default;
}

export default function ViewNotifications() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: raw = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.notifications(user?.id),
  });
  const items: TranslatedNotification[] = translateNotifications(raw, t);

  const clearAll = useMutation({
    mutationFn: () => api.clearAllNotifications(user?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => api.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const handleClearAll = () => {
    Alert.alert(t('notifications.clear_all_title'), t('notifications.clear_all_confirm'), [
      { text: t('common.cancel'), style:'cancel' },
      { text: t('common.delete'), style:'destructive', onPress: () => clearAll.mutate() },
    ]);
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#1E293B','#334155']} style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <View style={S.backCircle}><Ionicons name="arrow-back" size={18} color="#fff" /></View>
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('notifications.view_notifications')}</Text>
          <Text style={S.headerSub}>{items.length} notification{items.length!==1?'s':''}</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity style={S.clearBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={S.empty}>
            <LinearGradient colors={['#F1F5F9','#E2E8F0']} style={S.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={44} color="#94A3B8" />
            </LinearGradient>
            <Text style={S.emptyTitle}>{t('dashboard.no_notifications')}</Text>
            <Text style={S.emptySub}>You're all caught up!</Text>
          </View>
        ) : (
          items.map((item, idx) => {
            const meta = getMeta(item.type);
            return (
              <View key={item.id} style={S.card}>
                <View style={[S.iconWrap, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={S.cardBody}>
                  <Text style={S.cardTitle}>{item.translatedTitle}</Text>
                  <Text style={S.cardMsg}>{item.translatedMessage}</Text>
                  <Text style={S.cardDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={S.delBtn} onPress={() => del.mutate(item.id)}>
                  <Ionicons name="close-circle-outline" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F1F5F9' },
  header: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:14, gap:12 },
  backBtn: {},
  backCircle: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.15)', justifyContent:'center', alignItems:'center' },
  headerCenter: { flex:1 },
  headerTitle: { fontSize:18, fontWeight:'800', color:'#fff' },
  headerSub: { fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 },
  clearBtn: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(239,68,68,0.15)', justifyContent:'center', alignItems:'center' },
  scroll: { padding:16, paddingBottom:80, gap:0 },
  card: {
    flexDirection:'row', alignItems:'flex-start', gap:12,
    backgroundColor:'#fff', borderRadius:16, padding:14, marginBottom:10,
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:6, elevation:2,
  },
  iconWrap: { width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center' },
  cardBody: { flex:1 },
  cardTitle: { fontSize:14, fontWeight:'700', color:'#1E293B', marginBottom:3 },
  cardMsg: { fontSize:13, color:'#64748B', lineHeight:18 },
  cardDate: { fontSize:11, color:'#CBD5E1', marginTop:6 },
  delBtn: { padding:4 },
  empty: { alignItems:'center', paddingVertical:80, gap:16 },
  emptyIcon: { width:88, height:88, borderRadius:44, justifyContent:'center', alignItems:'center' },
  emptyTitle: { fontSize:17, fontWeight:'700', color:'#1E293B' },
  emptySub: { fontSize:13, color:'#94A3B8' },
});
