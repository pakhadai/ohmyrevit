'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCollectionStore } from '@/store/collectionStore';
import Onboarding from './Onboarding';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next'; // ДОДАНО

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, login, isLoading, isAuthenticated } = useAuthStore();
  const { fetchInitialData } = useCollectionStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const authAttempted = useRef(false);
  const { t } = useTranslation(); // ДОДАНО

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
              query_id: initData.query_id || '',
              start_param: initData.start_param || null
            };

            try {
              authAttempted.current = true;
              // OLD: await login(authData);
              const loginResponse = await login(authData);
              await fetchInitialData();

              // Показуємо привітання
              const userName = authData.first_name || 'Користувач';
              toast.success(t('toasts.welcome', { userName }), {
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

              // OLD: // Перевіряємо онбординг
              // OLD: const onboardingKey = `onboarding_${initData.user.id}`;
              // OLD: const wasShown = localStorage.getItem(onboardingKey);
              // OLD: if (!wasShown) {
              // OLD:   setShowOnboarding(true);
              // OLD: }
              if (loginResponse.is_new_user) {
                setShowOnboarding(true);
              }

            } catch (error: any) {
              console.error('❌ Помилка авторизації:', error);
              setAuthError(t('appProvider.loginError'));
              toast.error(t('toasts.authError'), {
                duration: 5000
              });
            }
          } else {
            console.warn('⚠️ Немає даних користувача від Telegram');
            setAuthError(t('appProvider.telegramOnlyError'));
          }
        } else if (attempts >= maxAttempts) {
          console.error('❌ Telegram WebApp не завантажився');
          setAuthError(t('appProvider.telegramConnectionError'));
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
      if (isAuthenticated) {
        fetchInitialData();
      }
      setAppReady(true);
    }
  }, [login, isAuthenticated, fetchInitialData, t]);

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
          <p className="text-white/80">{t('common.loading')}</p>
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
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('common.oops')}</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            {t('common.tryAgain')}
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