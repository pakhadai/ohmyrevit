// frontend/store/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme } from '@/types';

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light', // Тема за замовчуванням

      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(theme);
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'ui-storage', // Ключ для localStorage
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);