import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { settings } from '@/lib/settings';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: settings.supportedLanguages,
    fallbackLng: settings.defaultLanguage,

    // Вмикаємо логування в режимі розробки
    debug: process.env.NODE_ENV === 'development',

    // Налаштування для завантаження перекладів
    backend: {
      loadPath: '/locales/{{lng}}.json', // Шлях до файлів перекладу
    },

    // Налаштування для визначення мови
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language-storage', // Ключ, що використовується в Zustand

      // Кастомна функція для парсингу стану Zustand з localStorage
      parse: (languages: readonly string[]): string | undefined => {
        try {
          const persistedState = JSON.parse(localStorage.getItem('language-storage') || '{}');
          const lang = persistedState?.state?.language;
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
      useSuspense: false, // Рекомендується для App Router, щоб уникнути проблем з рендерингом
    },
  });

export default i18n;