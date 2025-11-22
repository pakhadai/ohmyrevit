import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { settings } from '@/lib/settings';

// Перевіряємо, чи ми в браузері
const isBrowser = typeof window !== 'undefined';

i18n
  // Використовуємо бекенд тільки в браузері
  .use(isBrowser ? HttpApi : {
      type: 'backend',
      read: (language: string, namespace: string, callback: (err: any, data: any) => void) => {
          // На сервері повертаємо пустий об'єкт, щоб не було помилок
          callback(null, {});
      }
  })
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: settings.supportedLanguages,
    fallbackLng: settings.defaultLanguage,

    // Вмикаємо логування в режимі розробки
    debug: process.env.NODE_ENV === 'development',

    // Налаштування для завантаження перекладів (працюватиме тільки в браузері завдяки умові вище)
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },

    // Налаштування для визначення мови
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language-storage',

      // Кастомна функція для парсингу стану Zustand з localStorage
      parse: (languages: readonly string[]): string | undefined => {
        if (!isBrowser) return undefined;

        try {
          const languageStorage = localStorage.getItem('language-storage');
          if (!languageStorage) return undefined;

          let lang: string | undefined;

          // Спроба 1: Розпарсити як JSON-об'єкт від Zustand
          try {
            const persistedState = JSON.parse(languageStorage);
            lang = persistedState?.state?.language;
          } catch (e) {
            // Спроба 2: Обробити як простий рядок
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
      escapeValue: false, // React вже захищає від XSS
    },

    react: {
      useSuspense: false, // Рекомендується для App Router
    },
  });

export default i18n;