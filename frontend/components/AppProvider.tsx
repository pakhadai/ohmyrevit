'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCollectionStore } from '@/store/collectionStore';
import { useLanguageStore } from '@/store/languageStore';
import { useUIStore } from '@/store/uiStore';
import Onboarding from './Onboarding';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

// Список публічних маршрутів, які доступні без авторизації
const PUBLIC_ROUTES = ['/login', '/register', '/terms', '/privacy', '/auth/verify'];

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { login, isLoading, isAuthenticated, completeOnboarding, token } = useAuthStore();
  const { fetchInitialData } = useCollectionStore();
  const { setLanguage } = useLanguageStore();
  const { setTheme } = useUIStore();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [isI18nReady, setIsI18nReady] = useState(false);

  const authAttempted = useRef(false);
  const { t } = useTranslation();

  const pathname = usePathname();
  const router = useRouter();

  // 1. Ініціалізація теми та мови
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

  // 2. Логіка Telegram BackButton
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const backButton = tg.BackButton;

      const handleBack = () => {
        router.back();
      };

      if (pathname !== '/' && pathname !== '/login') {
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

  // 3. Головна логіка ініціалізації та авторизації
  useEffect(() => {
    const initializeApp = async () => {
      // Якщо вже авторизовані або вже пробували - пропускаємо TG логіку
      if (isAuthenticated) {
        if (!authAttempted.current) {
           fetchInitialData();
           checkOnboardingStatus();
        }
        setAppReady(true);
        return;
      }

      // Спроба авторизації через Telegram
      if (window.Telegram?.WebApp?.initData) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        try {
            tg.enableClosingConfirmation();
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
        } catch (e) {}

        const initData = tg.initDataUnsafe;
        const rawInitData = tg.initData;

        let startParam = tg.initDataUnsafe?.start_param;
         if (!startParam) {
            // Fallback для start_param з URL (для вебу або прямого лінку)
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

            // Гібридна логіка: якщо сервер каже needs_registration
            if (loginResponse.needs_registration) {
                // Перенаправляємо на спеціальну сторінку або показуємо модалку
                // Тут для простоти перекинемо на реєстрацію, передавши initData (можна через store)
                toast('Будь ласка, зареєструйте Email для прив\'язки акаунту', { icon: 'ℹ️' });
                router.push('/login');
                setAppReady(true);
                return;
            }

            await fetchInitialData();

            if (loginResponse.is_new_user && initData.user?.language_code) {
               setLanguage(initData.user.language_code as any);
            }
            checkOnboardingStatus();
          } catch (error) {
            console.error('TG Auth failed', error);
            // Якщо TG авторизація не пройшла - не блокуємо, даємо увійти через Email
          }
        }
      }

      setAppReady(true);
    };

    initializeApp();
  }, [login, isAuthenticated, fetchInitialData, setLanguage]);

  // 4. Захист маршрутів (Middleware на клієнті)
  useEffect(() => {
    if (!appReady) return;

    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

    if (!isAuthenticated && !isPublicRoute) {
       // Якщо не залогінені і не на публічній сторінці -> редірект на логін
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