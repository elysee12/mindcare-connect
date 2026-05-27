import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Button, Input, LocationPicker } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type TabType = 'profile' | 'privacy' | 'notifications' | 'help';

export default function AccountSettings() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const { role = 'chw', tab: initialTab = 'profile' } = useLocalSearchParams<{ role?: string; tab?: TabType }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);
  const [savedMessage, setSavedMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [profileValues, setProfileValues] = useState({
    fullName: '', email: '', phone: '', workplace: '',
    province: '', district: '', sector: '', cell: '', village: '',
    password: '', confirmPassword: '',
  });

  const [passwordValues, setPasswordValues] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const [notificationValues, setNotificationValues] = useState({
    reminders: true, updates: true, offers: false,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => api.userById(String(user?.id)),
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    const source = userProfile || user;
    if (source) {
      setProfileValues({
        fullName: (source as any).fullName || (source as any).full_name || '',
        email: source.email || '',
        phone: source.phone || '',
        workplace: source.workplace || '',
        province: (source as any).province || '',
        district: source.district || '',
        sector: source.sector || '',
        cell: source.cell || '',
        village: source.village || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user, userProfile]);

  const allowedRole = ['chw', 'mhp', 'family', 'admin'];
  const routeRole = allowedRole.includes(role?.toLowerCase?.() || '') ? role.toLowerCase() : undefined;
  const currentRole = (userProfile?.role || user?.role || routeRole || 'chw').toString().toLowerCase();
  const roleLabel = t(`status_values.${currentRole.toUpperCase()}`, { defaultValue: currentRole.toUpperCase() });

  const tabTitle = useMemo(() => {
    switch (activeTab) {
      case 'privacy': return t('profile.privacy_security');
      case 'notifications': return t('profile.push_notifications');
      case 'help': return t('profile.help_support');
      default: return t('profile.edit_profile');
    }
  }, [activeTab, t]);

  const selectTab = (tabSelection: TabType) => {
    setActiveTab(tabSelection);
    setSavedMessage('');
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.updateUser(user?.id || '', data),
    onSuccess: (updatedUser) => {
      if (user) {
        setUser({
          ...user,
          full_name: updatedUser.fullName,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          workplace: updatedUser.workplace,
          province: updatedUser.province,
          district: updatedUser.district,
          sector: updatedUser.sector,
          cell: updatedUser.cell,
          village: updatedUser.village,
          role: updatedUser.role || currentRole,
        });
      }
      queryClient.invalidateQueries(['userProfile', user?.id]);
      setProfileValues((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      setSavedMessage(t('account_settings.profile_updated'));
      setTimeout(() => setSavedMessage(''), 3000);
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), `${t('account_settings.profile_updated').replace('updated', 'update failed')}: ${error.message || ''}`);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await api.login(user?.email || '', data.currentPassword);
      return api.updateUser(user?.id || '', { password: data.newPassword });
    },
    onSuccess: () => {
      setPasswordValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSavedMessage(t('account_settings.password_updated'));
      setTimeout(() => setSavedMessage(''), 3000);
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.message || '');
    },
  });

  const saveSettings = async () => {
    if (!user?.id) {
      Alert.alert(t('common.error'), t('account_settings.user_not_found'));
      return;
    }

    if (activeTab === 'profile') {
      if (!profileValues.fullName.trim()) {
        Alert.alert(t('common.error'), t('account_settings.name_required'));
        return;
      }
      if (!profileValues.email.trim()) {
        Alert.alert(t('common.error'), t('account_settings.email_required'));
        return;
      }
      if (profileValues.password || profileValues.confirmPassword) {
        if (profileValues.password.length < 8) {
          Alert.alert(t('common.error'), t('account_settings.password_min'));
          return;
        }
        if (profileValues.password !== profileValues.confirmPassword) {
          Alert.alert(t('common.error'), t('account_settings.password_mismatch'));
          return;
        }
      }
      const payload: any = {
        fullName: profileValues.fullName.trim(),
        email: profileValues.email.trim(),
        phone: profileValues.phone.trim() || undefined,
        workplace: profileValues.workplace.trim() || undefined,
        province: profileValues.province.trim() || undefined,
        district: profileValues.district.trim() || undefined,
        sector: profileValues.sector.trim() || undefined,
        cell: profileValues.cell.trim() || undefined,
        village: profileValues.village.trim() || undefined,
      };
      if (profileValues.password) payload.password = profileValues.password;
      updateProfileMutation.mutate(payload);
    } else if (activeTab === 'privacy') {
      if (!passwordValues.currentPassword) {
        Alert.alert(t('common.error'), t('account_settings.current_password_required'));
        return;
      }
      if (!passwordValues.newPassword) {
        Alert.alert(t('common.error'), t('account_settings.new_password_required'));
        return;
      }
      if (passwordValues.newPassword.length < 8) {
        Alert.alert(t('common.error'), t('account_settings.password_min'));
        return;
      }
      if (passwordValues.newPassword !== passwordValues.confirmPassword) {
        Alert.alert(t('common.error'), t('account_settings.password_mismatch'));
        return;
      }
      updatePasswordMutation.mutate({
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword,
      });
    } else {
      setSavedMessage(`${tabTitle} ${t('account_settings.settings_saved')}`);
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'privacy') {
      return (
        <View>
          <Text style={styles.sectionTitle}>{t('account_settings.change_password')}</Text>
          <View style={styles.fieldSpacing}>
            <Text style={styles.inputLabel}>{t('account_settings.current_password')}</Text>
            <Input
              value={passwordValues.currentPassword}
              onChangeText={(v) => setPasswordValues((p) => ({ ...p, currentPassword: v }))}
              secureTextEntry={!showCurrentPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Ionicons name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              }
              clearable
            />
          </View>
          <View style={styles.fieldSpacing}>
            <Text style={styles.inputLabel}>{t('account_settings.new_password')}</Text>
            <Input
              value={passwordValues.newPassword}
              onChangeText={(v) => setPasswordValues((p) => ({ ...p, newPassword: v }))}
              secureTextEntry={!showNewPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              }
              clearable
            />
          </View>
          <View style={styles.fieldSpacing}>
            <Text style={styles.inputLabel}>{t('account_settings.confirm_new_password')}</Text>
            <Input
              value={passwordValues.confirmPassword}
              onChangeText={(v) => setPasswordValues((p) => ({ ...p, confirmPassword: v }))}
              secureTextEntry={!showConfirmNewPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                  <Ionicons name={showConfirmNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              }
              clearable
            />
          </View>
        </View>
      );
    }

    if (activeTab === 'notifications') {
      const renderToggle = (labelKey: string, key: keyof typeof notificationValues) => (
        <View key={key} style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t(`account_settings.${labelKey}`)}</Text>
          <TouchableOpacity
            style={[styles.toggleSwitch, notificationValues[key] ? styles.toggleOn : styles.toggleOff]}
            onPress={() => setNotificationValues((p) => ({ ...p, [key]: !p[key] }))}
          >
            <Text style={styles.toggleText}>{notificationValues[key] ? t('account_settings.on') : t('account_settings.off')}</Text>
          </TouchableOpacity>
        </View>
      );
      return (
        <View>
          {renderToggle('reminders', 'reminders')}
          {renderToggle('appointment_updates', 'updates')}
          {renderToggle('offers_news', 'offers')}
        </View>
      );
    }

    if (activeTab === 'help') {
      return (
        <View>
          <Text style={styles.bodyText}>{t('account_settings.help_text')}</Text>
          <Text style={styles.bodyText}>{t('account_settings.help_phone')}</Text>
        </View>
      );
    }

    // profile tab
    return (
      <View>
        <Text style={styles.sectionTitle}>{t('account_settings.personal_info')}</Text>
        <View style={styles.fieldSpacing}>
          <Text style={styles.inputLabel}>{t('account_settings.full_name')}</Text>
          <Input value={profileValues.fullName} onChangeText={(v) => setProfileValues((p) => ({ ...p, fullName: v }))} clearable />
        </View>
        <View style={styles.fieldSpacing}>
          <Text style={styles.inputLabel}>{t('account_settings.email')}</Text>
          <Input value={profileValues.email} onChangeText={(v) => setProfileValues((p) => ({ ...p, email: v }))} keyboardType="email-address" clearable />
        </View>
        <View style={styles.fieldSpacing}>
          <Text style={styles.inputLabel}>{t('account_settings.phone')}</Text>
          <Input value={profileValues.phone} onChangeText={(v) => setProfileValues((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" clearable />
        </View>
        <Text style={styles.sectionTitle}>{t('account_settings.security')}</Text>
        <View style={styles.fieldSpacing}>
          <Text style={styles.inputLabel}>{t('account_settings.password')}</Text>
          <Input
            value={profileValues.password}
            onChangeText={(v) => setProfileValues((p) => ({ ...p, password: v }))}
            secureTextEntry={!showPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            }
            clearable
          />
        </View>
        <View style={styles.fieldSpacing}>
          <Text style={styles.inputLabel}>{t('account_settings.confirm_password')}</Text>
          <Input
            value={profileValues.confirmPassword}
            onChangeText={(v) => setProfileValues((p) => ({ ...p, confirmPassword: v }))}
            secureTextEntry={!showConfirmPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            }
            clearable
          />
        </View>

        {(currentRole === 'mhp' || currentRole === 'admin') && (
          <>
            <Text style={styles.sectionTitle}>{t('account_settings.professional_info')}</Text>
            <View style={styles.fieldSpacing}>
              <Text style={styles.inputLabel}>{t('account_settings.workplace')}</Text>
              <Input value={profileValues.workplace} onChangeText={(v) => setProfileValues((p) => ({ ...p, workplace: v }))} clearable />
            </View>
          </>
        )}

        {(currentRole === 'chw' || currentRole === 'family') && (
          <>
            <Text style={styles.sectionTitle}>{t('account_settings.location_info')}</Text>
            <LocationPicker
              province={profileValues.province}
              district={profileValues.district}
              sector={profileValues.sector}
              cell={profileValues.cell}
              village={profileValues.village}
              onProvinceChange={(v) => setProfileValues((p) => ({ ...p, province: v }))}
              onDistrictChange={(v) => setProfileValues((p) => ({ ...p, district: v }))}
              onSectorChange={(v) => setProfileValues((p) => ({ ...p, sector: v }))}
              onCellChange={(v) => setProfileValues((p) => ({ ...p, cell: v }))}
              onVillageChange={(v) => setProfileValues((p) => ({ ...p, village: v }))}
            />
          </>
        )}

        <Text style={styles.bodyText}>{t('account_settings.role_label')}: {roleLabel}</Text>
      </View>
    );
  };

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('account_settings.title')}</Text>
        </View>

        <Text style={styles.subtitle}>{`${roleLabel} - ${tabTitle}`}</Text>

        <View style={styles.tabRow}>
          {(['profile', 'privacy', 'notifications', 'help'] as TabType[]).map((tabKey) => (
            <TouchableOpacity
              key={tabKey}
              style={[styles.tabButton, activeTab === tabKey && styles.tabButtonActive]}
              onPress={() => selectTab(tabKey)}
            >
              <Text style={[styles.tabButtonText, activeTab === tabKey && styles.tabButtonTextActive]}>
                {tabKey === 'profile'
                  ? t('account_settings.edit_profile')
                  : tabKey === 'privacy'
                  ? t('account_settings.privacy')
                  : tabKey === 'notifications'
                  ? t('account_settings.notifications_tab')
                  : t('account_settings.help')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card variant="elevated" style={styles.card}>
          <Card.Content>{renderTabContent()}</Card.Content>
        </Card>

        {savedMessage ? <Text style={styles.successText}>{savedMessage}</Text> : null}

        <Button
          variant="primary"
          size="lg"
          loading={updateProfileMutation.isPending || updatePasswordMutation.isPending}
          onPress={saveSettings}
        >
          {t('account_settings.save_btn')} {tabTitle}
        </Button>

        <View style={styles.backAction}>
          <Button variant="ghost" size="md" onPress={() => router.back()}>
            {t('common.back')}
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  backBtn: { padding: spacing.xs, borderRadius: borderRadius.md, backgroundColor: colors.backgroundSecondary, ...shadows.sm },
  backText: { ...typography.captionBold, color: colors.primary },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  tabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tabButton: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.backgroundSecondary, alignItems: 'center' },
  tabButtonActive: { backgroundColor: colors.primary },
  tabButtonText: { ...typography.captionBold, color: colors.textSecondary },
  tabButtonTextActive: { color: colors.white },
  card: { borderRadius: borderRadius.xl, padding: spacing.md },
  fieldSpacing: { marginBottom: spacing.md },
  bodyText: { ...typography.body, color: colors.text, marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.primaryDark, marginBottom: spacing.md, marginTop: spacing.lg },
  inputLabel: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  toggleLabel: { ...typography.body, color: colors.text },
  toggleSwitch: { minWidth: 72, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
  toggleOn: { backgroundColor: colors.primary },
  toggleOff: { backgroundColor: colors.borderLight },
  toggleText: { color: colors.white, fontWeight: '600' },
  successText: { ...typography.captionBold, color: colors.success, marginBottom: spacing.sm, textAlign: 'center' },
  backAction: { marginTop: spacing.sm },
});
