import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';

interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name: string;
  is_admin: boolean;
  bonus_balance: number;
  bonus_streak: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (initData: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (initData: string) => {
        try {
          const response = await api.post('/auth/telegram', { init_data: initData });
          const { access_token, user } = response.data;

          set({
            user,
            token: access_token,
            isAuthenticated: true
          });

          // Встановлюємо токен для API
          api.defaults.headers.Authorization = `Bearer ${access_token}`;
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        delete api.defaults.headers.Authorization;
      },

      updateUser: (user: User) => set({ user })
    }),
    {
      name: 'auth-storage'
    }
  )
);