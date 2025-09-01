// frontend/store/authStore.ts
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
  lastLoginAt: number | null; // ДОДАНО: Час останнього успішного логіну

  // Методи
  login: (initData: object) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  checkTokenValidity: () => void; // ДОДАНО: Метод для перевірки актуальності токена
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      lastLoginAt: null, // ДОДАНО

      login: async (initData: object) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.loginTelegram(initData);

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            lastLoginAt: Date.now(), // ДОДАНО: Зберігаємо час входу
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
          lastLoginAt: null, // ДОДАНО: Очищуємо час
        });
        toast.success('Ви вийшли з системи');
      },

      setUser: (user: User) => {
        set({ user });
      },

      // ДОДАНО: Новий метод для перевірки
      checkTokenValidity: () => {
        const { lastLoginAt } = get();
        if (!lastLoginAt) return;

        // 24 години в мілісекундах
        const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

        if (Date.now() - lastLoginAt > TOKEN_LIFETIME_MS) {
          // Якщо токен прострочений - викликаємо logout
          get().logout();
          toast.error("Сесія застаріла. Будь ласка, увійдіть знову.");
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastLoginAt: state.lastLoginAt, // ДОДАНО: Зберігаємо в localStorage
      }),
    }
  )
);