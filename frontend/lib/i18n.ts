import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { authTranslations } from './translations-auth';
import { collectionsTranslations } from './translations-collections';
import { profileSubpagesTranslations } from './translations-profile-subpages';
import { subscriptionTranslations } from './translations-subscription';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { settings } from '@/lib/settings';

const isBrowser = typeof window !== 'undefined';

const resources = {
  uk: {
    translation: {
      ...existingUk,
      ...authTranslations.uk.auth,
      ...collectionsTranslations.uk.collections,
      ...existingUk,
      ...profileSubpagesTranslations.uk.wallet,
      ...profileSubpagesTranslations.uk.bonuses,
      ...profileSubpagesTranslations.uk.referrals,
      ...profileSubpagesTranslations.uk.downloads,
      ...profileSubpagesTranslations.uk.settings,
      ...profileSubpagesTranslations.uk.support,
      ...profileSubpagesTranslations.uk.faq,
      ...subscriptionTranslations.uk.subscription,
    }
  },
  en: {
    translation: {
      ...existingEn,
      ...authTranslations.en.auth,
      ...collectionsTranslations.en.collections,
      ...existingEn,
      ...profileSubpagesTranslations.en.wallet,
      ...profileSubpagesTranslations.en.bonuses,
      ...profileSubpagesTranslations.en.referrals,
      ...profileSubpagesTranslations.en.downloads,
      ...profileSubpagesTranslations.en.settings,
      ...profileSubpagesTranslations.en.support,
      ...profileSubpagesTranslations.en.faq,
      ...subscriptionTranslations.en.subscription,
    }
  }
};

i18n
  .use(isBrowser ? HttpApi : {
      type: 'backend',
      read: (language: string, namespace: string, callback: (err: any, data: any) => void) => {
          callback(null, {});
      }
  } as any)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: settings.supportedLanguages,
    fallbackLng: settings.defaultLanguage,

    debug: process.env.NODE_ENV === 'development',

    backend: {
      loadPath: '/locales/{{lng}}.json',
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language-storage',

      parse: (languages: readonly string[]): string | undefined => {
        if (!isBrowser) return undefined;

        try {
          const languageStorage = localStorage.getItem('language-storage');
          if (!languageStorage) return undefined;

          let lang: string | undefined;

          try {
            const persistedState = JSON.parse(languageStorage);
            lang = persistedState?.state?.language;
          } catch (e) {

            const rawValue = languageStorage.replace(/"/g, '');
            if (languages.includes(rawValue)) {
              lang = rawValue;
            }
          }

          if (lang && languages.includes(lang)) {
            return lang;
          }
        } catch (e) {
          console.error('Could not parse language from localStorage for i18next', e);
        }
        return undefined;
      },
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  } as any);

export default i18n;