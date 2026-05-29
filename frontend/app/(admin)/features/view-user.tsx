import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const ROLE_META: Record<string, { grad: [string,string]; icon: any; color: string }> = {
  MHP:    { grad: ['#064E3B','#2EB67D'], icon: 'medkit',           color: '#2EB67D' },
  CHW:    { grad: ['#1E3A8A','#3B82F6'], icon: 'walk',             color: '#3B82F6' },
  FAMILY: { grad: ['#4C1D95','#8B5CF6'], icon: 'people',           color: '#8B5CF6' },
  ADMIN:  { grad: ['#78350F','#F59E0B'], icon: 'shield-checkmark', color: '#F59E0B' },
};

function InfoRow({ icon, label, value, accentColor }: { icon: any; label: string; value?: string | null; accentColor: string }) {
  if (!value) return null;
  return (
    <View style={S.infoRow}>
      <View style={[S.infoIconWrap, { backgroundColor: accentColor + '15' }]}>
        <Ionicons name={icon} size={14} color={accentColor} />
      </View>
      <View style={S.infoBody}>
        <Text style={S.infoLabel}>{label}</Text>
        <Text style={S.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ViewUser() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.userById(id!),
    enabled: !!id,
  });

  const roleMeta = ROLE_META[(user?.role || '').toUpperCase()] || ROLE_META.ADMIN;
  const accentColor = roleMeta.color;
  const initials = (user?.fullName || '?').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(t('view_user.delete_title'), t('view_user.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try { await api.deleteUser(id); Alert.alert(t('view_user.deleted'), t('view_user.deleted_msg')); router.back(); }
        catch (e: any) { Alert.alert(t('view_user.delete_error'), e?.message || ''); }
      }},
    ]);
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Gradient hero */}
      <LinearGradient colors={roleMeta.grad} style={S.hero}>
        <View style={S.heroNav}>
          <TouchableOpacity style={S.navBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={S.heroNavTitle}>{t('view_user.title')}</Text>
          <TouchableOpacity style={S.navBtn} onPress={() => router.push(`/(admin)/features/edit-user?id=${encodeURIComponent(id || '')}` as any)}>
            <Ionicons name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {!isLoading && !isError && user && (
          <View style={S.heroProfile}>
            <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']} style={S.heroAvatar}>
              <Text style={S.heroAvatarText}>{initials}</Text>
            </LinearGradient>
            <View style={S.heroInfo}>
              <Text style={S.heroName}>{user.fullName}</Text>
              <Text style={S.heroEmail}>{user.email}</Text>
              <View style={S.heroBadge}>
                <Ionicons name={roleMeta.icon} size={12} color="#fff" />
                <Text style={S.heroBadgeText}>{t(`status_values.${user.role}`, { defaultValue: user.role })}</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={S.centered}><ActivityIndicator size="large" color={accentColor} /></View>
        ) : isError || !user ? (
          <View style={S.centered}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={S.errorText}>{t('view_user.error')}</Text>
          </View>
        ) : (
          <>
            {/* Contact info */}
            <View style={S.card}>
              <Text style={S.cardTitle}>Contact Information</Text>
              <InfoRow icon="call-outline"   label={t('view_user.phone')}     value={user.phone}     accentColor={accentColor} />
              <InfoRow icon="mail-outline"   label={t('view_user.email')}     value={user.email}     accentColor={accentColor} />
              <InfoRow icon="business-outline" label={t('view_user.workplace')} value={user.workplace} accentColor={accentColor} />
            </View>

            {/* Location */}
            {(user.province || user.district || user.village) && (
              <View style={S.card}>
                <Text style={S.cardTitle}>Location</Text>
                <InfoRow icon="map-outline"      label={t('view_user.province')} value={user.province} accentColor={accentColor} />
                <InfoRow icon="location-outline" label={t('view_user.district')} value={user.district} accentColor={accentColor} />
                <InfoRow icon="navigate-outline" label={t('view_user.sector')}   value={user.sector}   accentColor={accentColor} />
                <InfoRow icon="home-outline"     label={t('view_user.cell')}     value={user.cell}     accentColor={accentColor} />
                <InfoRow icon="leaf-outline"     label={t('view_user.village')}  value={user.village}  accentColor={accentColor} />
              </View>
            )}

            {/* Timestamps */}
            <View style={S.card}>
              <Text style={S.cardTitle}>Account Details</Text>
              <InfoRow icon="time-outline"     label={t('view_user.created')} value={user.createdAt ? new Date(user.createdAt).toLocaleString() : undefined} accentColor={accentColor} />
              <InfoRow icon="refresh-outline"  label={t('view_user.updated')} value={user.updatedAt ? new Date(user.updatedAt).toLocaleString() : undefined} accentColor={accentColor} />
            </View>

            {/* Actions */}
            <View style={S.actionRow}>
              <TouchableOpacity
                style={[S.actionBtn, { backgroundColor: accentColor }]}
                onPress={() => router.push(`/(admin)/features/edit-user?id=${encodeURIComponent(id || '')}` as any)}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={S.actionBtnText}>{t('view_user.edit_btn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={S.deleteBtnText}>{t('view_user.delete_btn')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  hero: { paddingBottom: 24 },
  heroNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroNavTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  heroProfile: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20 },
  heroAvatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  heroAvatarText: { fontSize: 26, fontWeight: '800', color: '#fff' },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  scroll: { padding: 16, paddingBottom: 80 },
  centered: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  errorText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  infoIconWrap: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  infoBody: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#1E293B' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
