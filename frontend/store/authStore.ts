import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import i18n from '@/lib/i18n';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastLoginAt: number | null;
  isNewUser: boolean | null;

  login: (initData: object) => Promise<any>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void; // <--- 1. ДОДАНО В ІНТЕРФЕЙС
  updateBalance: (newBalance: number) => void;
  checkTokenValidity: () => void;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      lastLoginAt: null,
      isNewUser: null,

      login: async (initData: object) => {
        // ... (ваш існуючий код login)
        set({ isLoading: true, isNewUser: null });
        try {
          const response = await authAPI.loginTelegram(initData);
          if (!response || !response.user || !response.access_token) {
            throw new Error(i18n.t('auth.serverDataError'));
          }
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            lastLoginAt: Date.now(),
            isNewUser: response.is_new_user,
          });
          return response;
        } catch (error: any) {
          set({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
            isNewUser: null,
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
          isNewUser: null,
        });
        toast.success(i18n.t('toasts.loggedOut'));
      },

      setUser: (user: User) => {
        set({ user });
      },

      // <--- 2. ДОДАНО РЕАЛІЗАЦІЮ
      setToken: (token: string) => {
        set({
            token,
            isAuthenticated: true,
            lastLoginAt: Date.now()
        });
      },

      updateBalance: (newBalance: number) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, balance: newBalance }
          });
        }
      },

      completeOnboarding: () => {
        set({ isNewUser: false });
        if (get().user) {
          localStorage.setItem(`onboarding_${get().user!.telegram_id}`, 'true');
        }
      },

      checkTokenValidity: () => {
        const { lastLoginAt } = get();
        if (!lastLoginAt) return;
        const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
        if (Date.now() - lastLoginAt > TOKEN_LIFETIME_MS) {
          get().logout();
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
        isNewUser: state.isNewUser,
      }),
    }
  )
);