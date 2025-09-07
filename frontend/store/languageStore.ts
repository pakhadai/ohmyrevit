// ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/types';
import i18n from '@/lib/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'uk',

      setLanguage: (language: Language) => {
        // Синхронізуємо мову з i18next
        i18n.changeLanguage(language);
        // Оновлюємо стан в Zustand
        set({ language });
      },
    }),
    {
      name: 'language-storage',
      partialize: (state) => ({
        language: state.language,
      }),
    }
  )
);