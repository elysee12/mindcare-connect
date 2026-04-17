import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Button, Input } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'profile' | 'privacy' | 'notifications' | 'help';

export default function AccountSettings() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { role = 'chw', tab: initialTab = 'profile' } = useLocalSearchParams<{ role?: string; tab?: TabType }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);
  const [savedMessage, setSavedMessage] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [profileValues, setProfileValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    workplace: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    password: '',
    confirmPassword: '',
  });

  const [passwordValues, setPasswordValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationValues, setNotificationValues] = useState({
    reminders: true,
    updates: true,
    offers: false,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => api.userById(String(user?.id)),
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  // Load user data when component mounts or when the backend profile changes
  useEffect(() => {
    const source = userProfile || user;
    if (source) {
      setProfileValues({
        fullName: (source as any).fullName || (source as any).full_name || '',
        email: source.email || '',
        phone: source.phone || '',
        workplace: source.workplace || '',
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
  const roleLabel = currentRole.toUpperCase();

  const tabTitle = useMemo(() => {
    switch (activeTab) {
      case 'privacy':
        return 'Privacy & Security';
      case 'notifications':
        return 'Push Notifications';
      case 'help':
        return 'Help & Support';
      default:
        return 'Edit Profile';
    }
  }, [activeTab]);

  const selectTab = (tabSelection: TabType) => {
    setActiveTab(tabSelection);
    setSavedMessage('');
  };

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.updateUser(user?.id || '', data),
    onSuccess: (updatedUser) => {
      // Update local user state and refresh profile cache
      if (user) {
        setUser({
          ...user,
          full_name: updatedUser.fullName,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          workplace: updatedUser.workplace,
          district: updatedUser.district,
          sector: updatedUser.sector,
          cell: updatedUser.cell,
          village: updatedUser.village,
          role: updatedUser.role || currentRole,
        });
      }
      queryClient.invalidateQueries(['userProfile', user?.id]);
      setProfileValues((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
      setSavedMessage('Profile updated successfully');
      setTimeout(() => setSavedMessage(''), 3000);
    },
    onError: (error: any) => {
      Alert.alert('Error', `Failed to update profile: ${error.message || 'Unknown error'}`);
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      // First verify current password
      await api.login(user?.email || '', data.currentPassword);
      // If successful, update password
      return api.updateUser(user?.id || '', { password: data.newPassword });
    },
    onSuccess: () => {
      setPasswordValues({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSavedMessage('Password updated successfully');
      setTimeout(() => setSavedMessage(''), 3000);
    },
    onError: (error: any) => {
      Alert.alert('Error', `Failed to update password: ${error.message || 'Unknown error'}`);
    },
  });

  const saveSettings = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    if (activeTab === 'profile') {
      // Validate profile data
      if (!profileValues.fullName.trim()) {
        Alert.alert('Error', 'Full name is required');
        return;
      }
      if (!profileValues.email.trim()) {
        Alert.alert('Error', 'Email is required');
        return;
      }
      if (profileValues.password || profileValues.confirmPassword) {
        if (profileValues.password.length < 8) {
          Alert.alert('Error', 'Password must be at least 8 characters long');
          return;
        }
        if (profileValues.password !== profileValues.confirmPassword) {
          Alert.alert('Error', 'Password and confirmation do not match');
          return;
        }
      }

      const payload: any = {
        fullName: profileValues.fullName.trim(),
        email: profileValues.email.trim(),
        phone: profileValues.phone.trim() || undefined,
        workplace: profileValues.workplace.trim() || undefined,
        district: profileValues.district.trim() || undefined,
        sector: profileValues.sector.trim() || undefined,
        cell: profileValues.cell.trim() || undefined,
        village: profileValues.village.trim() || undefined,
      };

      if (profileValues.password) {
        payload.password = profileValues.password;
      }

      updateProfileMutation.mutate(payload);
    } else if (activeTab === 'privacy') {
      // Validate password data
      if (!passwordValues.currentPassword) {
        Alert.alert('Error', 'Current password is required');
        return;
      }
      if (!passwordValues.newPassword) {
        Alert.alert('Error', 'New password is required');
        return;
      }
      if (passwordValues.newPassword.length < 8) {
        Alert.alert('Error', 'New password must be at least 8 characters long');
        return;
      }
      if (passwordValues.newPassword !== passwordValues.confirmPassword) {
        Alert.alert('Error', 'New password and confirmation do not match');
        return;
      }

      updatePasswordMutation.mutate({
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword,
      });
    } else {
      // For notifications and help tabs, just show success message
      setSavedMessage(`${tabTitle} settings saved successfully`);
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'privacy') {
      return (
        <View>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <View style={styles.fieldSpacing}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <Input
              value={passwordValues.currentPassword}
              onChangeText={(value) => setPasswordValues((prev) => ({ ...prev, currentPassword: value }))}
              secureTextEntry={!showCurrentPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Ionicons 
                    name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.textTertiary} 
                  />
                </TouchableOpacity>
              }
              clearable
            />
          </View>
          <View style={styles.fieldSpacing}>
            <Text style={styles.inputLabel}>New Password</Text>
            <Input
              value={passwordValues.newPassword}
              onChangeText={(value) => setPasswordValues((prev) => ({ ...prev, newPassword: value }))}
              secureTextEntry={!showNewPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons 
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.textTertiary} 
                  />
                </TouchableOpacity>
              }
              clearable
            />
          </View>
          <View style={styles.fieldSpacing}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <Input
              value={passwordValues.confirmPassword}
              onChangeText={(value) => setPasswordValues((prev) => ({ ...prev, confirmPassword: value }))}
              secureTextEntry={!showConfirmNewPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                  <Ionicons 
                    name={showConfirmNewPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.textTertiary} 
                  />
                </TouchableOpacity>
              }
              clearable
            />
          </View>
        </View>
      );
    }

    if (activeTab === 'notifications') {
      const renderNotificationToggle = (label: string, key: keyof typeof notificationValues) => (
        <View key={key} style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{label}</Text>
          <TouchableOpacity
            style={[
              styles.toggleSwitch,
              notificationValues[key] ? styles.toggleOn : styles.toggleOff,
            ]}
            onPress={() => setNotificationValues((prev) => ({ ...prev, [key]: !prev[key] }))}
          >
            <Text style={styles.toggleText}>{notificationValues[key] ? 'On' : 'Off'}</Text>
          </TouchableOpacity>
        </View>
      );

      return (
        <View>
          {renderNotificationToggle('Reminders', 'reminders')}
          {renderNotificationToggle('Appointment Updates', 'updates')}
          {renderNotificationToggle('Offers & News', 'offers')}
        </View>
      );
    }

    if (activeTab === 'help') {
      return (
        <View>
          <Text style={styles.bodyText}>
            For help and support, contact support@mindcare.com or visit our documentation at
            https://mindcare-connect.example.com/docs.
          </Text>
          <Text style={styles.bodyText}>You can also call +1 800 123 456.</Text>
        </View>
      );
    }

    // profile tab
    return (
      <View>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.fieldSpacing}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <Input
            value={profileValues.fullName}
            onChangeText={(value) => setProfileValues((prev) => ({ ...prev, fullName: value }))}
            clearable
          />
        </View>
        <View style={styles.fieldSpacing}>
          <Text style={styles.inputLabel}>Email</Text>
          <Input
            value={profileValues.email}
            onChangeText={(value) => setProfileValues((prev) => ({ ...prev, email: value }))}
            keyboardType="email-address"
            clearable
          />
        </View>
        <View style={styles.fieldSpacing}>
          <Text style={styles.inputLabel}>Phone</Text>
          <Input
            value={profileValues.phone}
            onChangeText={(value) => setProfileValues((prev) => ({ ...prev, phone: value }))}
            keyboardType="phone-pad"
            clearable
          />
        </View>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.fieldSpacing}>
          <Text style={styles.inputLabel}>Password</Text>
          <Input
            value={profileValues.password}
            onChangeText={(value) => setProfileValues((prev) => ({ ...prev, password: value }))}
            secureTextEntry={!showPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={colors.textTertiary} 
                />
              </TouchableOpacity>
            }
            clearable
          />
        </View>
        <View style={styles.fieldSpacing}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <Input
            value={profileValues.confirmPassword}
            onChangeText={(value) => setProfileValues((prev) => ({ ...prev, confirmPassword: value }))}
            secureTextEntry={!showConfirmPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={colors.textTertiary} 
                />
              </TouchableOpacity>
            }
            clearable
          />
        </View>

        {(currentRole === 'mhp' || currentRole === 'admin') && (
          <>
            <Text style={styles.sectionTitle}>Professional Information</Text>
            <View style={styles.fieldSpacing}>
              <Text style={styles.inputLabel}>Workplace</Text>
              <Input
                value={profileValues.workplace}
                onChangeText={(value) => setProfileValues((prev) => ({ ...prev, workplace: value }))}
                clearable
              />
            </View>
          </>
        )}

        {(currentRole === 'chw' || currentRole === 'family') && (
          <>
            <Text style={styles.sectionTitle}>Location Information</Text>
            <View style={styles.fieldSpacing}>
              <Text style={styles.inputLabel}>District</Text>
              <Input
                value={profileValues.district}
                onChangeText={(value) => setProfileValues((prev) => ({ ...prev, district: value }))}
                clearable
              />
            </View>
            <View style={styles.fieldSpacing}>
              <Text style={styles.inputLabel}>Sector</Text>
              <Input
                value={profileValues.sector}
                onChangeText={(value) => setProfileValues((prev) => ({ ...prev, sector: value }))}
                clearable
              />
            </View>
            <View style={styles.fieldSpacing}>
              <Text style={styles.inputLabel}>Cell</Text>
              <Input
                value={profileValues.cell}
                onChangeText={(value) => setProfileValues((prev) => ({ ...prev, cell: value }))}
                clearable
              />
            </View>
            <View style={styles.fieldSpacing}>
              <Text style={styles.inputLabel}>Village</Text>
              <Input
                value={profileValues.village}
                onChangeText={(value) => setProfileValues((prev) => ({ ...prev, village: value }))}
                clearable
              />
            </View>
          </>
        )}

        <Text style={styles.bodyText}>Role: {roleLabel}</Text>
      </View>
    );
  };

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Account Settings</Text>
        </View>

        <Text style={styles.subtitle}>{`${roleLabel} view - ${tabTitle}`}</Text>

        <View style={styles.tabRow}>
          {(['profile', 'privacy', 'notifications', 'help'] as TabType[]).map((tabKey) => (
            <TouchableOpacity
              key={tabKey}
              style={[
                styles.tabButton,
                activeTab === tabKey && styles.tabButtonActive,
              ]}
              onPress={() => selectTab(tabKey)}
            >
              <Text style={[styles.tabButtonText, activeTab === tabKey && styles.tabButtonTextActive]}>
                {tabKey === 'profile' ? 'Profile' : tabKey === 'privacy' ? 'Privacy' : tabKey === 'notifications' ? 'Notifications' : 'Help'}
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
          Save {tabTitle}
        </Button>

        <View style={styles.backAction}>
          <Button variant="ghost" size="md" onPress={() => router.back()}>
            Back
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
  adminNote: { ...typography.captionBold, color: colors.primary },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  toggleLabel: { ...typography.body, color: colors.text },
  toggleSwitch: { minWidth: 72, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
  toggleOn: { backgroundColor: colors.primary },
  toggleOff: { backgroundColor: colors.borderLight },
  toggleText: { color: colors.white, fontWeight: '600' },
  successText: { ...typography.captionBold, color: colors.success, marginBottom: spacing.sm, textAlign: 'center' },
  backAction: { marginTop: spacing.sm },
});
