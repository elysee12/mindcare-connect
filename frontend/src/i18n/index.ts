import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './translations/en.json';
import rw from './translations/rw.json';

const resources = {
  en: { translation: en },
  rw: { translation: rw },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0].languageCode === 'rw' ? 'rw' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
