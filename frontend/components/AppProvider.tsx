'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Onboarding from './Onboarding';
import toast from 'react-hot-toast';

// Інтерфейс для Telegram WebApp
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
      photo_url?: string;
    };
    auth_date: number;
    hash: string;
    query_id?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
  };
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: any;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, login, isLoading, isAuthenticated, checkTokenValidity } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initAttempted, setInitAttempted] = useState(false);

  useEffect(() => {
    // Перевіряємо наявність збереженого токена
    checkTokenValidity();

    // Якщо вже авторизовані - не намагаємось знову
    if (isAuthenticated || initAttempted) return;

    // Функція для ініціалізації з Telegram
    const initializeTelegram = () => {
      console.log('🔄 Спроба ініціалізації Telegram WebApp...');

      // Перевіряємо наявність Telegram WebApp
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;

        // Повідомляємо Telegram що додаток готовий
        tg.ready();
        tg.expand();

        console.log('📱 Telegram WebApp знайдено:', {
          version: tg.version,
          platform: tg.platform,
          colorScheme: tg.colorScheme
        });

        // Отримуємо дані користувача
        const initDataUnsafe = tg.initDataUnsafe;
        console.log('👤 Дані від Telegram:', initDataUnsafe);

        if (initDataUnsafe && initDataUnsafe.user) {
          const telegramUser = initDataUnsafe.user;

          // Формуємо об'єкт для авторизації
          const authData = {
            id: telegramUser.id,
            first_name: telegramUser.first_name || 'User',
            last_name: telegramUser.last_name || '',
            username: telegramUser.username || '',
            photo_url: telegramUser.photo_url || '',
            language_code: telegramUser.language_code || 'uk',
            is_premium: telegramUser.is_premium || false,
            auth_date: initDataUnsafe.auth_date,
            hash: initDataUnsafe.hash,
            query_id: initDataUnsafe.query_id || '',
            // Для сумісності з бекендом
            user: telegramUser
          };

          console.log('✅ Відправляємо дані на авторизацію:', authData);

          // Викликаємо логін
          login(authData);
          setInitAttempted(true);
        } else {
          console.warn('⚠️ Немає даних користувача від Telegram');

          // Для тестування в браузері (НЕ для продакшну!)
          if (process.env.NODE_ENV === 'development') {
            console.log('🧪 Режим розробки: використовуємо тестові дані');
            const testData = {
              id: 123456789,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              photo_url: '',
              language_code: 'uk',
              is_premium: false,
              auth_date: Math.floor(Date.now() / 1000),
              hash: 'test_hash_for_development',
              query_id: 'test_query'
            };

            login(testData);
            setInitAttempted(true);
          }
        }
      } else {
        console.warn('⚠️ Telegram WebApp не доступний');

        // Спробуємо ще раз через 100мс
        if (!initAttempted) {
          setTimeout(initializeTelegram, 100);
        }
      }
    };

    // Запускаємо ініціалізацію
    initializeTelegram();
  }, [isAuthenticated, login, checkTokenValidity, initAttempted]);

  // Перевіряємо чи показувати онбординг
  useEffect(() => {
    if (user && !isLoading) {
      const onboardingCompleted = localStorage.getItem('onboardingCompleted');
      const shouldShowOnboarding = !onboardingCompleted || onboardingCompleted !== 'true';

      console.log('🎯 Онбординг статус:', {
        user: user.first_name,
        completed: onboardingCompleted,
        shouldShow: shouldShowOnboarding
      });

      if (shouldShowOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user, isLoading]);

  const handleOnboardingComplete = () => {
    console.log('✅ Онбординг завершено');
    localStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  // Показуємо індикатор завантаження
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Підключення до Telegram...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {children}
    </>
  );
}