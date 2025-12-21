'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCollectionStore } from '@/store/collectionStore';
import { useLanguageStore } from '@/store/languageStore';
import { useUIStore } from '@/store/uiStore';
import Onboarding from './Onboarding';
import i18n from '@/lib/i18n';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

// ПУБЛІЧНІ МАРШРУТИ (ТОЧНИЙ ЗБІГ)
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/terms',
    '/privacy',
    '/auth/verify',
    '/marketplace',
];

// ПУБЛІЧНІ ПРЕФІКСИ (НАПРИКЛАД ДЛЯ ТОВАРІВ)
const PUBLIC_PREFIXES = [
    '/product',
];

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { login, isAuthenticated, completeOnboarding } = useAuthStore();
  const { fetchInitialData } = useCollectionStore();
  const { setLanguage } = useLanguageStore();
  const { setTheme } = useUIStore();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [isI18nReady, setIsI18nReady] = useState(false);

  const authAttempted = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  // 1. Ініціалізація теми та i18n
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
    return () => { i18n.off('initialized', handleInitialized); };
  }, [setTheme]);

  // 2. Telegram BackButton
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const backButton = tg.BackButton;
      const handleBack = () => router.back();

      // Показуємо кнопку назад скрізь, крім головної та логіну
      if (pathname !== '/' && pathname !== '/login') {
        backButton.show();
        backButton.onClick(handleBack);
      } else {
        backButton.hide();
      }

      return () => backButton.offClick(handleBack);
    }
  }, [pathname, router]);

  const checkOnboardingStatus = () => {
    const { user, isNewUser } = useAuthStore.getState();
    if (user && isNewUser) {
      setShowOnboarding(true);
    }
  };

  // 3. Авторизація (Telegram)
  useEffect(() => {
    const initializeApp = async () => {
      if (isAuthenticated) {
        if (!authAttempted.current) {
           fetchInitialData();
           checkOnboardingStatus();
        }
        setAppReady(true);
        return;
      }

      // Спроба входу через Telegram
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        try {
           tg.expand();
           tg.enableClosingConfirmation();
           tg.setHeaderColor('#ffffff'); // або колір теми
           tg.setBackgroundColor('#ffffff');
        } catch (e) {}

        const rawInitData = tg.initData;
        let startParam = tg.initDataUnsafe?.start_param;

        // Fallback для вебу
        if (!startParam && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            startParam = urlParams.get('startapp') || null;
        }

        if (rawInitData && !authAttempted.current) {
          authAttempted.current = true;
          try {
            const loginResponse = await login({
                initData: rawInitData,
                start_param: startParam
            });

            await fetchInitialData();

            if (loginResponse && (loginResponse.is_new_user || loginResponse.isNewUser) && tg.initDataUnsafe?.user?.language_code) {
               setLanguage(tg.initDataUnsafe.user.language_code as any);
            }

            checkOnboardingStatus();
          } catch (error) {
            console.error('TG Auth failed, staying as guest:', error);
          }
        }
      }
      setAppReady(true);
    };

    initializeApp();
  }, [login, isAuthenticated, fetchInitialData, setLanguage]);

  // 4. Захист маршрутів
  useEffect(() => {
    if (!appReady) return;

    // Перевіряємо чи маршрут публічний
    const isPublic = PUBLIC_ROUTES.includes(pathname) ||
                     PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

    // Якщо не авторизовані і маршрут приватний -> редірект
    if (!isAuthenticated && !isPublic) {
       console.log("Redirecting to login from:", pathname);
       router.push('/login');
    }
  }, [appReady, isAuthenticated, pathname, router]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    completeOnboarding();
  };

  if (!appReady || !isI18nReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[100]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}