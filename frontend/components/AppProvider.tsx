'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCollectionStore } from '@/store/collectionStore';
import Onboarding from './Onboarding';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

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
  const { t } = useTranslation();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    if (i18n.isInitialized) {
      setI18nReady(true);
    } else {
      i18n.on('initialized', () => {
        setI18nReady(true);
      });
    }

    return () => {
      i18n.off('initialized');
    };
  }, []);


  useEffect(() => {
    const initializeTelegram = async () => {
      if (authAttempted.current || isAuthenticated || !i18nReady) {
        setAppReady(true);
        return;
      }

      console.log('🚀 Ініціалізація Telegram Mini App...');

      let attempts = 0;
      const maxAttempts = 20;

      const checkTelegram = async () => {
        attempts++;

        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;

          tg.ready();
          tg.expand();

          console.log('📱 Telegram WebApp знайдено');

          const initData = tg.initDataUnsafe;

          if (initData && initData.user) {
            console.log('👤 Користувач Telegram:', initData.user);

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
              await fetchInitialData();

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

              const onboardingKey = `onboarding_${initData.user.id}`;
              const wasShown = localStorage.getItem(onboardingKey);
              if (!wasShown) {
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
          setTimeout(checkTelegram, 500);
        }
      };

      checkTelegram();
    };

    if (!authAttempted.current && !isAuthenticated && i18nReady) {
      initializeTelegram();
    } else {
      if (isAuthenticated) {
        fetchInitialData();
      }
      setAppReady(true);
    }
  }, [login, isAuthenticated, fetchInitialData, t, i18nReady]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_${user.telegram_id}`, 'true');
    }
    setShowOnboarding(false);
  };

  if (!appReady || isLoading || !i18nReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">OhMyRevit</h2>
          <p className="text-white/80">{i18n.isInitialized ? t('common.loading') : 'Initializing...'}</p>
        </div>
      </div>
    );
  }

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