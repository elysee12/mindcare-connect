import React, { useState } from 'react';
import {
  View, StyleSheet, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Input, LocationPicker } from '@/components/ui';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

// ── Role definitions ──────────────────────────────────────────────────────────
const ROLES = [
  {
    key: 'MHP',
    label: 'Mental Health Professional',
    shortLabel: 'MHP',
    icon: 'medkit' as const,
    grad: ['#064E3B', '#2EB67D'] as [string, string],
    desc: 'Doctors & mental health specialists',
  },
  {
    key: 'CHW',
    label: 'Community Health Worker',
    shortLabel: 'CHW',
    icon: 'walk' as const,
    grad: ['#1E3A8A', '#3B82F6'] as [string, string],
    desc: 'Field workers & community agents',
  },
  {
    key: 'NURSE',
    label: 'Nurse',
    shortLabel: 'NURSE',
    icon: 'bandage' as const,
    grad: ['#7C3AED', '#A78BFA'] as [string, string],
    desc: 'Nursing & clinical support',
  },
];

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={S.fieldLabel}>
      {label}{required && <Text style={{ color: '#EF4444' }}> *</Text>}
    </Text>
  );
}

function SectionCard({ icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <View style={S.sectionCard}>
      <View style={S.sectionHeader}>
        <View style={S.sectionIconWrap}>
          <Ionicons name={icon} size={15} color="#F59E0B" />
        </View>
        <Text style={S.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function AddUser() {
  const router = useRouter();
  const { t } = useTranslation();

  const [selectedRole, setSelectedRole] = useState('');
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [phone, setPhone]               = useState('');
  const [workplace, setWorkplace]       = useState('');
  const [province, setProvince]         = useState('');
  const [district, setDistrict]         = useState('');
  const [sector, setSector]             = useState('');
  const [cell, setCell]                 = useState('');
  const [village, setVillage]           = useState('');
  const [loading, setLoading]           = useState(false);

  const activeRole = ROLES.find(r => r.key === selectedRole);

  const save = async () => {
    if (!selectedRole || !fullName || !email || !phone) {
      Alert.alert(t('add_user.missing_fields'), t('add_user.missing_fields_msg'));
      return;
    }
    if (selectedRole === 'MHP' && !workplace) {
      Alert.alert(t('add_user.missing_workplace'), t('add_user.missing_workplace_msg'));
      return;
    }
    if (selectedRole === 'CHW' && (!province || !district || !sector || !cell || !village)) {
      Alert.alert(t('add_user.missing_address'), t('add_user.missing_address_msg'));
      return;
    }
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      Alert.alert(t('add_user.invalid_name'), t('add_user.invalid_name_msg'));
      return;
    }
    const password = nameParts[nameParts.length - 1] + '@123';
    if (password.length < 8) {
      Alert.alert(t('add_user.password_error'), t('add_user.password_error_msg'));
      return;
    }

    setLoading(true);
    try {
      await api.createUser({
        fullName, email, password, role: selectedRole, phone,
        workplace: selectedRole === 'MHP' ? workplace : undefined,
        province:  selectedRole === 'CHW' ? province  : undefined,
        district:  selectedRole === 'CHW' ? district  : undefined,
        sector:    selectedRole === 'CHW' ? sector    : undefined,
        cell:      selectedRole === 'CHW' ? cell      : undefined,
        village:   selectedRole === 'CHW' ? village   : undefined,
      });
      Alert.alert(
        t('add_user.success_title'),
        t('add_user.success_msg', { password, name: fullName }),
        [{ text: 'OK', onPress: () => {
          setSelectedRole(''); setFullName(''); setEmail(''); setPhone('');
          setWorkplace(''); setProvince(''); setDistrict(''); setSector(''); setCell(''); setVillage('');
          router.back();
        }}]
      );
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('already exists') || msg.includes('Email'))
        Alert.alert(t('add_user.email_exists'), t('add_user.email_exists_msg'));
      else if (msg.includes('Cannot reach backend'))
        Alert.alert(t('add_user.connection_error'), msg);
      else
        Alert.alert(t('add_user.create_error'), msg || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>

      {/* ── Gradient header ── */}
      <LinearGradient colors={['#B45309', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('add_user.title')}</Text>
          <Text style={S.headerSub}>{t('add_user.subtitle')}</Text>
        </View>
        {/* Decorative icon */}
        <View style={S.headerIcon}>
          <Ionicons name="person-add" size={22} color="rgba(255,255,255,0.6)" />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Step 1: Role selector ── */}
        <View style={S.stepWrap}>
          <View style={S.stepBadge}>
            <Text style={S.stepNum}>1</Text>
          </View>
          <Text style={S.stepLabel}>Select Role</Text>
        </View>

        <View style={S.roleRow}>
          {ROLES.map(role => {
            const active = selectedRole === role.key;
            return (
              <TouchableOpacity
                key={role.key}
                style={[S.roleCard, active && S.roleCardActive]}
                onPress={() => setSelectedRole(role.key)}
                activeOpacity={0.85}
              >
                {active ? (
                  <LinearGradient colors={role.grad} style={S.roleCardGrad}>
                    <View style={S.roleIconWrap}>
                      <Ionicons name={role.icon} size={26} color="#fff" />
                    </View>
                    <Text style={S.roleCardLabel}>{role.shortLabel}</Text>
                    <Text style={S.roleCardDesc} numberOfLines={2}>{role.desc}</Text>
                    <View style={S.roleCheck}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={S.roleCardInactive}>
                    <View style={[S.roleIconWrapInactive, { backgroundColor: role.grad[1] + '18' }]}>
                      <Ionicons name={role.icon} size={24} color={role.grad[1]} />
                    </View>
                    <Text style={[S.roleCardLabel, { color: '#1E293B' }]}>{role.shortLabel}</Text>
                    <Text style={[S.roleCardDesc, { color: '#94A3B8' }]} numberOfLines={2}>{role.desc}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Step 2: User details (shown after role selected) ── */}
        {selectedRole && (
          <>
            <View style={[S.stepWrap, { marginTop: 8 }]}>
              <View style={[S.stepBadge, { backgroundColor: activeRole?.grad[1] }]}>
                <Text style={S.stepNum}>2</Text>
              </View>
              <Text style={S.stepLabel}>Personal Information</Text>
            </View>

            <SectionCard icon="person-outline" title="Basic Details">
              <View style={S.fieldWrap}>
                <FieldLabel label={t('add_user.full_name')} required />
                <Input
                  placeholder="e.g. Jean Pierre HABIMANA"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
                <Text style={S.fieldHint}>Password will be: LastName@123</Text>
              </View>
              <View style={S.fieldWrap}>
                <FieldLabel label={t('add_user.email')} required />
                <Input
                  placeholder="user@mindcare.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={S.fieldWrap}>
                <FieldLabel label={t('add_user.phone')} required />
                <Input
                  placeholder="+250 7XX XXX XXX"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </SectionCard>

            {/* MHP: workplace */}
            {selectedRole === 'MHP' && (
              <>
                <View style={[S.stepWrap, { marginTop: 8 }]}>
                  <View style={[S.stepBadge, { backgroundColor: '#2EB67D' }]}>
                    <Text style={S.stepNum}>3</Text>
                  </View>
                  <Text style={S.stepLabel}>Professional Details</Text>
                </View>
                <SectionCard icon="business-outline" title="Workplace">
                  <View style={S.fieldWrap}>
                    <FieldLabel label={t('add_user.hospital')} required />
                    <Input
                      placeholder={t('add_user.hospital_placeholder')}
                      value={workplace}
                      onChangeText={setWorkplace}
                      autoCapitalize="words"
                    />
                  </View>
                </SectionCard>
              </>
            )}

            {/* CHW: location */}
            {selectedRole === 'CHW' && (
              <>
                <View style={[S.stepWrap, { marginTop: 8 }]}>
                  <View style={[S.stepBadge, { backgroundColor: '#3B82F6' }]}>
                    <Text style={S.stepNum}>3</Text>
                  </View>
                  <Text style={S.stepLabel}>Location Details</Text>
                </View>
                <SectionCard icon="location-outline" title="Catchment Area">
                  <View style={S.fieldWrap}>
                    <LocationPicker
                      province={province} district={district} sector={sector} cell={cell} village={village}
                      onProvinceChange={setProvince} onDistrictChange={setDistrict}
                      onSectorChange={setSector} onCellChange={setCell} onVillageChange={setVillage}
                    />
                  </View>
                </SectionCard>
              </>
            )}

            {/* ── Password preview ── */}
            {fullName.trim().split(/\s+/).length >= 2 && (
              <View style={S.pwdPreview}>
                <View style={S.pwdPreviewIcon}>
                  <Ionicons name="key-outline" size={16} color="#F59E0B" />
                </View>
                <View style={S.pwdPreviewBody}>
                  <Text style={S.pwdPreviewLabel}>Auto-generated password</Text>
                  <Text style={S.pwdPreviewValue}>
                    {fullName.trim().split(/\s+/).slice(-1)[0]}@123
                  </Text>
                </View>
                <View style={S.pwdPreviewBadge}>
                  <Text style={S.pwdPreviewBadgeText}>Share with user</Text>
                </View>
              </View>
            )}

            {/* ── Submit button ── */}
            <TouchableOpacity
              style={[S.submitBtn, loading && { opacity: 0.7 }]}
              onPress={save}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={activeRole?.grad || ['#B45309', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={S.submitGrad}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <Ionicons name="person-add-outline" size={18} color="#fff" />
                      <Text style={S.submitText}>{t('add_user.add_btn')}</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

          </>
        )}

        {/* Empty state when no role selected */}
        {!selectedRole && (
          <View style={S.emptyState}>
            <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={S.emptyIcon}>
              <Ionicons name="person-add-outline" size={36} color="#F59E0B" />
            </LinearGradient>
            <Text style={S.emptyTitle}>Choose a role to continue</Text>
            <Text style={S.emptySub}>Select MHP or CHW above to fill in the user details</Text>
          </View>
        )}

      </ScrollView>
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  scroll: { padding: 16, paddingBottom: 80 },

  // Step indicator
  stepWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F59E0B',
    justifyContent: 'center', alignItems: 'center',
  },
  stepNum: { fontSize: 12, fontWeight: '800', color: '#fff' },
  stepLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B' },

  // Role cards
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard: {
    flex: 1, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  roleCardActive: {
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  roleCardGrad: { padding: 16, minHeight: 140, gap: 6 },
  roleCardInactive: {
    padding: 16, minHeight: 140, gap: 6,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 18,
  },
  roleIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  roleIconWrapInactive: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  roleCardLabel: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  roleCardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 15 },
  roleCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Section card
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  fieldWrap: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  fieldHint: { fontSize: 11, color: '#94A3B8', marginTop: 5, fontStyle: 'italic' },

  // Password preview
  pwdPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 16,
  },
  pwdPreviewIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center', alignItems: 'center',
  },
  pwdPreviewBody: { flex: 1 },
  pwdPreviewLabel: { fontSize: 11, color: '#92400E', fontWeight: '600' },
  pwdPreviewValue: { fontSize: 15, fontWeight: '800', color: '#B45309', marginTop: 2, letterSpacing: 0.5 },
  pwdPreviewBadge: {
    backgroundColor: '#FDE68A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  pwdPreviewBadgeText: { fontSize: 10, fontWeight: '700', color: '#92400E' },

  // Submit
  submitBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  submitGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 24 },
});
