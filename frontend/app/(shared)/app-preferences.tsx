import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useLocalSearchParams, useRouter } from 'expo-router';

type SettingType = 'dark_mode' | 'language';

export default function AppPreferences() {
  const router = useRouter();
  const { role = 'chw', setting = 'dark_mode' } = useLocalSearchParams<{ role?: string; setting?: SettingType }>();

  const [activeSetting, setActiveSetting] = useState<SettingType>(setting as SettingType);
  const [theme, setTheme] = useState<'System' | 'Light' | 'Dark'>('System');
  const [language, setLanguage] = useState<'English' | 'French' | 'Spanish'>('English');
  const [savedMessage, setSavedMessage] = useState('');

  const roleLabel = role.toUpperCase();

  const settingTitle = useMemo(() => {
    if (activeSetting === 'language') return 'Language';
    return 'Dark Mode';
  }, [activeSetting]);

  const savePreferences = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSavedMessage(`${settingTitle} updated successfully!`);
    Alert.alert('Saved', `${settingTitle} settings updated for ${roleLabel}.`);
  };

  const renderSettingContent = () => {
    if (activeSetting === 'language') {
      const options: Array<'English' | 'French' | 'Spanish'> = ['English', 'French', 'Spanish'];
      return (
        <View>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionItem, language === option && styles.optionItemActive]}
              onPress={() => setLanguage(option)}
            >
              <Text style={[styles.optionText, language === option && styles.optionTextActive]}>{option}</Text>
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
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>App Preferences</Text>
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
                {option === 'dark_mode' ? 'Dark Mode' : 'Language'}
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
          Save Preferences
        </Button>

        <View style={styles.backAction}>
          <Button variant="ghost" size="md" onPress={() => router.back()}>
            Back to Profile
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
  optionItem: { padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.sm },
  optionItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  optionText: { ...typography.body, color: colors.text },
  optionTextActive: { color: colors.primaryDark, fontWeight: '700' },
  successText: { ...typography.captionBold, color: colors.success, marginBottom: spacing.sm, textAlign: 'center' },
  backAction: { marginTop: spacing.sm },
});
