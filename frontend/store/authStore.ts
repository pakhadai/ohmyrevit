import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Методи
  login: (initData: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (initData: string) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.loginTelegram(initData);

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success('Успішний вхід!');
        } catch (error) {
          console.error('Login error:', error);
          toast.error('Помилка авторизації');
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        toast.success('Ви вийшли з системи');
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage', // Ім'я для localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);