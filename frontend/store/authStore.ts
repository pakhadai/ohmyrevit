// frontend/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import i18n from '@/lib/i18n'; // ДОДАНО

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastLoginAt: number | null;

  login: (initData: object) => Promise<any>; // Змінено тип повернення
  logout: () => void;
  setUser: (user: User) => void;
  checkTokenValidity: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      lastLoginAt: null,

      login: async (initData: object) => {
        set({ isLoading: true });

        try {
          console.log('🔐 Починаємо авторизацію...');
          const response = await authAPI.loginTelegram(initData);

          if (!response || !response.user || !response.access_token) {
            throw new Error('Сервер не повернув дані користувача');
          }

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            lastLoginAt: Date.now(),
          });

          console.log('✅ Користувач авторизований:', response.user.first_name);
          return response; // Повертаємо всю відповідь

        } catch (error: any) {
          console.error('❌ Помилка авторизації:', error);

          set({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null
          });

          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          lastLoginAt: null,
        });
        // OLD: toast.success('Ви вийшли з системи');
        toast.success(i18n.t('toasts.loggedOut'));
      },

      setUser: (user: User) => {
        set({ user });
      },

      checkTokenValidity: () => {
        const { lastLoginAt } = get();
        if (!lastLoginAt) return;

        const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

        if (Date.now() - lastLoginAt > TOKEN_LIFETIME_MS) {
          get().logout();
          // OLD: toast.error("Сесія застаріла. Будь ласка, увійдіть знову.");
          toast.error(i18n.t('toasts.sessionExpired'));
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastLoginAt: state.lastLoginAt,
      }),
    }
  )
);