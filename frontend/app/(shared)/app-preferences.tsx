import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

type SettingType = 'dark_mode' | 'language';

export default function AppPreferences() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { role = 'chw', setting = 'dark_mode' } = useLocalSearchParams<{ role?: string; setting?: SettingType }>();

  const [activeSetting, setActiveSetting] = useState<SettingType>(setting as SettingType);
  const [theme, setTheme] = useState<'System' | 'Light' | 'Dark'>('System');
  const [savedMessage, setSavedMessage] = useState('');

  const roleLabel = role.toUpperCase();

  const settingTitle = useMemo(() => {
    if (activeSetting === 'language') return t('profile.language');
    return t('profile.dark_mode');
  }, [activeSetting, t]);

  const savePreferences = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSavedMessage(t('common.success'));
    Alert.alert(t('common.success'), `${settingTitle} updated.`);
  };

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    setSavedMessage(t('common.success'));
  };

  const renderSettingContent = () => {
    if (activeSetting === 'language') {
      const options = [
        { code: 'en', label: t('common.english'), flag: require('../../src/assets/images/england.jpg') },
        { code: 'rw', label: t('common.kinyarwanda'), flag: require('../../src/assets/images/rwanda.png') },
      ];
      return (
        <View>
          {options.map((option) => (
            <TouchableOpacity
              key={option.code}
              style={[styles.optionItem, i18n.language === option.code && styles.optionItemActive]}
              onPress={() => handleLanguageChange(option.code)}
            >
              <View style={styles.optionContent}>
                <Image source={option.flag} style={styles.flag} />
                <Text style={[styles.optionText, i18n.language === option.code && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    const themes: Array<'System' | 'Light' | 'Dark'> = ['System', 'Light', 'Dark'];
    return (
      <View>
        {themes.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.optionItem, theme === option && styles.optionItemActive]}
            onPress={() => setTheme(option)}
          >
            <Text style={[styles.optionText, theme === option && styles.optionTextActive]}>{option}</Text>
          </TouchableOpacity>
        ))}
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
          <Text style={styles.title}>{t('profile.app_preferences')}</Text>
        </View>

        <Text style={styles.subtitle}>{`${roleLabel} view - ${settingTitle}`}</Text>

        <View style={styles.tabRow}>
          {(['dark_mode', 'language'] as SettingType[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.tabButton, activeSetting === option && styles.tabButtonActive]}
              onPress={() => {
                setActiveSetting(option);
                setSavedMessage('');
              }}
            >
              <Text style={[styles.tabButtonText, activeSetting === option && styles.tabButtonTextActive]}>
                {option === 'dark_mode' ? t('profile.dark_mode') : t('profile.language')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card variant="elevated" style={styles.card}>
          <Card.Content>
            {renderSettingContent()}
          </Card.Content>
        </Card>

        {savedMessage ? <Text style={styles.successText}>{savedMessage}</Text> : null}

        <Button variant="primary" size="lg" onPress={savePreferences}>
          {t('profile.account_settings')}
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
  backBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md, backgroundColor: colors.backgroundSecondary, ...shadows.sm },
  backText: { ...typography.captionBold, color: colors.primary },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  tabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tabButton: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.backgroundSecondary, alignItems: 'center' },
  tabButtonActive: { backgroundColor: colors.primary },
  tabButtonText: { ...typography.captionBold, color: colors.textSecondary },
  tabButtonTextActive: { color: colors.white },
  card: { borderRadius: borderRadius.xl, padding: spacing.md },
  optionItem: { padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.sm },
  optionItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  optionContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flag: { width: 30, height: 20, borderRadius: 2 },
  optionText: { ...typography.body, color: colors.text },
  optionTextActive: { color: colors.primaryDark, fontWeight: '700' },
  successText: { ...typography.captionBold, color: colors.success, marginBottom: spacing.sm, textAlign: 'center' },
  backAction: { marginTop: spacing.sm },
});
