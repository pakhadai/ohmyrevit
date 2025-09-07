import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// OLD: import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { settings } from '@/lib/settings';

// Імпортуємо файли перекладів безпосередньо
// OLD: import translationEN from '../../public/locales/en.json';
// OLD: import translationRU from '../../public/locales/ru.json';
// OLD: import translationUK from '../../public/locales/uk.json';
import translationEN from '../public/locales/en.json';
import translationRU from '../public/locales/ru.json';
import translationUK from '../public/locales/uk.json';

const resources = {
  en: {
    translation: translationEN,
  },
  ru: {
    translation: translationRU,
  },
  uk: {
    translation: translationUK,
  },
};

i18n
  // OLD: .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: settings.supportedLanguages,
    fallbackLng: settings.defaultLanguage,

    // Вмикаємо логування в режимі розробки
    debug: process.env.NODE_ENV === 'development',

    // OLD: // Налаштування для завантаження перекладів
    // OLD: backend: {
    // OLD:   loadPath: '/locales/{{lng}}.json', // Шлях до файлів перекладу
    // OLD: },

    // Налаштування для визначення мови
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language-storage', // Ключ, що використовується в Zustand

      // Кастомна функція для парсингу стану Zustand з localStorage
      parse: (languages: readonly string[]): string | undefined => {
        try {
          const languageStorage = localStorage.getItem('language-storage');
          if (!languageStorage) return undefined;

          // Спочатку пробуємо парсити як JSON (від Zustand)
          try {
            const persistedState = JSON.parse(languageStorage);
            const lang = persistedState?.state?.language;
            if (lang && languages.includes(lang)) {
              return lang;
            }
          } catch (e) {
            // Якщо не вийшло, припускаємо, що це простий рядок (від i18next cache)
            if (languages.includes(languageStorage)) {
              return languageStorage;
            }
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