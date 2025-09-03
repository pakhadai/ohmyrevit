'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import Onboarding from './Onboarding';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Telegram?: any;
  }
}

let isLoginToastShown = false;

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, login, isLoading, isAuthenticated } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const authAttempted = useRef(false);

  useEffect(() => {
    const initializeTelegram = async () => {
      // Запобігаємо повторним спробам
      if (authAttempted.current || isAuthenticated) {
        setAppReady(true);
        return;
      }

      console.log('🚀 Ініціалізація Telegram Mini App...');

      // Чекаємо на Telegram WebApp
      let attempts = 0;
      const maxAttempts = 20; // 10 секунд максимум

      const checkTelegram = async () => {
        attempts++;

        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;

          // Ініціалізуємо Telegram Mini App
          tg.ready();
          tg.expand();

          console.log('📱 Telegram WebApp знайдено');

          // Отримуємо дані користувача
          const initData = tg.initDataUnsafe;

          if (initData && initData.user) {
            console.log('👤 Користувач Telegram:', initData.user);

            // Формуємо дані для авторизації
            const authData = {
              id: initData.user.id,
              first_name: initData.user.first_name || 'Користувач',
              last_name: initData.user.last_name || '',
              username: initData.user.username || '',
              photo_url: initData.user.photo_url || '',
              language_code: initData.user.language_code || 'uk',
              is_premium: initData.user.is_premium || false,
              auth_date: initData.auth_date || Math.floor(Date.now() / 1000),
              hash: initData.hash || '',
              query_id: initData.query_id || ''
            };

            try {
              authAttempted.current = true;
              await login(authData);

              // Показуємо привітання
              const userName = authData.first_name || 'Користувач';
              toast.success(`Вітаємо, ${userName}! 😊`, {
                duration: 4000,
                position: 'top-center',
                style: {
                  background: '#10B981',
                  color: 'white',
                  fontSize: '16px',
                  padding: '16px',
                  borderRadius: '12px'
                }
              });

              console.log('✅ Авторизація успішна');
              setAppReady(true);

              // Перевіряємо онбординг
              const onboardingKey = `onboarding_${initData.user.id}`;
              const wasShown = localStorage.getItem(onboardingKey);
              if (!wasShown) {
                setShowOnboarding(true);
              }

            } catch (error: any) {
              console.error('❌ Помилка авторизації:', error);
              setAuthError('Не вдалося увійти. Спробуйте перезавантажити додаток.');
              toast.error('Помилка авторизації. Спробуйте ще раз.', {
                duration: 5000
              });
            }
          } else {
            console.warn('⚠️ Немає даних користувача від Telegram');
            setAuthError('Додаток працює тільки в Telegram');
          }
        } else if (attempts >= maxAttempts) {
          console.error('❌ Telegram WebApp не завантажився');
          setAuthError('Не вдалося підключитися до Telegram. Відкрийте додаток через Telegram.');
          setAppReady(true);
        } else {
          // Спробуємо ще раз через 500мс
          setTimeout(checkTelegram, 500);
        }
      };

      // Починаємо перевірку
      checkTelegram();
    };

    // Запускаємо ініціалізацію
    if (!authAttempted.current && !isAuthenticated) {
      initializeTelegram();
    } else {
      setAppReady(true);
    }
  }, [login, isAuthenticated]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_${user.telegram_id}`, 'true');
    }
    setShowOnboarding(false);
  };

  // Показуємо екран завантаження
  if (!appReady || isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">OhMyRevit</h2>
          <p className="text-white/80">Завантаження...</p>
        </div>
      </div>
    );
  }

  // Показуємо помилку якщо не вдалося авторизуватися
  if (authError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-600 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Упс! Щось пішло не так</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            Спробувати ще раз
          </button>
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