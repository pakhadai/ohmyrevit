import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/types';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;

  // Переклади для UI
  translations: {
    [key: string]: {
      uk: string;
      en: string;
      ru: string;
    };
  };

  t: (key: string) => string;
}

// Базові переклади для інтерфейсу
const baseTranslations = {
  'nav.home': {
    uk: 'Головна',
    en: 'Home',
    ru: 'Главная',
  },
  'nav.market': {
    uk: 'Маркет',
    en: 'Market',
    ru: 'Маркет',
  },
  'nav.cart': {
    uk: 'Кошик',
    en: 'Cart',
    ru: 'Корзина',
  },
  'nav.profile': {
    uk: 'Профіль',
    en: 'Profile',
    ru: 'Профиль',
  },
  'search.placeholder': {
    uk: 'Пошук товарів...',
    en: 'Search products...',
    ru: 'Поиск товаров...',
  },
  'product.new': {
    uk: 'Новинка',
    en: 'New',
    ru: 'Новинка',
  },
  'product.sale': {
    uk: 'Знижка',
    en: 'Sale',
    ru: 'Скидка',
  },
  'product.addToCart': {
    uk: 'В кошик',
    en: 'Add to cart',
    ru: 'В корзину',
  },
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'uk',
      translations: baseTranslations,

      setLanguage: (language: Language) => {
        set({ language });
      },

      t: (key: string) => {
        const translations = get().translations;
        const language = get().language;

        if (translations[key]) {
          return translations[key][language] || translations[key]['uk'];
        }

        return key; // Повертаємо ключ, якщо переклад не знайдено
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