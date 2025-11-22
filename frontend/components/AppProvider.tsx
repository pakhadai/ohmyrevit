'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCollectionStore } from '../store/collectionStore';
import { useLanguageStore } from '../store/languageStore';
import Onboarding from './Onboarding';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n from '../lib/i18n';
import { useUIStore } from '../store/uiStore';

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, login, isLoading, isAuthenticated, isNewUser, completeOnboarding } = useAuthStore();
  const { fetchInitialData } = useCollectionStore();
  const { setLanguage } = useLanguageStore();
  const { setTheme } = useUIStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const authAttempted = useRef(false);
  const { t } = useTranslation();
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    const storedTheme = useUIStore.getState().theme;
    setTheme(storedTheme);

    const handleInitialized = () => {
      console.log('🌍 i18next has been initialized.');
      const storedLanguage = useLanguageStore.getState().language;
      if (i18n.language !== storedLanguage) {
        i18n.changeLanguage(storedLanguage);
      }
      setIsI18nReady(true);
    };

    if (i18n.isInitialized) {
      handleInitialized();
    } else {
      i18n.on('initialized', handleInitialized);
    }

    const initializeTelegram = async () => {
      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
      // Перевіряємо наявність реферального коду
      const startParam = tg?.initDataUnsafe?.start_param;
      const hasStartParam = !!startParam;

      // Логіка: Якщо ми вже пробували авторизуватися АБО (ми авторизовані І немає нового реферального коду), то пропускаємо
      if (authAttempted.current || (isAuthenticated && !hasStartParam)) {
        setAppReady(true);
        if (isAuthenticated) fetchInitialData();
        return;
      }

      console.log('🚀 Initializing Telegram Mini App...');
      let attempts = 0;
      const maxAttempts = 20;

      const checkTelegram = async () => {
        attempts++;

        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;

          tg.ready();
          tg.expand();

          console.log('📱 Telegram WebApp found');

          const initData = tg.initDataUnsafe;

          if (initData && initData.user) {
            console.log('👤 Telegram User:', initData.user);

            if (initData.start_param) {
                console.log('🎁 Found referral code:', initData.start_param);
            }

            const authData = {
              id: initData.user.id,
              first_name: initData.user.first_name || t('common.userFallbackName'),
              last_name: initData.user.last_name || '',
              username: initData.user.username || '',
              photo_url: initData.user.photo_url || '',
              language_code: initData.user.language_code || 'uk',
              is_premium: initData.user.is_premium || false,
              auth_date: initData.auth_date || Math.floor(Date.now() / 1000),
              hash: initData.hash || '',
              query_id: initData.query_id || '',
              start_param: initData.start_param || null // Передаємо код на бекенд
            };

            try {
              authAttempted.current = true;
              // Цей виклик відправить start_param на сервер
              const loginResponse = await login(authData);
              await fetchInitialData();

              if (loginResponse.is_new_user && authData.language_code) {
                setLanguage(authData.language_code as any);
              }

              // Показуємо тост, якщо реферал спрацював (можна перевірити в loginResponse, якщо бекенд повертає інфо)
              if (hasStartParam) {
                  console.log('Ref check sent');
              }

              console.log('✅ Authorization successful');
              setAppReady(true);

            } catch (error: any) {
              console.error('❌ Authorization error:', error);
              setAuthError(t('appProvider.loginError'));
              toast.error(t('toasts.authError'), {
                duration: 5000
              });
            }
          } else {
            console.warn('⚠️ No user data from Telegram');
            setAuthError(t('appProvider.telegramOnlyError'));
          }
        } else if (attempts >= maxAttempts) {
          console.error('❌ Telegram WebApp did not load');
          setAuthError(t('appProvider.telegramConnectionError'));
          setAppReady(true);
        } else {
          setTimeout(checkTelegram, 500);
        }
      };

      checkTelegram();
    };

    initializeTelegram();

    return () => {
      i18n.off('initialized', handleInitialized);
    };
  }, [login, isAuthenticated, fetchInitialData, t, setTheme, setLanguage]);

  useEffect(() => {
    if (isAuthenticated && user && isNewUser) {
      const onboardingKey = `onboarding_${user.telegram_id}`;
      const hasCompletedOnboarding = localStorage.getItem(onboardingKey) === 'true';
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user, isNewUser]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    completeOnboarding();
  };

  if (!appReady || isLoading || !isI18nReady) {
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