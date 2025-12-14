'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCollectionStore } from '@/store/collectionStore';
import { useLanguageStore } from '@/store/languageStore';
import { useUIStore } from '@/store/uiStore';
import Onboarding from './Onboarding';
import LandingPage from './LandingPage';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { login, isLoading, isAuthenticated, completeOnboarding } = useAuthStore();
  const { fetchInitialData } = useCollectionStore();
  const { setLanguage } = useLanguageStore();
  const { setTheme } = useUIStore();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isI18nReady, setIsI18nReady] = useState(false);

  const authAttempted = useRef(false);
  const { t } = useTranslation();

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedTheme = useUIStore.getState().theme;
    setTheme(storedTheme);

    const handleInitialized = () => {
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

    return () => {
      i18n.off('initialized', handleInitialized);
    };
  }, [setTheme]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const backButton = tg.BackButton;

      const handleBack = () => {
        router.back();
      };

      if (pathname !== '/') {
        backButton.show();
        backButton.onClick(handleBack);
      } else {
        backButton.hide();
      }

      return () => {
        backButton.offClick(handleBack);
      };
    }
  }, [pathname, router]);

  const checkOnboardingStatus = () => {
    const { user, isNewUser } = useAuthStore.getState();

    if (user && isNewUser) {
      setShowOnboarding(true);
    }
  };

  useEffect(() => {
    const initializeTelegram = async () => {
      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

      let startParam = tg?.initDataUnsafe?.start_param;

      if (!startParam) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlStartApp = urlParams.get('startapp');

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashStartApp = hashParams.get('tgWebAppStartParam');

        startParam = urlStartApp || hashStartApp || null;
      }

      if (authAttempted.current || (isAuthenticated && !startParam)) {
        checkOnboardingStatus();
        setAppReady(true);
        if (isAuthenticated) fetchInitialData();
        return;
      }

      let attempts = 0;
      const maxAttempts = 5;

      const checkTelegram = async () => {
        attempts++;

        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();
          tg.enableClosingConfirmation();

          try {
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
          } catch (e) {
            console.error(e);
          }

          const initData = tg.initDataUnsafe;
          const rawInitData = tg.initData;

          if (initData && initData.user && rawInitData) {
            const authData = {
              initData: rawInitData,
              start_param: startParam || null
            };

            try {
              authAttempted.current = true;
              const loginResponse = await login(authData);
              await fetchInitialData();

              if (loginResponse.is_new_user && initData.user.language_code) {
                setLanguage(initData.user.language_code as any);
              }

              if (loginResponse.is_new_user && startParam) {
                  toast.success(t('toasts.welcome'), { duration: 4000 });
              }

              checkOnboardingStatus();
              setAppReady(true);

            } catch (error: any) {
              console.error('Authorization error:', error);
              setAuthError(t('appProvider.loginError'));
              toast.error(t('toasts.authError'));
            }
          } else {
            setAuthError('WebAppInitDataMissing');
          }
        } else if (attempts >= maxAttempts) {
          setAuthError('TelegramNotDetected');
          setAppReady(true);
        } else {
          setTimeout(checkTelegram, 500);
        }
      };

      checkTelegram();
    };

    initializeTelegram();
  }, [login, isAuthenticated, fetchInitialData, t, setLanguage]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    completeOnboarding();
  };

  if (authError && (authError === 'TelegramNotDetected' || authError === 'WebAppInitDataMissing')) {
    const isLegalPage = pathname === '/terms' || pathname === '/privacy';
    if (isLegalPage) {
      return <>{children}</>;
    }
    return <LandingPage />;
  }

  if (!appReady || isLoading || !isI18nReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 z-[100]">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">OhMyRevit</h2>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-600 p-4 z-[100]">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('common.oops')}</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition">
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showOnboarding ? (
        <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />
      ) : (
        <motion.div
          key="app-content"
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.1
          }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}