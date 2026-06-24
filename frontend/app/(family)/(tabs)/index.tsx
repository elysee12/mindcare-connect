import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Text, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { translateNotifications, TranslatedNotification } from '@/lib/notificationTranslation';

const { width } = Dimensions.get('window');

export default function FamilyDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const name = user?.fullName || user?.full_name || t('family.dashboard_title');
  const [showNotif, setShowNotif] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['stats','family',user?.id],
    queryFn: () => api.dashboard('family', user?.id),
    staleTime: 1000*30, enabled: !!user?.id,
  });
  const { data: rawUpdates = [] } = useQuery({
    queryKey: ['recentUpdates',user?.id],
    queryFn: () => api.notifications(user?.id),
    staleTime: 1000*30, enabled: !!user?.id,
  });
  const updates: TranslatedNotification[] = translateNotifications(rawUpdates, t);

  const statItems = [
    { label: t('family.assigned'),           value: stats?.totalPatients||0,    color:'#7C3AED', icon:'person' as const },
    { label: t('family.total_appointments'), value: stats?.totalAppointments||0, color:'#3B82F6', icon:'calendar' as const },
    { label: t('family.total_treatments'),   value: stats?.totalTreatments||0,   color:'#2EB67D', icon:'medkit' as const },
  ];

  const actions = [
    { title: t('family.appointment_records'),    subtitle: 'View scheduled appointments',    icon: 'calendar' as const,  grad: ['#1E3A8A','#3B82F6'] as [string,string], glow: '#3B82F620', route: '/(family)/features/appointment-records' },
    { title: t('family.view_treatment_changes'), subtitle: 'Track treatment history',         icon: 'flask' as const,     grad: ['#4C1D95','#8B5CF6'] as [string,string], glow: '#8B5CF620', route: '/(family)/features/view-treatment-changes' },
  ];

  const outlineActions = [
    { title: 'Training Content', subtitle: 'Access learning materials', icon: 'school' as const, grad: ['#7C3AED','#6D28D9'] as [string,string], glow: '#7C3AED20', route: '/(shared)/lessons' },
  ];

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        <LinearGradient colors={['#7C3AED','#A78BFA']} start={{x:0,y:0}} end={{x:1,y:1}} style={S.hero}>
          <View style={S.heroTop}>
            <View>
              <Text style={S.heroGreet}>{t('dashboard.welcome_back')}</Text>
              <Text style={S.heroName}>{name}</Text>
              <Text style={S.heroRole}>Family Member</Text>
            </View>
            <TouchableOpacity style={S.notifBtn} onPress={() => setShowNotif(true)}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {updates.some(n => !n.isRead) && <View style={S.badge} />}
            </TouchableOpacity>
          </View>

          {/* Stat cards */}
          <View style={S.statCards}>
            {statItems.map(s => (
              <View key={s.label} style={S.statCard}>
                <View style={[S.statIconWrap, {backgroundColor: s.color+'22'}]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={S.statVal}>{s.value}</Text>
                <Text style={S.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Actions */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>{t('family.family_actions')}</Text>
          <View style={S.actionsRow}>
            {actions.map(a => (
              <TouchableOpacity key={a.title} style={S.halfCard}
                onPress={() => router.push(a.route as any)} activeOpacity={0.85}>
                <LinearGradient colors={a.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.halfCardGrad}>
                  <View style={S.halfDecorCircle} />
                  <View style={S.halfCardIcon}><Ionicons name={a.icon} size={28} color="#fff" /></View>
                  <Text style={S.halfCardTitle}>{a.title}</Text>
                  <Text style={S.halfCardSub} numberOfLines={2}>{a.subtitle}</Text>
                  <View style={S.halfCardArrow}><Ionicons name="arrow-forward" size={14} color="#fff" /></View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
          {/* Outline cards */}
          {outlineActions.map(a => (
            <TouchableOpacity key={a.title} style={S.outlineCard} onPress={() => router.push(a.route as any)} activeOpacity={0.85}>
              <View style={[S.outlineIconWrap, { backgroundColor: a.glow }]}>
                <LinearGradient colors={a.grad} style={S.outlineIconGrad}>
                  <Ionicons name={a.icon} size={22} color="#fff" />
                </LinearGradient>
              </View>
              <View style={S.outlineText}>
                <Text style={S.outlineTitle}>{a.title}</Text>
                <Text style={S.outlineSub}>{a.subtitle}</Text>
              </View>
              <View style={[S.outlineArrowWrap, { backgroundColor: a.glow }]}>
                <Ionicons name="arrow-forward" size={16} color={a.grad[0]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent updates */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>{t('family.recent_updates')}</Text>
          {updates.length === 0 ? (
            <View style={S.emptyWrap}><Ionicons name="notifications-off-outline" size={40} color="#E2E8F0" /><Text style={S.emptyText}>{t('family.no_updates')}</Text></View>
          ) : updates.slice(0,4).map(u => (
            <View key={u.id} style={S.updateRow}>
              <View style={S.updateIcon}><Ionicons name="notifications" size={16} color="#7C3AED" /></View>
              <View style={S.updateBody}>
                <Text style={S.updateTitle} numberOfLines={1}>{u.translatedTitle}</Text>
                <Text style={S.updateMsg} numberOfLines={1}>{u.translatedMessage}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Notifications sheet */}
      <Modal visible={showNotif} animationType="slide" transparent onRequestClose={() => setShowNotif(false)}>
        <View style={S.sheetOverlay}>
          <View style={S.sheet}>
            <View style={S.sheetHandle} />
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{t('dashboard.notifications')}</Text>
              <TouchableOpacity onPress={() => setShowNotif(false)}><Ionicons name="close" size={22} color="#64748B" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}>
              {updates.length===0 ? (
                <View style={S.emptyWrap}><Ionicons name="notifications-off-outline" size={48} color="#E2E8F0" /><Text style={S.emptyText}>{t('dashboard.no_notifications')}</Text></View>
              ) : updates.map(u => (
                <View key={u.id} style={S.notifCard}>
                  <View style={[S.notifIcon,{backgroundColor:'#EDE9FE'}]}><Ionicons name="notifications" size={16} color="#7C3AED" /></View>
                  <View style={{flex:1}}>
                    <Text style={S.notifTitle}>{u.translatedTitle}</Text>
                    <Text style={S.notifMsg} numberOfLines={2}>{u.translatedMessage}</Text>
                    <Text style={{fontSize:10,color:'#CBD5E1',marginTop:4}}>{new Date(u.createdAt).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F1F5F9' },
  scroll: { paddingBottom:80 },
  hero: { paddingTop:8, paddingBottom:28, paddingHorizontal:20 },
  heroTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
  heroGreet: { fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:2 },
  heroName: { fontSize:22, fontWeight:'800', color:'#fff', letterSpacing:-0.3 },
  heroRole: { fontSize:12, color:'rgba(255,255,255,0.65)', marginTop:2 },
  notifBtn: { width:42, height:42, borderRadius:21, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center' },
  badge: { position:'absolute', top:8, right:8, width:10, height:10, borderRadius:5, backgroundColor:'#EF4444', borderWidth:1.5, borderColor:'rgba(255,255,255,0.8)' },
  statCards: { flexDirection:'row', gap:10 },
  statCard: { flex:1, backgroundColor:'rgba(255,255,255,0.18)', borderRadius:14, padding:14, alignItems:'center', gap:6 },
  statIconWrap: { width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center' },
  statVal: { fontSize:22, fontWeight:'800', color:'#fff' },
  statLbl: { fontSize:10, color:'rgba(255,255,255,0.75)', textAlign:'center' },
  section: { marginHorizontal:16, marginTop:20 },
  sectionTitle: { fontSize:16, fontWeight:'700', color:'#1E293B', marginBottom:12 },
  actionsRow: { flexDirection:'row', gap:12, marginBottom:12 },
  halfCard: { flex:1, borderRadius:20, overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.2, shadowRadius:16, elevation:6 },
  halfCardGrad: { padding:18, minHeight:165, justifyContent:'space-between', overflow:'hidden' },
  halfDecorCircle: { position:'absolute', width:100, height:100, borderRadius:50, backgroundColor:'rgba(255,255,255,0.08)', top:-30, right:-30 },
  halfCardIcon: { width:52, height:52, borderRadius:16, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center', marginBottom:12 },
  halfCardTitle: { fontSize:14, fontWeight:'800', color:'#fff', letterSpacing:-0.2 },
  halfCardSub: { fontSize:11, color:'rgba(255,255,255,0.72)', lineHeight:15, marginTop:3 },
  halfCardArrow: { width:28, height:28, borderRadius:14, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center', alignSelf:'flex-end', marginTop:8 },
  updateRow: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:8, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4, elevation:1 },
  updateIcon: { width:34, height:34, borderRadius:17, backgroundColor:'#EDE9FE', justifyContent:'center', alignItems:'center' },
  updateBody: { flex:1 },
  updateTitle: { fontSize:14, fontWeight:'600', color:'#1E293B' },
  updateMsg: { fontSize:12, color:'#94A3B8', marginTop:2 },
  emptyWrap: { alignItems:'center', paddingVertical:32, gap:10 },
  emptyText: { fontSize:13, color:'#94A3B8' },
  outlineCard: { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'#fff', borderRadius:20, padding:16, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.08, shadowRadius:12, elevation:3, borderWidth:1, borderColor:'#F1F5F9', marginBottom:12 },
  outlineIconWrap: { width:52, height:52, borderRadius:16, justifyContent:'center', alignItems:'center' },
  outlineIconGrad: { width:44, height:44, borderRadius:14, justifyContent:'center', alignItems:'center' },
  outlineText: { flex:1 },
  outlineTitle: { fontSize:15, fontWeight:'800', color:'#0F172A' },
  outlineSub: { fontSize:12, color:'#94A3B8', marginTop:3 },
  outlineArrowWrap: { width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center' },
  sheetOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet: { backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'80%' },
  sheetHandle: { width:40, height:4, borderRadius:2, backgroundColor:'#E2E8F0', alignSelf:'center', marginTop:10 },
  sheetHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, borderBottomWidth:1, borderBottomColor:'#F1F5F9' },
  sheetTitle: { fontSize:18, fontWeight:'700', color:'#1E293B' },
  notifCard: { flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:'#F8FAFC', borderRadius:12, padding:12, marginBottom:10 },
  notifIcon: { width:32, height:32, borderRadius:16, justifyContent:'center', alignItems:'center' },
  notifTitle: { fontSize:14, fontWeight:'600', color:'#1E293B' },
  notifMsg: { fontSize:12, color:'#64748B', marginTop:2 },
});
