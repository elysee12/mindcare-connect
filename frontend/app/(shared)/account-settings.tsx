import React, { useMemo, useState, useEffect } from 'react';
import {
  View, StyleSheet, Text, ScrollView, TouchableOpacity,
  Alert, Switch, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Input, LocationPicker } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type TabType = 'profile' | 'privacy' | 'notifications' | 'help';

const ROLE_GRAD: Record<string, [string, string]> = {
  mhp:    ['#064E3B', '#2EB67D'],
  chw:    ['#1E3A8A', '#3B82F6'],
  family: ['#4C1D95', '#8B5CF6'],
  admin:  ['#78350F', '#F59E0B'],
};

const TABS: { key: TabType; icon: any; label: string }[] = [
  { key: 'profile',       icon: 'person-outline',         label: 'Profile' },
  { key: 'privacy',       icon: 'shield-outline',         label: 'Security' },
  { key: 'notifications', icon: 'notifications-outline',  label: 'Alerts' },
  { key: 'help',          icon: 'help-circle-outline',    label: 'Help' },
];

export default function AccountSettings() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const { role = 'chw', tab: initialTab = 'profile' } = useLocalSearchParams<{ role?: string; tab?: TabType }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab]   = useState<TabType>(initialTab as TabType);
  const [toast, setToast]           = useState('');
  const [toastOk, setToastOk]       = useState(true);
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);
  const [showCurPwd, setShowCurPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfNewPwd, setShowConfNewPwd] = useState(false);

  const [pv, setPv] = useState({
    fullName: '', email: '', phone: '', workplace: '',
    province: '', district: '', sector: '', cell: '', village: '',
    password: '', confirmPassword: '',
  });
  const [pwdV, setPwdV] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifV, setNotifV] = useState({ reminders: true, updates: true, offers: false });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => api.userById(String(user?.id)),
    enabled: !!user?.id, staleTime: 1000 * 60,
  });

  useEffect(() => {
    const src = userProfile || user;
    if (src) {
      setPv({
        fullName: (src as any).fullName || (src as any).full_name || '',
        email: src.email || '',
        phone: src.phone || '',
        workplace: src.workplace || '',
        province: (src as any).province || '',
        district: src.district || '',
        sector: src.sector || '',
        cell: src.cell || '',
        village: src.village || '',
        password: '', confirmPassword: '',
      });
    }
  }, [user, userProfile]);

  const currentRole = (userProfile?.role || user?.role || role || 'chw').toString().toLowerCase();
  const grad = ROLE_GRAD[currentRole] || ROLE_GRAD.chw;
  const accentColor = grad[1];
  const roleLabel = t(`status_values.${currentRole.toUpperCase()}`, { defaultValue: currentRole.toUpperCase() });

  const showToast = (msg: string, ok = true) => {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(''), 3000);
  };

  const updateProfile = useMutation({
    mutationFn: (data: any) => api.updateUser(user?.id || '', data),
    onSuccess: (u) => {
      if (user) setUser({ ...user, fullName: u.fullName, full_name: u.fullName, email: u.email, phone: u.phone, workplace: u.workplace, province: u.province, district: u.district, sector: u.sector, cell: u.cell, village: u.village, role: u.role || currentRole });
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      setPv(p => ({ ...p, password: '', confirmPassword: '' }));
      showToast(t('account_settings.profile_updated'));
    },
    onError: (e: any) => showToast(e.message || t('common.error'), false),
  });

  const updatePassword = useMutation({
    mutationFn: async (d: { currentPassword: string; newPassword: string }) => {
      await api.login(user?.email || '', d.currentPassword);
      return api.updateUser(user?.id || '', { password: d.newPassword });
    },
    onSuccess: () => { setPwdV({ currentPassword: '', newPassword: '', confirmPassword: '' }); showToast(t('account_settings.password_updated')); },
    onError: (e: any) => showToast(e.message || t('common.error'), false),
  });

  const handleSave = () => {
    if (activeTab === 'profile') {
      if (!pv.fullName.trim()) { Alert.alert(t('common.error'), t('account_settings.name_required')); return; }
      if (!pv.email.trim())    { Alert.alert(t('common.error'), t('account_settings.email_required')); return; }
      if (pv.password) {
        if (pv.password.length < 8) { Alert.alert(t('common.error'), t('account_settings.password_min')); return; }
        if (pv.password !== pv.confirmPassword) { Alert.alert(t('common.error'), t('account_settings.password_mismatch')); return; }
      }
      const payload: any = { fullName: pv.fullName.trim(), email: pv.email.trim(), phone: pv.phone || undefined, workplace: pv.workplace || undefined, province: pv.province || undefined, district: pv.district || undefined, sector: pv.sector || undefined, cell: pv.cell || undefined, village: pv.village || undefined };
      if (pv.password) payload.password = pv.password;
      updateProfile.mutate(payload);
    } else if (activeTab === 'privacy') {
      if (!pwdV.currentPassword) { Alert.alert(t('common.error'), t('account_settings.current_password_required')); return; }
      if (pwdV.newPassword.length < 8) { Alert.alert(t('common.error'), t('account_settings.password_min')); return; }
      if (pwdV.newPassword !== pwdV.confirmPassword) { Alert.alert(t('common.error'), t('account_settings.password_mismatch')); return; }
      updatePassword.mutate({ currentPassword: pwdV.currentPassword, newPassword: pwdV.newPassword });
    } else {
      showToast(t('account_settings.settings_saved'));
    }
  };

  const isPending = updateProfile.isPending || updatePassword.isPending;

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Gradient header */}
      <LinearGradient colors={grad} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('account_settings.title')}</Text>
          <Text style={S.headerSub}>{roleLabel}</Text>
        </View>
      </LinearGradient>

      {/* Tab bar */}
      <View style={S.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={S.tab} onPress={() => setActiveTab(tab.key)}>
              <View style={[S.tabIconWrap, active && { backgroundColor: accentColor + '18' }]}>
                <Ionicons name={tab.icon} size={18} color={active ? accentColor : '#94A3B8'} />
              </View>
              <Text style={[S.tabLabel, active && { color: accentColor, fontWeight: '700' }]}>{tab.label}</Text>
              {active && <View style={[S.tabUnderline, { backgroundColor: accentColor }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {activeTab === 'profile' && <ProfileTab pv={pv} setPv={setPv} currentRole={currentRole} showPwd={showPwd} setShowPwd={setShowPwd} showConfPwd={showConfPwd} setShowConfPwd={setShowConfPwd} roleLabel={roleLabel} t={t} accentColor={accentColor} />}
        {activeTab === 'privacy' && <PrivacyTab pwdV={pwdV} setPwdV={setPwdV} showCurPwd={showCurPwd} setShowCurPwd={setShowCurPwd} showNewPwd={showNewPwd} setShowNewPwd={setShowNewPwd} showConfNewPwd={showConfNewPwd} setShowConfNewPwd={setShowConfNewPwd} t={t} accentColor={accentColor} />}
        {activeTab === 'notifications' && <NotifTab notifV={notifV} setNotifV={setNotifV} t={t} accentColor={accentColor} />}
        {activeTab === 'help' && <HelpTab t={t} accentColor={accentColor} />}

        {/* Save button */}
        {(activeTab === 'profile' || activeTab === 'privacy') && (
          <TouchableOpacity style={[S.saveBtn, { backgroundColor: accentColor }, isPending && { opacity: 0.7 }]} onPress={handleSave} disabled={isPending}>
            {isPending ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="checkmark-circle-outline" size={18} color="#fff" /><Text style={S.saveBtnText}>{t('account_settings.save_btn')} {activeTab === 'profile' ? t('profile.edit_profile') : t('profile.privacy_security')}</Text></>}
          </TouchableOpacity>
        )}
        {activeTab === 'notifications' && (
          <TouchableOpacity style={[S.saveBtn, { backgroundColor: accentColor }]} onPress={handleSave}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={S.saveBtnText}>Save Preferences</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {toast ? (
        <View style={[S.toast, !toastOk && { backgroundColor: '#EF4444' }]}>
          <Ionicons name={toastOk ? 'checkmark-circle' : 'alert-circle'} size={16} color="#fff" />
          <Text style={S.toastText}>{toast}</Text>
        </View>
      ) : null}
    </Container>
  );
}

// ── Tab content components ────────────────────────────────────────────────────
function FieldLabel({ label }: { label: string }) {
  return <Text style={S.fieldLabel}>{label}</Text>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={S.sectionWrap}>
      <Text style={S.sectionTitle}>{title}</Text>
      <View style={S.sectionCard}>{children}</View>
    </View>
  );
}

function ProfileTab({ pv, setPv, currentRole, showPwd, setShowPwd, showConfPwd, setShowConfPwd, roleLabel, t, accentColor }: any) {
  return (
    <View style={{ gap: 0 }}>
      <Section title={t('account_settings.personal_info')}>
        <View style={S.fieldWrap}>
          <FieldLabel label={t('account_settings.full_name')} />
          <Input value={pv.fullName} onChangeText={(v: string) => setPv((p: any) => ({ ...p, fullName: v }))} clearable />
        </View>
        <View style={S.fieldWrap}>
          <FieldLabel label={t('account_settings.email')} />
          <Input value={pv.email} onChangeText={(v: string) => setPv((p: any) => ({ ...p, email: v }))} keyboardType="email-address" clearable />
        </View>
        <View style={S.fieldWrap}>
          <FieldLabel label={t('account_settings.phone')} />
          <Input value={pv.phone} onChangeText={(v: string) => setPv((p: any) => ({ ...p, phone: v }))} keyboardType="phone-pad" clearable />
        </View>
      </Section>

      {(currentRole === 'mhp' || currentRole === 'admin') && (
        <Section title={t('account_settings.professional_info')}>
          <View style={S.fieldWrap}>
            <FieldLabel label={t('account_settings.workplace')} />
            <Input value={pv.workplace} onChangeText={(v: string) => setPv((p: any) => ({ ...p, workplace: v }))} clearable />
          </View>
        </Section>
      )}

      {(currentRole === 'chw' || currentRole === 'family') && (
        <Section title={t('account_settings.location_info')}>
          <LocationPicker
            province={pv.province} district={pv.district} sector={pv.sector} cell={pv.cell} village={pv.village}
            onProvinceChange={(v: string) => setPv((p: any) => ({ ...p, province: v }))}
            onDistrictChange={(v: string) => setPv((p: any) => ({ ...p, district: v }))}
            onSectorChange={(v: string) => setPv((p: any) => ({ ...p, sector: v }))}
            onCellChange={(v: string) => setPv((p: any) => ({ ...p, cell: v }))}
            onVillageChange={(v: string) => setPv((p: any) => ({ ...p, village: v }))}
          />
        </Section>
      )}

      <Section title={t('account_settings.security')}>
        <View style={S.fieldWrap}>
          <FieldLabel label={t('account_settings.password')} />
          <Input value={pv.password} onChangeText={(v: string) => setPv((p: any) => ({ ...p, password: v }))} secureTextEntry={!showPwd}
            rightIcon={<TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{ padding: 4 }}><Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" /></TouchableOpacity>} clearable />
        </View>
        <View style={S.fieldWrap}>
          <FieldLabel label={t('account_settings.confirm_password')} />
          <Input value={pv.confirmPassword} onChangeText={(v: string) => setPv((p: any) => ({ ...p, confirmPassword: v }))} secureTextEntry={!showConfPwd}
            rightIcon={<TouchableOpacity onPress={() => setShowConfPwd(!showConfPwd)} style={{ padding: 4 }}><Ionicons name={showConfPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" /></TouchableOpacity>} clearable />
        </View>
      </Section>

      <View style={S.roleChip}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#64748B" />
        <Text style={S.roleChipText}>{t('account_settings.role_label')}: {roleLabel}</Text>
      </View>
    </View>
  );
}

function PrivacyTab({ pwdV, setPwdV, showCurPwd, setShowCurPwd, showNewPwd, setShowNewPwd, showConfNewPwd, setShowConfNewPwd, t, accentColor }: any) {
  return (
    <Section title={t('account_settings.change_password')}>
      <View style={S.fieldWrap}>
        <FieldLabel label={t('account_settings.current_password')} />
        <Input value={pwdV.currentPassword} onChangeText={(v: string) => setPwdV((p: any) => ({ ...p, currentPassword: v }))} secureTextEntry={!showCurPwd}
          rightIcon={<TouchableOpacity onPress={() => setShowCurPwd(!showCurPwd)} style={{ padding: 4 }}><Ionicons name={showCurPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" /></TouchableOpacity>} clearable />
      </View>
      <View style={S.fieldWrap}>
        <FieldLabel label={t('account_settings.new_password')} />
        <Input value={pwdV.newPassword} onChangeText={(v: string) => setPwdV((p: any) => ({ ...p, newPassword: v }))} secureTextEntry={!showNewPwd}
          rightIcon={<TouchableOpacity onPress={() => setShowNewPwd(!showNewPwd)} style={{ padding: 4 }}><Ionicons name={showNewPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" /></TouchableOpacity>} clearable />
      </View>
      <View style={S.fieldWrap}>
        <FieldLabel label={t('account_settings.confirm_new_password')} />
        <Input value={pwdV.confirmPassword} onChangeText={(v: string) => setPwdV((p: any) => ({ ...p, confirmPassword: v }))} secureTextEntry={!showConfNewPwd}
          rightIcon={<TouchableOpacity onPress={() => setShowConfNewPwd(!showConfNewPwd)} style={{ padding: 4 }}><Ionicons name={showConfNewPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" /></TouchableOpacity>} clearable />
      </View>
      <View style={S.pwdHint}>
        <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
        <Text style={S.pwdHintText}>Password must be at least 8 characters</Text>
      </View>
    </Section>
  );
}

function NotifTab({ notifV, setNotifV, t, accentColor }: any) {
  const items = [
    { key: 'reminders', label: t('account_settings.reminders'), desc: 'Appointment & medication reminders' },
    { key: 'updates',   label: t('account_settings.appointment_updates'), desc: 'Status changes & updates' },
    { key: 'offers',    label: t('account_settings.offers_news'), desc: 'News and announcements' },
  ];
  return (
    <Section title="Notification Preferences">
      {items.map((item, i) => (
        <View key={item.key} style={[S.toggleRow, i < items.length - 1 && S.toggleBorder]}>
          <View style={S.toggleLeft}>
            <Text style={S.toggleLabel}>{item.label}</Text>
            <Text style={S.toggleDesc}>{item.desc}</Text>
          </View>
          <Switch
            value={notifV[item.key as keyof typeof notifV]}
            onValueChange={v => setNotifV((p: any) => ({ ...p, [item.key]: v }))}
            trackColor={{ false: '#E2E8F0', true: accentColor + '60' }}
            thumbColor={notifV[item.key as keyof typeof notifV] ? accentColor : '#fff'}
          />
        </View>
      ))}
    </Section>
  );
}

function HelpTab({ t, accentColor }: any) {
  const items = [
    { icon: 'chatbubble-outline' as const,    title: 'Contact Support',    desc: 'Get help from our team' },
    { icon: 'document-text-outline' as const, title: 'Documentation',      desc: 'Read the user guide' },
    { icon: 'call-outline' as const,          title: 'Phone Support',      desc: t('account_settings.help_phone') },
    { icon: 'information-circle-outline' as const, title: 'About',         desc: 'App version & info' },
  ];
  return (
    <Section title="Help & Support">
      {items.map((item, i) => (
        <TouchableOpacity key={item.title} style={[S.helpRow, i < items.length - 1 && S.toggleBorder]} activeOpacity={0.7}>
          <View style={[S.helpIcon, { backgroundColor: accentColor + '15' }]}>
            <Ionicons name={item.icon} size={18} color={accentColor} />
          </View>
          <View style={S.helpText}>
            <Text style={S.helpTitle}>{item.title}</Text>
            <Text style={S.helpDesc}>{item.desc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        </TouchableOpacity>
      ))}
    </Section>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4, position: 'relative' },
  tabIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, borderRadius: 1 },
  scroll: { padding: 16, paddingBottom: 80 },
  sectionWrap: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingLeft: 4 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  fieldWrap: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 16 },
  roleChipText: { fontSize: 13, color: '#64748B' },
  pwdHint: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
  pwdHintText: { fontSize: 12, color: '#94A3B8' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  toggleBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  toggleLeft: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  toggleDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  helpIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  helpText: { flex: 1 },
  helpTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  helpDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16, marginBottom: 16 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1E293B', borderRadius: 14, padding: 14 },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff', flex: 1 },
});
