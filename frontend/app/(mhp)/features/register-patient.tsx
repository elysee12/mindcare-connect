import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { Container, Card, Input, Button, LocationPicker } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

export default function RegisterPatient() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const { patientId, edit, userId } = useLocalSearchParams<{ patientId?: string; edit?: string; userId?: string }>();
  const isEdit = edit === '1' && patientId;

  const [patientIdState, setPatientId] = useState('P001');
  const [nextPatientNum, setNextPatientNum] = useState(2);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [contact, setContact] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [status, setStatus] = useState('Stable');
  const [riskLevel, setRiskLevel] = useState('Low');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [assignedChw, setAssignedChw] = useState('');
  const [assignedFamily, setAssignedFamily] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [familyEmail, setFamilyEmail] = useState('');
  const [familyPhone, setFamilyPhone] = useState('');
  const [familyProvince, setFamilyProvince] = useState('');
  const [familyDistrict, setFamilyDistrict] = useState('');
  const [familySector, setFamilySector] = useState('');
  const [familyCell, setFamilyCell] = useState('');
  const [familyVillage, setFamilyVillage] = useState('');
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [cell, setCell] = useState('');
  const [village, setVillage] = useState('');
  const [showChwDropdown, setShowChwDropdown] = useState(false);
  const [chwList, setChwList] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchChws = async () => {
      try {
        const chws = await api.users(undefined, 'CHW');
        setChwList(chws);
      } catch (error) {
        console.error('Failed to fetch CHWs', error);
      }
    };
    fetchChws();
    if (isEdit && patientId) {
      loadPatientData(patientId);
    }
  }, [isEdit, patientId]);

  const loadPatientData = async (id: string) => {
    try {
      const patient = await api.patientById(id);
      setName(patient.fullName || '');
      setAge(String(patient.age || ''));
      setGender(patient.gender || '');
      setContact(patient.contact || '');
      setDiagnosis(patient.diagnosis || '');
      setStatus(patient.status || 'Stable');
      setRiskLevel(patient.riskLevel || 'Low');
      setProvince(patient.province || '');
      setDistrict(patient.district || '');
      setSector(patient.sector || '');
      setCell(patient.cell || '');
      setVillage(patient.village || '');
      setAssignedChw(patient.assignedChwId || '');
      setAssignedFamily(patient.assignedFamilyId || '');
      setSelectedImageUri(patient.photoUrl || null); // Load existing photo
    } catch (error) {
      Alert.alert('Error', 'Failed to load patient data');
    }
  };

  // Options
  const chwOptions = chwList.map(chw => ({ label: `${chw.fullName} (${chw.village})`, value: chw.id }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('register_patient.permission_needed'), t('register_patient.camera_permission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `patient-${Date.now()}.jpg`,
      } as any);

      // Use the same backend URL as other API calls
      const backendUrl = (Constants.expoConfig?.extra?.BACKEND_URL || 'http://172.18.240.24:3000');

      const uploadResponse = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': currentUser?.id || '',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      return uploadResult.url;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  const savePatient = async () => {
    if (!name || !age || !gender) {
      Alert.alert(t('register_patient.validation_error'), t('register_patient.required_fields'));
      return;
    }

    setIsLoading(true);
    setStatusMessage(t('register_patient.saving'));

    try {
      let photoUrl = selectedImageUri;

      // If it's a local URI, upload it first
      if (selectedImageUri && selectedImageUri.startsWith('file://')) {
        setStatusMessage(t('register_patient.uploading'));
        const uploadedUrl = await uploadImage(selectedImageUri);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        } else {
          // If upload fails, we might want to ask if they want to continue without photo
          // For now, let's just log and continue as per original logic but more robust
          console.warn('Image upload failed, using original URI or null');
        }
      }

      const payload: any = {
        fullName: name,
        age: Number(age),
        gender,
        contact,
        diagnosis,
        status,
        riskLevel,
        province,
        district,
        sector,
        cell,
        village,
        photoUrl,
      };

      if (assignedChw) {
        payload.assignedChwId = Number(assignedChw);
      }
      
      if (assignedFamily && assignedFamily !== 'None') {
        payload.assignedFamilyId = Number(assignedFamily);
      }

      if (isEdit && patientId) {
        await api.updatePatient(patientId, payload);
        setStatusMessage(t('register_patient.patient_updated', { name }));
      } else {
        await api.createPatient(payload);
        setStatusMessage(t('register_patient.patient_created', { name }));
      }

      setTimeout(() => {
        setStatusMessage('');
        setIsLoading(false);
        if (!isEdit) {
          setName('');
          setAge('');
          setGender('');
          setContact('');
          setDiagnosis('');
          setStatus('Stable');
          setRiskLevel('Low');
          setProvince('');
          setDistrict('');
          setSector('');
          setCell('');
          setVillage('');
          setAssignedChw('');
          setAssignedFamily('');
          setFamilyName('');
          setFamilyEmail('');
          setFamilyPhone('');
          setFamilyProvince('');
          setFamilyDistrict('');
          setFamilySector('');
          setFamilyCell('');
          setFamilyVillage('');
          setSelectedImageUri(null);
        }
        router.back();
      }, 1500);
    } catch (error: any) {
      setIsLoading(false);
      setStatusMessage('');
      const errorMessage = error.message || 'Failed to save patient. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const saveFamilyMember = async () => {
    if (!familyName || !familyEmail || !familyPhone) {
      Alert.alert(t('register_patient.validation_error'), t('register_patient.family_required_fields'));
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        fullName: familyName,
        email: familyEmail,
        password: 'Family@123',
        role: 'FAMILY',
        phone: familyPhone,
        province: familyProvince,
        district: familyDistrict,
        sector: familySector,
        cell: familyCell,
        village: familyVillage,
      };
      const savedFamily = await api.createUser(payload);
      setAssignedFamily(String(savedFamily.id));
      setShowFamilyModal(false);
      setIsLoading(false);
      Alert.alert(t('common.success'), t('register_patient.family_saved', { name: savedFamily.fullName }));
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error.message || t('common.error');
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>{t('register_patient.back')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isEdit ? t('register_patient.edit_title') : t('register_patient.title')}</Text>
        <Text style={styles.subtitle}>{isEdit ? t('register_patient.edit_subtitle') : t('register_patient.subtitle')}</Text>

        <Card style={styles.card} variant="elevated">
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.full_name')}</Text>
            <Input placeholder={t('register_patient.full_name')} value={name} onChangeText={setName} autoCapitalize="words" />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.age')}</Text>
            <Input placeholder={t('register_patient.age')} value={age} onChangeText={setAge} keyboardType="numeric" />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.gender')}</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  gender === 'Male' && styles.radioButtonSelected,
                ]}
                onPress={() => setGender('Male')}
              >
                <View
                  style={[
                    styles.radioCircle,
                    gender === 'Male' && styles.radioCircleSelected,
                  ]}
                />
                <Text style={styles.radioButtonText}>{t('register_patient.male')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioButton,
                  gender === 'Female' && styles.radioButtonSelected,
                ]}
                onPress={() => setGender('Female')}
              >
                <View
                  style={[
                    styles.radioCircle,
                    gender === 'Female' && styles.radioCircleSelected,
                  ]}
                />
                <Text style={styles.radioButtonText}>{t('register_patient.female')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.contact_optional')}</Text>
            <Input placeholder={t('register_patient.contact_optional')} value={contact} onChangeText={setContact} keyboardType="phone-pad" />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.diagnosis')}</Text>
            <Input placeholder={t('register_patient.diagnosis')} value={diagnosis} onChangeText={setDiagnosis} />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.status')}</Text>
            <Input placeholder={t('register_patient.status')} value={status} onChangeText={setStatus} />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.risk_level')}</Text>
            <Input placeholder={t('register_patient.risk_level')} value={riskLevel} onChangeText={setRiskLevel} />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.profile_photo')}</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Ionicons name="camera" size={24} color={colors.primary} />
              <Text style={styles.uploadButtonText}>{t('register_patient.select_photo')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imagePreviewWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.profile_preview')}</Text>
            <View style={styles.imagePreviewBox}>
              <Image source={{ uri: selectedImageUri || 'https://via.placeholder.com/120' }} style={styles.imagePreview} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('register_patient.address')}</Text>

          <LocationPicker
            province={province}
            district={district}
            sector={sector}
            cell={cell}
            village={village}
            onProvinceChange={setProvince}
            onDistrictChange={setDistrict}
            onSectorChange={setSector}
            onCellChange={setCell}
            onVillageChange={setVillage}
          />

          <Text style={styles.sectionTitle}>{t('register_patient.assign_help')}</Text>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.assign_chw')}</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowChwDropdown(!showChwDropdown)}>
              <Text style={styles.dropdownText}>{assignedChw || t('register_patient.select_chw')}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {showChwDropdown && (
              <View style={styles.dropdownOptions}>
                {chwOptions.map((chw) => (
                  <TouchableOpacity key={chw.value} style={styles.dropdownOption} onPress={() => { setAssignedChw(chw.value); setShowChwDropdown(false); }}>
                    <Text style={styles.dropdownOptionText}>{chw.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('register_patient.assign_family')}</Text>
            <Button
              variant="secondary"
              onPress={() => setShowFamilyModal(true)}
              size="md"
            >
              {assignedFamily ? t('register_patient.edit_family') : t('register_patient.add_family')}
            </Button>
            {assignedFamily ? (
              <Text style={[styles.patientDetail, { marginTop: spacing.xs }]}>{t('register_patient.assigned_label')}: {familyName || assignedFamily}</Text>
            ) : null}
          </View>

          <Modal transparent animationType="slide" visible={showFamilyModal} onRequestClose={() => setShowFamilyModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.sectionTitle}>{t('register_patient.family_details')}</Text>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>{t('register_patient.family_name')}</Text>
                  <Input placeholder={t('register_patient.family_name')} value={familyName} onChangeText={setFamilyName} autoCapitalize="words" />
                </View>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>{t('register_patient.family_email')}</Text>
                  <Input placeholder={t('register_patient.family_email')} value={familyEmail} onChangeText={setFamilyEmail} keyboardType="email-address" />
                </View>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>{t('register_patient.family_phone')}</Text>
                  <Input placeholder={t('register_patient.family_phone')} value={familyPhone} onChangeText={setFamilyPhone} keyboardType="phone-pad" />
                </View>

                <LocationPicker
                  province={familyProvince}
                  district={familyDistrict}
                  sector={familySector}
                  cell={familyCell}
                  village={familyVillage}
                  onProvinceChange={setFamilyProvince}
                  onDistrictChange={setFamilyDistrict}
                  onSectorChange={setFamilySector}
                  onCellChange={setFamilyCell}
                  onVillageChange={setFamilyVillage}
                />

                <View style={styles.buttonWrapper}>
                  <Button variant="primary" onPress={saveFamilyMember} disabled={isLoading}>
                    {isLoading ? t('register_patient.saving_family') : t('register_patient.save_family')}
                  </Button>
                  <Button variant="ghost" onPress={() => setShowFamilyModal(false)} disabled={isLoading}>{t('common.cancel')}</Button>
                </View>
              </View>
            </View>
          </Modal>

          <View style={styles.buttonWrapper}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={savePatient}
              disabled={isLoading}
            >
              {isLoading ? t('register_patient.processing') : (isEdit ? t('register_patient.update_btn') : t('register_patient.register_btn'))}
            </Button>
          </View>
        </Card>

        {statusMessage ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{statusMessage}</Text>
          </View>
        ) : null}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.backgroundSecondary, flex: 1 },
  headbar: { padding: spacing.md, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.primary, marginLeft: spacing.xs },
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  card: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm },
  fieldWrapper: { marginBottom: spacing.md },
  fieldLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  radioGroup: { flexDirection: 'row', gap: spacing.sm },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  radioButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioButtonText: {
    ...typography.body,
    color: colors.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  uploadButtonText: { ...typography.body, color: colors.primary },
  imagePreviewWrapper: { marginBottom: spacing.md },
  imagePreviewBox: { width: '100%', height: 120, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  sectionTitle: { ...typography.h3, color: colors.primaryDark, marginTop: spacing.lg, marginBottom: spacing.md },
  subSectionTitle: { ...typography.bodyBold, color: colors.primaryDark, marginTop: spacing.md, marginBottom: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  modalContent: { width: '100%', maxWidth: 560, backgroundColor: colors.background, borderRadius: borderRadius.lg, padding: spacing.md },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  dropdownText: {
    ...typography.body,
    color: colors.text,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    zIndex: 10,
    maxHeight: 150,
  },
  dropdownOption: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownOptionText: {
    ...typography.body,
    color: colors.text,
  },
  button: { marginTop: spacing.md },
  buttonWrapper: { marginTop: spacing.md },
  toast: {
    position: 'absolute',
    bottom: 32,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  toastText: {
    ...typography.captionBold,
    color: colors.white,
  },
});
