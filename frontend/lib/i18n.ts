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
          // # OLD: const persistedState = JSON.parse(localStorage.getItem('language-storage') || '{}');
          // # OLD: const lang = persistedState?.state?.language;
          // # OLD: if (lang && languages.includes(lang)) {
          // # OLD:   return lang;
          // # OLD: }
          const languageStorage = localStorage.getItem('language-storage');
          if (!languageStorage) return undefined;

          let lang: string | undefined;

          // Спроба 1: Розпарсити як JSON-об'єкт від Zustand
          try {
            const persistedState = JSON.parse(languageStorage);
            lang = persistedState?.state?.language;
          } catch (e) {
            // Спроба 2: Обробити як простий рядок (може бути збережено i18next-detector)
            const rawValue = languageStorage.replace(/"/g, ''); // Видаляємо лапки на випадок '"uk"'
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
      useSuspense: false, // Рекомендується для App Router, щоб уникнути проблем з рендерингом
    },
  });

export default i18n;