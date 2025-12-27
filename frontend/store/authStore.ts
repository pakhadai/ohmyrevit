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
  loginWithTelegram: (initData: string) => Promise<any>;
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
  if (!rawUser) {
    throw new Error('No user data provided');
  }

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

          // Логуємо повну відповідь для діагностики
          console.log('[AuthStore] Full API response:', JSON.stringify(response, null, 2));

          // API повертає snake_case!
          // response = { access_token: "...", token_type: "bearer", user: {...}, is_new_user: false }

          // Отримуємо токен - ВАЖЛИВО: API повертає access_token (snake_case)
          const accessToken = response.access_token || response.accessToken;

          // Отримуємо дані користувача
          const rawUser = response.user;

          console.log('[AuthStore] Parsed data:', {
            hasAccessToken: !!accessToken,
            accessTokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : null,
            hasUser: !!rawUser,
            rawUserKeys: rawUser ? Object.keys(rawUser) : null
          });

          if (!accessToken) {
            console.error('[AuthStore] No access token found in response');
            console.error('[AuthStore] Response keys:', Object.keys(response));
            throw new Error('Сервер не повернув токен авторизації');
          }

          if (!rawUser) {
            console.error('[AuthStore] No user data found in response');
            throw new Error('Сервер не повернув дані користувача');
          }

          // Нормалізуємо дані користувача
          const normalizedUser = normalizeUser(rawUser);
          console.log('[AuthStore] Normalized user:', normalizedUser);

          // Визначаємо чи це новий користувач (API повертає is_new_user)
          const isNewUser = response.is_new_user || response.isNewUser || false;

          set({
            user: normalizedUser,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            lastLoginAt: Date.now(),
            isNewUser: isNewUser,
          });

          console.log('[AuthStore] ✅ Login successful!', {
            userId: normalizedUser.id,
            isNewUser: isNewUser,
            isAuthenticated: true
          });

          return response;

        } catch (error: any) {
          console.error('[AuthStore] ❌ Login error:', error);
          console.error('[AuthStore] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });

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

      loginWithTelegram: async (initData: string) => {
        return get().login({ initData });
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
          console.log('[AuthStore] Updating balance:', currentUser.balance, '->', newBalance);
          set({
            user: { ...currentUser, balance: newBalance }
          });
        }
      },

      completeOnboarding: () => {
        set({ isNewUser: false });
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