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
          const response = await authAPI.loginTelegram(initData);
          console.log("Auth Response:", response);

          // Отримуємо токен (API повертає access_token)
          // Використовуємо any, щоб уникнути помилок типів, якщо інтерфейс не оновився
          const data: any = response;
          const accessToken = data.accessToken || data.access_token;
          const rawUser = data.user;

          if (!accessToken || !rawUser) {
            console.error("Missing token or user in response", data);
            throw new Error(i18n.t('auth.serverDataError') || 'Server Error');
          }

          // Маппінг snake_case (API) -> camelCase (Frontend)
          const normalizedUser: User = {
            id: rawUser.id,
            telegramId: rawUser.telegram_id, // snake_case з бекенду
            username: rawUser.username,
            firstName: rawUser.first_name,   // snake_case з бекенду
            lastName: rawUser.last_name,     // snake_case з бекенду
            email: rawUser.email,
            photoUrl: rawUser.photo_url,     // snake_case з бекенду
            languageCode: rawUser.language_code || 'uk',
            isAdmin: rawUser.is_admin,       // snake_case з бекенду
            balance: rawUser.balance || 0,
            bonusStreak: rawUser.bonus_streak || 0,
            lastBonusClaimDate: rawUser.last_bonus_claim_date,
            referralCode: rawUser.referral_code
          };

          const isNewUser = data.isNewUser || data.is_new_user || false;

          set({
            user: normalizedUser,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            lastLoginAt: Date.now(),
            isNewUser: isNewUser,
          });
          return response;
        } catch (error: any) {
          console.error("Login error:", error);
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
        // Безпечний доступ до ID
        const u = get().user;
        const uid = u ? (u.telegramId || u.id) : null;
        if (uid) {
          localStorage.setItem(`onboarding_${uid}`, 'true');
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