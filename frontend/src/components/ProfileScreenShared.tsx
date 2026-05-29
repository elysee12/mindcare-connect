/**
 * Shared Profile Screen — used by MHP, CHW, Family, Admin
 * Pass `roleColor` to tint the hero gradient per role.
 */
import React from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface Props {
  roleGradient?: [string, string];
}

export default function ProfileScreenShared({ roleGradient = ['#1a6b4a','#2EB67D'] }: Props) {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { t, i18n } = useTranslation();

  const { data: userProfile } = useQuery({
    queryKey: ['currentUserProfile', user?.id],
    queryFn: () => user?.id ? api.userById(String(user.id)) : null,
    enabled: !!user?.id,
    staleTime: 1000 * 30,
  });

  const myUser = userProfile || user || {};
  const currentRole = ((myUser as any).role || '').toString().toLowerCase();
  const displayRole = t(`status_values.${currentRole.toUpperCase()}`, { defaultValue: currentRole.toUpperCase() });
  const displayArea = (myUser as any).catchment_area || (myUser as any).workplace || '';
  const initials = ((myUser as any).fullName || (myUser as any).full_name || 'U').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), 'Are you sure you want to sign out?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: () => router.replace('/login') },
    ]);
  };

  const settingsGroups = [
    {
      title: t('profile.account_settings'),
      items: [
        { icon: 'person-outline' as const,           label: t('profile.edit_profile'),       route: `/(shared)/account-settings?role=${currentRole}` },
        { icon: 'shield-checkmark-outline' as const, label: t('profile.privacy_security'),   route: `/(shared)/account-settings?role=${currentRole}&tab=privacy` },
        { icon: 'notifications-outline' as const,    label: t('profile.push_notifications'), route: `/(shared)/account-settings?role=${currentRole}&tab=notifications` },
        { icon: 'help-circle-outline' as const,      label: t('profile.help_support'),       route: `/(shared)/account-settings?role=${currentRole}&tab=help` },
      ],
    },
    {
      title: t('profile.app_preferences'),
      items: [
        { icon: 'moon-outline' as const,  label: t('profile.dark_mode'), value: t('profile.system'),                                                    route: `/(shared)/app-preferences?role=${currentRole}&setting=dark_mode` },
        { icon: 'globe-outline' as const, label: t('profile.language'),  value: i18n.language==='rw'?t('common.kinyarwanda'):t('common.english'),       route: `/(shared)/app-preferences?role=${currentRole}&setting=language` },
      ],
    },
  ];

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* ── Hero ── */}
        <LinearGradient colors={roleGradient} start={{x:0,y:0}} end={{x:1,y:1}} style={S.hero}>
          <TouchableOpacity style={S.notifBtn} onPress={() => router.push('/(shared)/view-notifications')}>
            <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          <View style={S.avatarWrap}>
            <LinearGradient colors={['rgba(255,255,255,0.3)','rgba(255,255,255,0.15)']} style={S.avatar}>
              <Text style={S.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={S.onlineDot} />
          </View>

          <Text style={S.name}>{(myUser as any).fullName || (myUser as any).full_name || ''}</Text>
          <View style={S.rolePill}>
            <Text style={S.roleText}>{displayRole}{displayArea ? ` · ${displayArea}` : ''}</Text>
          </View>
          <Text style={S.email}>{(myUser as any).email || ''}</Text>
        </LinearGradient>

        {/* ── Settings groups ── */}
        <View style={S.body}>
          {settingsGroups.map(group => (
            <View key={group.title} style={S.group}>
              <Text style={S.groupTitle}>{group.title}</Text>
              <View style={S.groupCard}>
                {group.items.map((item, i) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[S.row, i < group.items.length-1 && S.rowBorder]}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={S.rowLeft}>
                      <View style={S.rowIconWrap}>
                        <Ionicons name={item.icon} size={18} color={roleGradient[1]} />
                      </View>
                      <Text style={S.rowLabel}>{item.label}</Text>
                    </View>
                    <View style={S.rowRight}>
                      {item.value && <Text style={S.rowValue}>{item.value}</Text>}
                      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout */}
          <TouchableOpacity style={S.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={S.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>

          <Text style={S.version}>{t('common.version')}</Text>
        </View>

      </ScrollView>
    </Container>
  );
}

function SettingsRow({ icon, label, value, last, onPress, accentColor }: any) {
  return (
    <TouchableOpacity style={[S.row, !last && S.rowBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={S.rowLeft}>
        <View style={[S.rowIconWrap, { backgroundColor: accentColor + '18' }]}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
        <Text style={S.rowLabel}>{label}</Text>
      </View>
      <View style={S.rowRight}>
        {value && <Text style={S.rowValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F1F5F9' },
  scroll: { paddingBottom:80 },

  hero: { paddingTop:12, paddingBottom:32, paddingHorizontal:24, alignItems:'center' },
  notifBtn: { alignSelf:'flex-end', padding:8, marginBottom:8 },
  avatarWrap: { position:'relative', marginBottom:14 },
  avatar: {
    width:88, height:88, borderRadius:44,
    justifyContent:'center', alignItems:'center',
    borderWidth:3, borderColor:'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize:30, fontWeight:'800', color:'#fff' },
  onlineDot: {
    position:'absolute', bottom:4, right:4,
    width:16, height:16, borderRadius:8,
    backgroundColor:'#4ADE80', borderWidth:2, borderColor:'#fff',
  },
  name: { fontSize:22, fontWeight:'800', color:'#fff', marginBottom:8 },
  rolePill: { backgroundColor:'rgba(255,255,255,0.2)', paddingHorizontal:14, paddingVertical:4, borderRadius:20, marginBottom:6 },
  roleText: { fontSize:12, fontWeight:'700', color:'rgba(255,255,255,0.95)' },
  email: { fontSize:13, color:'rgba(255,255,255,0.7)' },

  body: { padding:20, gap:20 },
  group: { gap:8 },
  groupTitle: { fontSize:11, fontWeight:'700', color:'#94A3B8', textTransform:'uppercase', letterSpacing:1, paddingLeft:4 },
  groupCard: {
    backgroundColor:'#fff', borderRadius:16, overflow:'hidden',
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:2,
  },
  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16 },
  rowBorder: { borderBottomWidth:1, borderBottomColor:'#F1F5F9' },
  rowLeft: { flexDirection:'row', alignItems:'center', gap:12 },
  rowIconWrap: { width:36, height:36, borderRadius:10, backgroundColor:'#EAF7F3', justifyContent:'center', alignItems:'center' },
  rowLabel: { fontSize:15, fontWeight:'500', color:'#1E293B' },
  rowRight: { flexDirection:'row', alignItems:'center', gap:6 },
  rowValue: { fontSize:13, color:'#94A3B8' },

  logoutBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
    backgroundColor:'#FEE2E2', borderRadius:14, padding:16,
  },
  logoutText: { fontSize:15, fontWeight:'700', color:'#EF4444' },
  version: { fontSize:11, color:'#CBD5E1', textAlign:'center' },
});
