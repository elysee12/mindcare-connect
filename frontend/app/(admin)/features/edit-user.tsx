import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Input, LocationPicker } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

const ROLE_META: Record<string, { grad: [string,string]; icon: any }> = {
  MHP:    { grad: ['#064E3B','#2EB67D'], icon: 'medkit' },
  CHW:    { grad: ['#1E3A8A','#3B82F6'], icon: 'walk' },
  FAMILY: { grad: ['#4C1D95','#8B5CF6'], icon: 'people' },
  ADMIN:  { grad: ['#78350F','#F59E0B'], icon: 'shield-checkmark' },
};

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return <Text style={S.fieldLabel}>{label}{required && <Text style={{ color: '#EF4444' }}> *</Text>}</Text>;
}

function SectionCard({ icon, title, accentColor, children }: { icon: any; title: string; accentColor: string; children: React.ReactNode }) {
  return (
    <View style={S.sectionCard}>
      <View style={S.sectionHeader}>
        <View style={[S.sectionIconWrap, { backgroundColor: accentColor + '18' }]}>
          <Ionicons name={icon} size={15} color={accentColor} />
        </View>
        <Text style={S.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function EditUser() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [role, setRole]         = useState('');
  const [workplace, setWorkplace] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [sector, setSector]     = useState('');
  const [cell, setCell]         = useState('');
  const [village, setVillage]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState('');
  const [toastOk, setToastOk]   = useState(true);

  const showToast = (msg: string, ok = true) => { setToast(msg); setToastOk(ok); setTimeout(() => setToast(''), 3000); };

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.userById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRole(user.role || '');
      setWorkplace(user.workplace || '');
      setProvince((user as any).province || '');
      setDistrict(user.district || '');
      setSector(user.sector || '');
      setCell(user.cell || '');
      setVillage(user.village || '');
    }
  }, [user]);

  const roleMeta = ROLE_META[role?.toUpperCase()] || ROLE_META.ADMIN;
  const accentColor = roleMeta.grad[1];

  const save = async () => {
    if (!fullName || !email || !phone || !role) { showToast('Please fill in all required fields.', false); return; }
    if (role === 'MHP' && !workplace) { showToast('Please enter workplace for MHP.', false); return; }
    if (role === 'CHW' && (!province || !district || !sector || !cell || !village)) { showToast('Please fill in all CHW address fields.', false); return; }
    setSaving(true);
    try {
      await api.updateUser(id!, {
        fullName, email, phone, role,
        workplace: role === 'MHP' ? workplace : undefined,
        province:  role === 'CHW' ? province  : undefined,
        district:  role === 'CHW' ? district  : undefined,
        sector:    role === 'CHW' ? sector    : undefined,
        cell:      role === 'CHW' ? cell      : undefined,
        village:   role === 'CHW' ? village   : undefined,
      });
      showToast('User updated successfully.');
      setTimeout(() => router.back(), 1200);
    } catch (e: any) {
      showToast(e?.message || 'Unable to update user.', false);
    } finally { setSaving(false); }
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <LinearGradient colors={roleMeta.grad} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Edit User</Text>
          <Text style={S.headerSub}>{fullName || 'Loading…'}</Text>
        </View>
        <View style={[S.roleChip, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name={roleMeta.icon} size={14} color="#fff" />
          <Text style={S.roleChipText}>{role || '—'}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={S.centered}><ActivityIndicator size="large" color={accentColor} /></View>
        ) : isError ? (
          <View style={S.centered}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={S.errorText}>Unable to load user information.</Text>
          </View>
        ) : (
          <>
            <SectionCard icon="person-outline" title="Personal Information" accentColor={accentColor}>
              <View style={S.fieldWrap}>
                <FieldLabel label="Full Name" required />
                <Input value={fullName} onChangeText={setFullName} placeholder="Full Name" autoCapitalize="words" clearable />
              </View>
              <View style={S.fieldWrap}>
                <FieldLabel label="Email" required />
                <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" clearable />
              </View>
              <View style={S.fieldWrap}>
                <FieldLabel label="Phone" required />
                <Input value={phone} onChangeText={setPhone} placeholder="+250 7XX XXX XXX" keyboardType="phone-pad" clearable />
              </View>
            </SectionCard>

            {role === 'MHP' && (
              <SectionCard icon="business-outline" title="Professional Details" accentColor={accentColor}>
                <View style={S.fieldWrap}>
                  <FieldLabel label="Workplace" required />
                  <Input value={workplace} onChangeText={setWorkplace} placeholder="Hospital or Health Center" clearable />
                </View>
              </SectionCard>
            )}

            {role === 'CHW' && (
              <SectionCard icon="location-outline" title="Catchment Area" accentColor={accentColor}>
                <View style={S.fieldWrap}>
                  <LocationPicker
                    province={province} district={district} sector={sector} cell={cell} village={village}
                    onProvinceChange={setProvince} onDistrictChange={setDistrict}
                    onSectorChange={setSector} onCellChange={setCell} onVillageChange={setVillage}
                  />
                </View>
              </SectionCard>
            )}

            <TouchableOpacity style={[S.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving} activeOpacity={0.85}>
              <LinearGradient colors={roleMeta.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.saveBtnGrad}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={S.saveBtnText}>Save Changes</Text></>
                }
              </LinearGradient>
            </TouchableOpacity>
          </>
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

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  roleChipText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  scroll: { padding: 16, paddingBottom: 80 },
  centered: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  errorText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  sectionIconWrap: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  fieldWrap: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1E293B', borderRadius: 14, padding: 14 },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff', flex: 1 },
});
