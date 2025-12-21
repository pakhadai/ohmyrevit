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
  setToken: (token: string) => void;
  updateBalance: (newBalance: number) => void;
  checkTokenValidity: () => void;
  completeOnboarding: () => void;
}

/**
 * Нормалізує дані користувача з API (snake_case) до фронтенд формату (camelCase)
 */
const normalizeUser = (rawUser: any): User => {
  return {
    id: rawUser.id,
    telegramId: rawUser.telegram_id ?? rawUser.telegramId,
    username: rawUser.username,
    firstName: rawUser.first_name ?? rawUser.firstName ?? 'User',
    lastName: rawUser.last_name ?? rawUser.lastName,
    email: rawUser.email,
    photoUrl: rawUser.photo_url ?? rawUser.photoUrl,
    languageCode: rawUser.language_code ?? rawUser.languageCode ?? 'uk',
    isAdmin: rawUser.is_admin ?? rawUser.isAdmin ?? false,
    balance: rawUser.balance ?? 0,
    bonusStreak: rawUser.bonus_streak ?? rawUser.bonusStreak ?? 0,
    lastBonusClaimDate: rawUser.last_bonus_claim_date ?? rawUser.lastBonusClaimDate,
    referralCode: rawUser.referral_code ?? rawUser.referralCode,
    isEmailVerified: rawUser.is_email_verified ?? rawUser.isEmailVerified ?? false,
  };
};

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
        set({ isLoading: true, isNewUser: null });

        try {
          console.log('[AuthStore] Sending login request...');
          const response = await authAPI.loginTelegram(initData);
          console.log('[AuthStore] Raw API response:', response);

          // API може повертати дані в різних форматах
          const data: any = response;

          // Отримуємо токен (підтримуємо обидва формати)
          const accessToken = data.access_token || data.accessToken;
          const rawUser = data.user;

          if (!accessToken) {
            console.error('[AuthStore] No access token in response:', data);
            throw new Error(i18n.t('auth.noTokenError', 'Не отримано токен авторизації'));
          }

          if (!rawUser) {
            console.error('[AuthStore] No user data in response:', data);
            throw new Error(i18n.t('auth.noUserError', 'Не отримано дані користувача'));
          }

          // Нормалізуємо дані користувача
          const normalizedUser = normalizeUser(rawUser);
          console.log('[AuthStore] Normalized user:', normalizedUser);

          // Визначаємо чи це новий користувач
          const isNewUser = data.is_new_user || data.isNewUser || false;

          set({
            user: normalizedUser,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            lastLoginAt: Date.now(),
            isNewUser: isNewUser,
          });

          console.log('[AuthStore] Login successful, isNewUser:', isNewUser);
          return response;

        } catch (error: any) {
          console.error('[AuthStore] Login error:', error);
          console.error('[AuthStore] Error response:', error.response?.data);

          set({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
            isNewUser: null,
          });

          // Показуємо помилку користувачу
          const errorMessage = error.response?.data?.detail ||
                              error.message ||
                              i18n.t('auth.loginError', 'Помилка входу');

          // Не показуємо toast тут, щоб AppProvider міг обробити помилку
          throw error;
        }
      },

      logout: () => {
        console.log('[AuthStore] Logging out...');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          lastLoginAt: null,
          isNewUser: null,
        });
        toast.success(i18n.t('toasts.loggedOut', 'Ви вийшли з акаунту'));
      },

      setUser: (user: User) => {
        console.log('[AuthStore] Setting user:', user);
        set({ user });
      },

      setToken: (token: string) => {
        console.log('[AuthStore] Setting token');
        set({
            token,
            isAuthenticated: true,
            lastLoginAt: Date.now()
        });
      },

      updateBalance: (newBalance: number) => {
        const currentUser = get().user;
        if (currentUser) {
          console.log('[AuthStore] Updating balance:', newBalance);
          set({
            user: { ...currentUser, balance: newBalance }
          });
        }
      },

      completeOnboarding: () => {
        set({ isNewUser: false });
        // Зберігаємо в localStorage для надійності
        const u = get().user;
        const uid = u ? (u.telegramId || u.id) : null;
        if (uid) {
          localStorage.setItem(`onboarding_${uid}`, 'true');
        }
        console.log('[AuthStore] Onboarding completed');
      },

      checkTokenValidity: () => {
        const { lastLoginAt, token } = get();

        if (!lastLoginAt || !token) return;

        // Токен дійсний 24 години
        const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

        if (Date.now() - lastLoginAt > TOKEN_LIFETIME_MS) {
          console.log('[AuthStore] Token expired, logging out');
          get().logout();
          toast.error(i18n.t('toasts.sessionExpired', 'Сесія закінчилась, увійдіть знову'));
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