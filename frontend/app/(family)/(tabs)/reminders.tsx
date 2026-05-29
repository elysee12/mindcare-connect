import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

function getReminderMeta(type: string, completed: boolean) {
  if (completed) return { icon:'checkmark-circle' as const, color:'#2EB67D', bg:'#EAF7F3', grad:['#EAF7F3','#D1FAE5'] as [string,string] };
  if (type==='medication') return { icon:'medkit-outline' as const, color:'#8B5CF6', bg:'#EDE9FE', grad:['#EDE9FE','#DDD6FE'] as [string,string] };
  if (type==='appointment') return { icon:'calendar-outline' as const, color:'#3B82F6', bg:'#DBEAFE', grad:['#DBEAFE','#BFDBFE'] as [string,string] };
  return { icon:'walk-outline' as const, color:'#F59E0B', bg:'#FEF3C7', grad:['#FEF3C7','#FDE68A'] as [string,string] };
}

const STATUS_COLOR: Record<string, string> = {
  ATTENDED: '#2EB67D',
  MISSED:   '#EF4444',
  PENDING:  '#F59E0B',
};

export default function RemindersScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', user?.id],
    queryFn: () => api.reminders(),
    enabled: !!user?.id,
  });

  const renderItem = ({ item }: { item: any }) => {
    const meta = getReminderMeta(item.type, item.completed);
    const statusColor = STATUS_COLOR[item.status] || '#94A3B8';
    return (
      <View style={[S.card, item.completed && S.cardDone]}>
        <LinearGradient colors={meta.grad} style={S.cardLeft}>
          <Ionicons name={meta.icon} size={24} color={meta.color} />
        </LinearGradient>
        <View style={S.cardBody}>
          <Text style={[S.cardTitle, item.completed && S.cardTitleDone]}>{item.title}</Text>
          <Text style={S.cardTime}>{item.time}</Text>
          {item.status && (
            <View style={[S.statusPill, { backgroundColor: statusColor+'18' }]}>
              <View style={[S.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[S.statusText, { color: statusColor }]}>
                {t(`status_values.${item.status}`, { defaultValue: item.status })}
              </Text>
            </View>
          )}
        </View>
        <Ionicons
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={26} color={item.completed ? '#2EB67D' : '#E2E8F0'}
        />
      </View>
    );
  };

  const pending   = reminders.filter((r: any) => !r.completed);
  const completed = reminders.filter((r: any) => r.completed);

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#7C3AED','#A78BFA']} style={S.header}>
        <Text style={S.headerTitle}>{t('family.patient_reminders')}</Text>
        <View style={S.headerStats}>
          <View style={S.headerStat}>
            <Text style={S.headerStatVal}>{pending.length}</Text>
            <Text style={S.headerStatLbl}>Pending</Text>
          </View>
          <View style={S.headerStatDiv} />
          <View style={S.headerStat}>
            <Text style={S.headerStatVal}>{completed.length}</Text>
            <Text style={S.headerStatLbl}>Done</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={reminders}
        keyExtractor={item => (item.id||Math.random()).toString()}
        renderItem={renderItem}
        contentContainerStyle={S.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.empty}>
            <LinearGradient colors={['#EDE9FE','#DDD6FE']} style={S.emptyIcon}>
              <Ionicons name="calendar-outline" size={44} color="#7C3AED" />
            </LinearGradient>
            <Text style={S.emptyTitle}>{t('family.no_reminders')}</Text>
            <Text style={S.emptySub}>No reminders scheduled yet</Text>
          </View>
        }
      />
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F1F5F9' },
  header: { paddingHorizontal:20, paddingTop:12, paddingBottom:24 },
  headerTitle: { fontSize:22, fontWeight:'800', color:'#fff', marginBottom:16 },
  headerStats: { flexDirection:'row', backgroundColor:'rgba(255,255,255,0.18)', borderRadius:14, padding:14 },
  headerStat: { flex:1, alignItems:'center' },
  headerStatVal: { fontSize:24, fontWeight:'800', color:'#fff' },
  headerStatLbl: { fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 },
  headerStatDiv: { width:1, backgroundColor:'rgba(255,255,255,0.25)', marginHorizontal:8 },
  list: { padding:16, paddingBottom:80 },
  card: {
    flexDirection:'row', alignItems:'center', gap:14,
    backgroundColor:'#fff', borderRadius:16, overflow:'hidden', marginBottom:12,
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:8, elevation:2,
  },
  cardDone: { opacity:0.65 },
  cardLeft: { width:64, alignSelf:'stretch', justifyContent:'center', alignItems:'center' },
  cardBody: { flex:1, paddingVertical:14, gap:4 },
  cardTitle: { fontSize:15, fontWeight:'700', color:'#1E293B' },
  cardTitleDone: { textDecorationLine:'line-through', color:'#94A3B8' },
  cardTime: { fontSize:12, color:'#94A3B8' },
  statusPill: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:8, paddingVertical:3, borderRadius:20, alignSelf:'flex-start', marginTop:2 },
  statusDot: { width:6, height:6, borderRadius:3 },
  statusText: { fontSize:11, fontWeight:'700' },
  empty: { alignItems:'center', paddingVertical:80, gap:16 },
  emptyIcon: { width:88, height:88, borderRadius:44, justifyContent:'center', alignItems:'center' },
  emptyTitle: { fontSize:17, fontWeight:'700', color:'#1E293B' },
  emptySub: { fontSize:13, color:'#94A3B8' },
});
