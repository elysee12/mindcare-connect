import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './translations/en.json';
import rw from './translations/rw.json';

const LANGUAGE_KEY = '@mindcare_connect_language';

const resources = {
  en: { translation: en },
  rw: { translation: rw },
};

/**
 * Persist the selected language to AsyncStorage whenever it changes.
 */
i18n.on('languageChanged', (lng: string) => {
  AsyncStorage.setItem(LANGUAGE_KEY, lng).catch(() => {});
});

/**
 * Load the persisted language from AsyncStorage, falling back to the device
 * locale (or English if the device locale is not supported).
 */
export async function loadPersistedLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored && (stored === 'en' || stored === 'rw')) {
      await i18n.changeLanguage(stored);
      return;
    }
  } catch {
    // ignore storage errors
  }

  // Fall back to device locale
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
  await i18n.changeLanguage(deviceLocale === 'rw' ? 'rw' : 'en');
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    // Start with device locale; loadPersistedLanguage() will override this
    // once AsyncStorage is ready (called from _layout.tsx).
    lng: Localization.getLocales()[0]?.languageCode === 'rw' ? 'rw' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
