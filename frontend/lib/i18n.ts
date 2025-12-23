// frontend/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { authTranslations } from './translations-auth';
import { collectionsTranslations } from './translations-collections';
import { profileSubpagesTranslations } from './translations-profile-subpages';
import { subscriptionTranslations } from './translations-subscription';
import { profileTranslations } from './translations-profile';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { settings } from '@/lib/settings';

const isBrowser = typeof window !== 'undefined';

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

    // В розробці краще бачити помилки, але в продакшені вимикаємо
    debug: process.env.NODE_ENV === 'development',

    backend: {
      loadPath: '/locales/{{lng}}.json',
    },

    // Пріоритет завантаження перекладів:
    // 1. JSON файли (через HttpApi) - вони головні
    // 2. TypeScript модулі - як fallback або для частини компонентів
    partialBundledLanguages: true,

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language-storage',

      // Кастомний парсер для Zustand persist storage
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
            // Fallback якщо формат просто string
            const rawValue = languageStorage.replace(/"/g, '');
            if (languages.includes(rawValue)) lang = rawValue;
          }
          if (lang && languages.includes(lang)) return lang;
        } catch (e) {
          console.error('Could not parse language from localStorage', e);
        }
        return undefined;
      },
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false, // Важливо для Next.js SSR
    },
  });

// Додаємо ресурси з TS файлів вручну, щоб вони були доступні миттєво
// Це гібридний підхід: основні тексти в JSON, компоненти в TS
['uk', 'en'].forEach((lang) => {
  const tsResources = {
    ...authTranslations[lang as 'uk'|'en']?.auth,
    ...collectionsTranslations[lang as 'uk'|'en']?.collections,
    ...profileSubpagesTranslations[lang as 'uk'|'en']?.wallet,
    ...profileSubpagesTranslations[lang as 'uk'|'en']?.bonuses,
    ...profileSubpagesTranslations[lang as 'uk'|'en']?.referrals,
    ...profileSubpagesTranslations[lang as 'uk'|'en']?.downloads,
    ...profileSubpagesTranslations[lang as 'uk'|'en']?.settings,
    ...profileSubpagesTranslations[lang as 'uk'|'en']?.support,
    ...profileSubpagesTranslations[lang as 'uk'|'en']?.faq,
    ...subscriptionTranslations[lang as 'uk'|'en']?.subscription,
    ...profileTranslations[lang as 'uk'|'en']?.profilePages, // Додано
  };

  i18n.addResourceBundle(lang, 'translation', tsResources, true, true);
});

export default i18n;