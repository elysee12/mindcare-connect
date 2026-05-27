import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Container, Card, Avatar, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['currentUserProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return api.userById(String(user.id));
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
  });

  const handleLogout = () => {
    router.replace('/login');
  };

  const myUser = userProfile || user || {
    fullName: '',
    role: '',
    email: '',
    workplace: '',
    catchment_area: '',
  };

  const currentRole = (myUser.role || '').toString().toLowerCase();
  const displayRole = t(`status_values.${currentRole.toUpperCase()}`, { defaultValue: currentRole.toUpperCase() });
  const displayArea = myUser.catchment_area || myUser.workplace || '';

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/(shared)/view-notifications`)}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Card variant="elevated" style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar
              source={null}
              fallback={(myUser.fullName || myUser.full_name || 'U').substring(0, 1)}
              size="xl"
              style={styles.avatar}
            />
            <Text style={styles.userName}>{myUser.fullName || myUser.full_name || ''}</Text>
            <Text style={styles.userRole}>{displayRole}{displayArea ? ` • ${displayArea}` : ''}</Text>
            <Text style={styles.userEmail}>{myUser.email || ''}</Text>
          </Card.Content>
        </Card>

        <Text style={styles.sectionTitle}>{t('profile.account_settings')}</Text>
        <Card variant="elevated" style={styles.settingsCard}>
          <SettingsItem icon="person-outline" label={t('profile.edit_profile')} onPress={() => router.push(`/(shared)/account-settings?role=${currentRole}`)} />
          <SettingsItem icon="shield-checkmark-outline" label={t('profile.privacy_security')} onPress={() => router.push(`/(shared)/account-settings?role=${currentRole}&tab=privacy`)} />
          <SettingsItem icon="notifications-outline" label={t('profile.push_notifications')} onPress={() => router.push(`/(shared)/account-settings?role=${currentRole}&tab=notifications`)} />
          <SettingsItem icon="help-circle-outline" label={t('profile.help_support')} onPress={() => router.push(`/(shared)/account-settings?role=${currentRole}&tab=help`)} last />
        </Card>

        <Text style={styles.sectionTitle}>{t('profile.app_preferences')}</Text>
        <Card variant="elevated" style={styles.settingsCard}>
          <SettingsItem icon="moon-outline" label={t('profile.dark_mode')} value={t('profile.system')} onPress={() => router.push(`/(shared)/app-preferences?role=${currentRole}&setting=dark_mode`)} />
          <SettingsItem icon="globe-outline" label={t('profile.language')} value={i18n.language === 'rw' ? t('common.kinyarwanda') : t('common.english')} onPress={() => router.push(`/(shared)/app-preferences?role=${currentRole}&setting=language`)} last />
        </Card>

        <Button
          variant="ghost"
          size="lg"
          onPress={handleLogout}
          style={styles.logoutBtn}
          textStyle={{ color: colors.error }}
        >
          {t('profile.logout')}
        </Button>

        <View style={styles.footer}>
          <Text style={styles.versionText}>{t('common.version')}</Text>
        </View>
      </ScrollView>
    </Container>
  );
}

function SettingsItem({ icon, label, value, last, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; last?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.settingsItem, !last && styles.settingsBorder]} onPress={onPress}>
      <View style={styles.settingsLabelContainer}>
        <Ionicons name={icon} size={22} color={colors.textSecondary} />
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      <View style={styles.settingsValueContainer}>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundAlt,
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  profileCard: {
    borderRadius: borderRadius.xxl,
    marginBottom: spacing.xxl,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    backgroundColor: colors.primaryTint,
    marginBottom: spacing.md,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userRole: {
    ...typography.captionBold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  sectionTitle: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },
  settingsCard: {
    borderRadius: borderRadius.xl,
    padding: 0,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  settingsBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingsLabel: {
    ...typography.body,
    color: colors.text,
  },
  settingsValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingsValue: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  logoutBtn: {
    marginTop: spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  versionText: {
    ...typography.tiny,
    color: colors.textTertiary,
  },
});
