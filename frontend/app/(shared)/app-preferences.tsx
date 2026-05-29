import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type SettingType = 'dark_mode' | 'language';

const ROLE_GRAD: Record<string, [string, string]> = {
  mhp:    ['#1a6b4a', '#2EB67D'],
  chw:    ['#1E40AF', '#3B82F6'],
  family: ['#7C3AED', '#A78BFA'],
  admin:  ['#B45309', '#F59E0B'],
};

export default function AppPreferences() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { role = 'chw', setting = 'dark_mode' } = useLocalSearchParams<{ role?: string; setting?: SettingType }>();

  const [activeSetting, setActiveSetting] = useState<SettingType>(setting as SettingType);
  const [theme, setTheme] = useState<'System' | 'Light' | 'Dark'>('System');

  const grad = ROLE_GRAD[role?.toLowerCase() || 'chw'] || ROLE_GRAD.chw;

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    Alert.alert(t('common.success'), `Language changed to ${lng === 'rw' ? t('common.kinyarwanda') : t('common.english')}`);
  };

  const handleSaveTheme = () => {
    Alert.alert(t('common.success'), `Theme set to ${theme}`);
  };

  const languages = [
    { code: 'en', label: t('common.english'),     flag: require('../../src/assets/images/england.jpg') },
    { code: 'rw', label: t('common.kinyarwanda'), flag: require('../../src/assets/images/rwanda.png') },
  ];

  const themes: Array<{ key: 'System' | 'Light' | 'Dark'; icon: any; desc: string }> = [
    { key: 'System', icon: 'phone-portrait-outline', desc: 'Follow device setting' },
    { key: 'Light',  icon: 'sunny-outline',          desc: 'Always use light mode' },
    { key: 'Dark',   icon: 'moon-outline',           desc: 'Always use dark mode' },
  ];

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={grad} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{t('profile.app_preferences')}</Text>
          <Text style={S.headerSub}>{role.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      {/* Tab switcher */}
      <View style={S.tabs}>
        {([
          { key: 'dark_mode', icon: 'moon-outline',  label: t('profile.dark_mode') },
          { key: 'language',  icon: 'globe-outline', label: t('profile.language') },
        ] as { key: SettingType; icon: any; label: string }[]).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[S.tab, activeSetting === tab.key && { borderBottomColor: grad[1], borderBottomWidth: 2 }]}
            onPress={() => setActiveSetting(tab.key)}
          >
            <Ionicons name={tab.icon} size={16} color={activeSetting === tab.key ? grad[1] : '#94A3B8'} />
            <Text style={[S.tabText, activeSetting === tab.key && { color: grad[1], fontWeight: '700' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>

        {activeSetting === 'language' ? (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Select Language</Text>
            {languages.map(lang => {
              const active = i18n.language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[S.optionCard, active && { borderColor: grad[1], borderWidth: 2 }]}
                  onPress={() => handleLanguageChange(lang.code)}
                  activeOpacity={0.8}
                >
                  <Image source={lang.flag} style={S.flag} />
                  <Text style={[S.optionLabel, active && { color: grad[1], fontWeight: '700' }]}>{lang.label}</Text>
                  {active && (
                    <View style={[S.checkCircle, { backgroundColor: grad[1] }]}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Choose Theme</Text>
            {themes.map(th => {
              const active = theme === th.key;
              return (
                <TouchableOpacity
                  key={th.key}
                  style={[S.optionCard, active && { borderColor: grad[1], borderWidth: 2 }]}
                  onPress={() => setTheme(th.key)}
                  activeOpacity={0.8}
                >
                  <View style={[S.themeIcon, { backgroundColor: active ? grad[1] + '18' : '#F8FAFC' }]}>
                    <Ionicons name={th.icon} size={20} color={active ? grad[1] : '#94A3B8'} />
                  </View>
                  <View style={S.themeInfo}>
                    <Text style={[S.optionLabel, active && { color: grad[1], fontWeight: '700' }]}>{th.key}</Text>
                    <Text style={S.optionDesc}>{th.desc}</Text>
                  </View>
                  {active && (
                    <View style={[S.checkCircle, { backgroundColor: grad[1] }]}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={[S.saveBtn, { backgroundColor: grad[1] }]} onPress={handleSaveTheme}>
              <Text style={S.saveBtnText}>Save Theme</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
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
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  scroll: { padding: 16, paddingBottom: 80 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  flag: { width: 36, height: 24, borderRadius: 4 },
  themeIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  themeInfo: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  optionDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  saveBtn: { borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
