import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, Text, ScrollView, TouchableOpacity,
  Image, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Input, LocationPicker } from '@/components/ui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const STATUS_OPTS = ['Stable', 'Risk', 'Relapse'] as const;
const RISK_OPTS   = ['Low', 'Medium', 'High'] as const;
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Stable:  { color: '#2EB67D', bg: '#EAF7F3' },
  Risk:    { color: '#F59E0B', bg: '#FEF3C7' },
  Relapse: { color: '#EF4444', bg: '#FEE2E2' },
};
const RISK_COLORS: Record<string, { color: string; bg: string }> = {
  Low:    { color: '#2EB67D', bg: '#EAF7F3' },
  Medium: { color: '#F59E0B', bg: '#FEF3C7' },
  High:   { color: '#EF4444', bg: '#FEE2E2' },
};

function SectionHeader({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={S.sectionHeader}>
      <View style={S.sectionIconWrap}><Ionicons name={icon} size={16} color="#2EB67D" /></View>
      <Text style={S.sectionTitle}>{title}</Text>
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={S.fieldLabel}>
      {label}{required && <Text style={{ color: '#EF4444' }}> *</Text>}
    </Text>
  );
}

export default function RegisterPatient() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const { patientId, edit } = useLocalSearchParams<{ patientId?: string; edit?: string }>();
  const isEdit = edit === '1' && !!patientId;
  const queryClient = useQueryClient();

  const [name, setName]           = useState('');
  const [age, setAge]             = useState('');
  const [gender, setGender]       = useState('');
  const [contact, setContact]     = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [status, setStatus]       = useState('Stable');
  const [riskLevel, setRiskLevel] = useState('Low');
  const [photoUri, setPhotoUri]   = useState<string | null>(null);
  const [assignedChw, setAssignedChw]     = useState('');
  const [assignedFamily, setAssignedFamily] = useState('');
  const [familyName, setFamilyName]   = useState('');
  const [familyEmail, setFamilyEmail] = useState('');
  const [familyPhone, setFamilyPhone] = useState('');
  const [familyProvince, setFamilyProvince] = useState('');
  const [familyDistrict, setFamilyDistrict] = useState('');
  const [familySector, setFamilySector]     = useState('');
  const [familyCell, setFamilyCell]         = useState('');
  const [familyVillage, setFamilyVillage]   = useState('');
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showChwDrop, setShowChwDrop] = useState(false);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [sector, setSector]     = useState('');
  const [cell, setCell]         = useState('');
  const [village, setVillage]   = useState('');
  const [chwList, setChwList]   = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast]         = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    api.users(undefined, 'CHW').then(setChwList).catch(() => {});
    if (isEdit && patientId) {
      api.patientById(patientId).then(p => {
        setName(p.fullName || ''); setAge(String(p.age || '')); setGender(p.gender || '');
        setContact(p.contact || ''); setDiagnosis(p.diagnosis || '');
        setStatus(p.status || 'Stable'); setRiskLevel(p.riskLevel || 'Low');
        setProvince(p.province || ''); setDistrict(p.district || '');
        setSector(p.sector || ''); setCell(p.cell || ''); setVillage(p.village || '');
        setAssignedChw(p.assignedChwId || ''); setAssignedFamily(p.assignedFamilyId || '');
        setPhotoUri(p.photoUrl || null);
      }).catch(() => Alert.alert('Error', 'Failed to load patient data'));
    }
  }, [isEdit, patientId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert(t('register_patient.permission_needed'), t('register_patient.camera_permission')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', { uri, type: 'image/jpeg', name: `patient-${Date.now()}.jpg` } as any);
      const backendUrl = Constants.expoConfig?.extra?.BACKEND_URL;
      const res = await fetch(`${backendUrl}/api/upload`, { method: 'POST', body: formData, headers: { 'x-user-id': currentUser?.id || '' } });
      if (!res.ok) throw new Error('Upload failed');
      return (await res.json()).url;
    } catch { return null; }
  };

  const savePatientMutation = useMutation({
    mutationFn: async () => {
      if (!name || !age || !gender) { throw new Error(t('register_patient.required_fields')); }
      let finalPhoto = photoUri;
      if (photoUri?.startsWith('file://')) {
        showToast(t('register_patient.uploading'));
        finalPhoto = await uploadImage(photoUri) || null;
      }
      const payload: any = { fullName: name, age: Number(age), gender, contact, diagnosis, status, riskLevel, province, district, sector, cell, village, photoUrl: finalPhoto };
      if (assignedChw) payload.assignedChwId = Number(assignedChw);
      if (assignedFamily && assignedFamily !== 'None') payload.assignedFamilyId = Number(assignedFamily);
      if (isEdit && patientId) {
        await api.updatePatient(patientId, payload);
        return { success: true, type: 'update', name };
      } else {
        await api.createPatient(payload);
        return { success: true, type: 'create', name };
      }
    },
    onMutate: () => {
      setIsLoading(true);
      showToast(t('register_patient.saving'));
    },
    onSuccess: (data) => {
      // Invalidate all patient queries
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      // Invalidate dashboard stats too!
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      showToast(data.type === 'update' ? t('register_patient.patient_updated', { name: data.name }) : t('register_patient.patient_created', { name: data.name }));
      setTimeout(() => { setIsLoading(false); router.back(); }, 1500);
    },
    onError: (e: any) => {
      setIsLoading(false);
      setToast('');
      Alert.alert('Error', e.message || 'Failed to save patient');
    },
  });

  const savePatient = () => savePatientMutation.mutate();

  const saveFamilyMember = async () => {
    if (!familyName || !familyEmail || !familyPhone) { Alert.alert(t('register_patient.validation_error'), t('register_patient.family_required_fields')); return; }
    setIsLoading(true);
    try {
      const saved = await api.createUser({ fullName: familyName, email: familyEmail, password: 'Family@123', role: 'FAMILY', phone: familyPhone, province: familyProvince, district: familyDistrict, sector: familySector, cell: familyCell, village: familyVillage });
      setAssignedFamily(String(saved.id)); setShowFamilyModal(false); setIsLoading(false);
      Alert.alert(t('common.success'), t('register_patient.family_saved', { name: saved.fullName }));
    } catch (e: any) { setIsLoading(false); Alert.alert(t('common.error'), e.message || t('common.error')); }
  };

  const selectedChw = chwList.find(c => String(c.id) === String(assignedChw));

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#064E3B', '#2EB67D']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{isEdit ? t('register_patient.edit_title') : t('register_patient.title')}</Text>
          <Text style={S.headerSub}>{isEdit ? t('register_patient.edit_subtitle') : t('register_patient.subtitle')}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Photo ── */}
        <View style={S.photoSection}>
          <TouchableOpacity style={S.photoWrap} onPress={pickImage} activeOpacity={0.85}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={S.photo} />
            ) : (
              <LinearGradient colors={['#EAF7F3', '#D1FAE5']} style={S.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#2EB67D" />
              </LinearGradient>
            )}
            <View style={S.photoBadge}><Ionicons name="camera" size={14} color="#fff" /></View>
          </TouchableOpacity>
          <Text style={S.photoLabel}>{t('register_patient.select_photo')}</Text>
        </View>

        {/* ── Personal info ── */}
        <View style={S.card}>
          <SectionHeader icon="person-outline" title={t('account_settings.personal_info')} />
          <View style={S.fieldWrap}>
            <FieldLabel label={t('register_patient.full_name')} required />
            <Input placeholder={t('register_patient.full_name')} value={name} onChangeText={setName} autoCapitalize="words" />
          </View>
          <View style={S.fieldWrap}>
            <FieldLabel label={t('register_patient.age')} required />
            <Input placeholder="e.g. 35" value={age} onChangeText={setAge} keyboardType="numeric" />
          </View>
          <View style={S.fieldWrap}>
            <FieldLabel label={t('register_patient.gender')} required />
            <View style={S.genderRow}>
              {['Male', 'Female'].map(g => (
                <TouchableOpacity key={g} style={[S.genderBtn, gender === g && S.genderBtnActive]} onPress={() => setGender(g)}>
                  <Ionicons name={g === 'Male' ? 'male' : 'female'} size={16} color={gender === g ? '#fff' : '#64748B'} />
                  <Text style={[S.genderText, gender === g && S.genderTextActive]}>{t(`register_patient.${g.toLowerCase()}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={S.fieldWrap}>
            <FieldLabel label={t('register_patient.contact_optional')} />
            <Input placeholder="+250 7XX XXX XXX" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
          </View>
          <View style={S.fieldWrap}>
            <FieldLabel label={t('register_patient.diagnosis')} />
            <Input placeholder="e.g. Depression, Anxiety" value={diagnosis} onChangeText={setDiagnosis} />
          </View>
        </View>

        {/* ── Clinical status ── */}
        <View style={S.card}>
          <SectionHeader icon="pulse-outline" title="Clinical Status" />
          <View style={S.fieldWrap}>
            <FieldLabel label={t('register_patient.status')} />
            <View style={S.optRow}>
              {STATUS_OPTS.map(s => {
                const m = STATUS_COLORS[s]; const active = status === s;
                return (
                  <TouchableOpacity key={s} style={[S.optBtn, active && { backgroundColor: m.bg, borderColor: m.color }]} onPress={() => setStatus(s)}>
                    {active && <View style={[S.optDot, { backgroundColor: m.color }]} />}
                    <Text style={[S.optText, active && { color: m.color, fontWeight: '700' }]}>{t(`status_values.${s}`, { defaultValue: s })}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={S.fieldWrap}>
            <FieldLabel label={t('register_patient.risk_level')} />
            <View style={S.optRow}>
              {RISK_OPTS.map(r => {
                const m = RISK_COLORS[r]; const active = riskLevel === r;
                return (
                  <TouchableOpacity key={r} style={[S.optBtn, active && { backgroundColor: m.bg, borderColor: m.color }]} onPress={() => setRiskLevel(r)}>
                    {active && <View style={[S.optDot, { backgroundColor: m.color }]} />}
                    <Text style={[S.optText, active && { color: m.color, fontWeight: '700' }]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Address ── */}
        <View style={S.card}>
          <SectionHeader icon="location-outline" title={t('register_patient.address')} />
          <View style={S.fieldWrap}>
            <LocationPicker province={province} district={district} sector={sector} cell={cell} village={village}
              onProvinceChange={setProvince} onDistrictChange={setDistrict} onSectorChange={setSector} onCellChange={setCell} onVillageChange={setVillage} />
          </View>
        </View>

        {/* ── Assignments ── */}
        <View style={S.card}>
          <SectionHeader icon="people-outline" title={t('register_patient.assign_help')} />

          {/* CHW */}
          <View style={S.fieldWrap}>
            <FieldLabel label={t('register_patient.assign_chw')} />
            <TouchableOpacity style={S.dropdown} onPress={() => setShowChwDrop(!showChwDrop)}>
              <Text style={[S.dropdownText, !assignedChw && { color: '#94A3B8' }]}>
                {selectedChw ? `${selectedChw.fullName} (${selectedChw.village || 'N/A'})` : t('register_patient.select_chw')}
              </Text>
              <Ionicons name={showChwDrop ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
            </TouchableOpacity>
            {showChwDrop && (
              <View style={S.dropList}>
                {chwList.map(c => (
                  <TouchableOpacity key={c.id} style={S.dropItem} onPress={() => { setAssignedChw(String(c.id)); setShowChwDrop(false); }}>
                    <View style={S.dropAvatar}><Text style={S.dropAvatarText}>{(c.fullName || '?').charAt(0).toUpperCase()}</Text></View>
                    <View>
                      <Text style={S.dropItemName}>{c.fullName}</Text>
                      {c.village && <Text style={S.dropItemSub}>{c.village}</Text>}
                    </View>
                    {String(assignedChw) === String(c.id) && <Ionicons name="checkmark-circle" size={18} color="#2EB67D" style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Family */}
          <View style={S.fieldWrap}>
            <FieldLabel label={t('register_patient.assign_family')} />
            <TouchableOpacity style={S.familyBtn} onPress={() => setShowFamilyModal(true)}>
              <View style={S.familyBtnIcon}><Ionicons name={assignedFamily ? 'people' : 'person-add-outline'} size={18} color="#7C3AED" /></View>
              <Text style={S.familyBtnText}>{assignedFamily ? `${t('register_patient.edit_family')} · ${familyName || `ID ${assignedFamily}`}` : t('register_patient.add_family')}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Save button ── */}
        <TouchableOpacity style={[S.saveBtn, isLoading && { opacity: 0.7 }]} onPress={savePatient} disabled={isLoading} activeOpacity={0.85}>
          <LinearGradient colors={['#064E3B', '#2EB67D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.saveBtnGrad}>
            {isLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Ionicons name={isEdit ? 'save-outline' : 'person-add-outline'} size={18} color="#fff" /><Text style={S.saveBtnText}>{isEdit ? t('register_patient.update_btn') : t('register_patient.register_btn')}</Text></>
            }
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Family modal ── */}
      <Modal transparent animationType="slide" visible={showFamilyModal} onRequestClose={() => setShowFamilyModal(false)}>
        <View style={S.overlay}>
          <View style={S.familySheet}>
            <View style={S.sheetHandle} />
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{t('register_patient.family_details')}</Text>
              <TouchableOpacity onPress={() => setShowFamilyModal(false)}><Ionicons name="close" size={22} color="#64748B" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={S.sheetBody} keyboardShouldPersistTaps="handled">
              <View style={S.fieldWrap}><FieldLabel label={t('register_patient.family_name')} required /><Input placeholder={t('register_patient.family_name')} value={familyName} onChangeText={setFamilyName} autoCapitalize="words" /></View>
              <View style={S.fieldWrap}><FieldLabel label={t('register_patient.family_email')} required /><Input placeholder="email@example.com" value={familyEmail} onChangeText={setFamilyEmail} keyboardType="email-address" /></View>
              <View style={S.fieldWrap}><FieldLabel label={t('register_patient.family_phone')} required /><Input placeholder="+250 7XX XXX XXX" value={familyPhone} onChangeText={setFamilyPhone} keyboardType="phone-pad" /></View>
              <LocationPicker province={familyProvince} district={familyDistrict} sector={familySector} cell={familyCell} village={familyVillage}
                onProvinceChange={setFamilyProvince} onDistrictChange={setFamilyDistrict} onSectorChange={setFamilySector} onCellChange={setFamilyCell} onVillageChange={setFamilyVillage} />
              <View style={S.sheetBtns}>
                <TouchableOpacity style={S.sheetCancelBtn} onPress={() => setShowFamilyModal(false)}><Text style={S.sheetCancelText}>{t('common.cancel')}</Text></TouchableOpacity>
                <TouchableOpacity style={S.sheetSaveBtn} onPress={saveFamilyMember} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.sheetSaveText}>{t('register_patient.save_family')}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {toast ? <View style={S.toast}><Text style={S.toastText}>{toast}</Text></View> : null}
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
  scroll: { padding: 16, paddingBottom: 80 },
  photoSection: { alignItems: 'center', marginBottom: 20 },
  photoWrap: { position: 'relative', marginBottom: 8 },
  photo: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#fff' },
  photoPlaceholder: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2EB67D', borderStyle: 'dashed' },
  photoBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#2EB67D', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  photoLabel: { fontSize: 12, color: '#94A3B8' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  sectionIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EAF7F3', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  fieldWrap: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  genderBtnActive: { backgroundColor: '#2EB67D', borderColor: '#2EB67D' },
  genderText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  genderTextActive: { color: '#fff' },
  optRow: { flexDirection: 'row', gap: 8 },
  optBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 10, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  optDot: { width: 7, height: 7, borderRadius: 4 },
  optText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  dropdownText: { fontSize: 14, color: '#1E293B', flex: 1 },
  dropList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4, maxHeight: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  dropItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  dropAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EAF7F3', justifyContent: 'center', alignItems: 'center' },
  dropAvatarText: { fontSize: 13, fontWeight: '700', color: '#2EB67D' },
  dropItemName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  dropItemSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  familyBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F3FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#DDD6FE' },
  familyBtnIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  familyBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#7C3AED' },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  familySheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  sheetBody: { padding: 16, paddingBottom: 40 },
  sheetBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  sheetCancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, alignItems: 'center' },
  sheetCancelText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  sheetSaveBtn: { flex: 1, backgroundColor: '#2EB67D', borderRadius: 12, padding: 14, alignItems: 'center' },
  sheetSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  toast: { position: 'absolute', bottom: 32, left: 16, right: 16, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, alignItems: 'center' },
  toastText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
