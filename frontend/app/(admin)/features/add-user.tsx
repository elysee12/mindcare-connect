import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Input, Button, LocationPicker } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

export default function AddUser() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [cell, setCell] = useState('');
  const [village, setVillage] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roles = ['MHP', 'CHW'];

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
    const lastName = nameParts[nameParts.length - 1];
    const password = lastName + '@123';
    if (password.length < 8) {
      Alert.alert(t('add_user.password_error'), t('add_user.password_error_msg'));
      return;
    }

    try {
      await api.createUser({
        fullName, email, password, role: selectedRole, phone,
        workplace: selectedRole === 'MHP' ? workplace : undefined,
        province: selectedRole === 'CHW' ? province : undefined,
        district: selectedRole === 'CHW' ? district : undefined,
        sector: selectedRole === 'CHW' ? sector : undefined,
        cell: selectedRole === 'CHW' ? cell : undefined,
        village: selectedRole === 'CHW' ? village : undefined,
      });

      Alert.alert(
        t('add_user.success_title'),
        t('add_user.success_msg', { password, name: fullName }),
        [{
          text: 'OK',
          onPress: () => {
            setSelectedRole(''); setFullName(''); setEmail(''); setPhone('');
            setWorkplace(''); setProvince(''); setDistrict(''); setSector('');
            setCell(''); setVillage('');
            router.back();
          },
        }]
      );
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('already exists') || msg.includes('Email')) {
        Alert.alert(t('add_user.email_exists'), t('add_user.email_exists_msg'));
      } else if (msg.includes('Cannot reach backend')) {
        Alert.alert(t('add_user.connection_error'), msg);
      } else {
        Alert.alert(t('add_user.create_error'), msg || t('common.error'));
      }
    }
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('add_user.title')}</Text>
        <Text style={styles.subtitle}>{t('add_user.subtitle')}</Text>

        <Card style={styles.card} variant="elevated">
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('add_user.role')}</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowRoleDropdown(!showRoleDropdown)}>
              <Text style={styles.dropdownText}>
                {selectedRole ? t(`status_values.${selectedRole}`, { defaultValue: selectedRole }) : t('add_user.select_role')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {showRoleDropdown && (
              <View style={styles.dropdownOptions}>
                {roles.map((role) => (
                  <TouchableOpacity key={role} style={styles.dropdownOption} onPress={() => { setSelectedRole(role); setShowRoleDropdown(false); }}>
                    <Text style={styles.dropdownOptionText}>{t(`status_values.${role}`, { defaultValue: role })}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {selectedRole && (
            <>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{t('add_user.full_name')}</Text>
                <Input placeholder={t('add_user.full_name')} value={fullName} onChangeText={setFullName} />
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{t('add_user.email')}</Text>
                <Input placeholder={t('add_user.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{t('add_user.phone')}</Text>
                <Input placeholder={t('add_user.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
              {selectedRole === 'MHP' && (
                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>{t('add_user.hospital')}</Text>
                  <Input placeholder={t('add_user.hospital_placeholder')} value={workplace} onChangeText={setWorkplace} autoCapitalize="words" />
                </View>
              )}
              {selectedRole === 'CHW' && (
                <LocationPicker
                  province={province} district={district} sector={sector} cell={cell} village={village}
                  onProvinceChange={setProvince} onDistrictChange={setDistrict}
                  onSectorChange={setSector} onCellChange={setCell} onVillageChange={setVillage}
                />
              )}
              <View style={styles.buttonWrapper}>
                <Button variant="primary" fullWidth onPress={save}>{t('add_user.add_btn')}</Button>
              </View>
            </>
          )}
        </Card>
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
  card: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm, overflow: 'visible' },
  fieldWrapper: { marginBottom: spacing.md },
  fieldLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.background },
  dropdownText: { ...typography.body, color: colors.text },
  dropdownOptions: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, zIndex: 1000, elevation: 10 },
  dropdownOption: { padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dropdownOptionText: { ...typography.body, color: colors.text },
  buttonWrapper: { marginTop: spacing.md },
});
