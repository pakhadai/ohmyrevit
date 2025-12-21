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
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        enableClosingConfirmation: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        openTelegramLink: (url: string) => void;
      };
    };
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
  const [authError, setAuthError] = useState<string | null>(null);

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

  // 3. Авторизація (Telegram + Web)
  useEffect(() => {
    const initializeApp = async () => {
      console.log('[AppProvider] Starting initialization...');
      console.log('[AppProvider] isAuthenticated:', isAuthenticated);

      // Якщо вже авторизовані (з localStorage)
      if (isAuthenticated) {
        console.log('[AppProvider] Already authenticated from storage');
        if (!authAttempted.current) {
           fetchInitialData();
           checkOnboardingStatus();
        }
        setAppReady(true);
        return;
      }

      // Перевіряємо чи ми в Telegram Mini App
      const isTelegramMiniApp = typeof window !== 'undefined' &&
                                window.Telegram?.WebApp?.initData &&
                                window.Telegram.WebApp.initData.length > 0;

      console.log('[AppProvider] Is Telegram Mini App:', isTelegramMiniApp);

      if (isTelegramMiniApp) {
        const tg = window.Telegram!.WebApp!;

        // Ініціалізуємо Telegram WebApp
        try {
          tg.ready();
          tg.expand();
          tg.enableClosingConfirmation();
          tg.setHeaderColor('#ffffff');
          tg.setBackgroundColor('#ffffff');
        } catch (e) {
          console.warn('[AppProvider] Telegram WebApp init warning:', e);
        }

        const rawInitData = tg.initData;
        console.log('[AppProvider] initData length:', rawInitData?.length);
        console.log('[AppProvider] initDataUnsafe:', tg.initDataUnsafe);

        // Отримуємо start_param
        let startParam = tg.initDataUnsafe?.start_param || null;

        // Fallback для URL параметрів
        if (!startParam && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            startParam = urlParams.get('startapp') || urlParams.get('start_param') || null;
        }

        console.log('[AppProvider] start_param:', startParam);

        if (rawInitData && !authAttempted.current) {
          authAttempted.current = true;

          try {
            console.log('[AppProvider] Attempting Telegram login...');

            // Формуємо дані для авторизації
            const authPayload = {
              initData: rawInitData,
              start_param: startParam,
              // Додаємо дані користувача як fallback
              id: tg.initDataUnsafe?.user?.id,
              first_name: tg.initDataUnsafe?.user?.first_name,
              last_name: tg.initDataUnsafe?.user?.last_name,
              username: tg.initDataUnsafe?.user?.username,
              language_code: tg.initDataUnsafe?.user?.language_code || 'uk',
              photo_url: tg.initDataUnsafe?.user?.photo_url,
            };

            console.log('[AppProvider] Auth payload:', {
              ...authPayload,
              initData: authPayload.initData?.substring(0, 50) + '...'
            });

            const loginResponse = await login(authPayload);
            console.log('[AppProvider] Login successful:', loginResponse);

            await fetchInitialData();

            // Встановлюємо мову з Telegram
            if (loginResponse && (loginResponse.is_new_user || loginResponse.isNewUser)) {
              const tgLang = tg.initDataUnsafe?.user?.language_code;
              if (tgLang && ['uk', 'en', 'ru', 'de', 'es'].includes(tgLang)) {
                setLanguage(tgLang as any);
              }
            }

            checkOnboardingStatus();
            setAuthError(null);

          } catch (error: any) {
            console.error('[AppProvider] TG Auth failed:', error);
            console.error('[AppProvider] Error details:', error.response?.data);

            setAuthError(error.response?.data?.detail || error.message || 'Authentication failed');

            // Не редіректимо одразу, даємо можливість побачити помилку
            // Можна показати повідомлення користувачу
          }
        }
      } else {
        console.log('[AppProvider] Not in Telegram Mini App, web mode');
        // Для веб-версії - просто завантажуємо додаток
        // Авторизація буде через форму входу
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

    console.log('[AppProvider] Route check:', { pathname, isPublic, isAuthenticated });

    // Якщо не авторизовані і маршрут приватний -> редірект
    if (!isAuthenticated && !isPublic) {
       console.log('[AppProvider] Redirecting to login from:', pathname);
       router.push('/login');
    }
  }, [appReady, isAuthenticated, pathname, router]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    completeOnboarding();
  };

  // Показуємо лоадер поки ініціалізуємось
  if (!appReady || !isI18nReady) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[100] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        {authError && (
          <div className="text-center px-4">
            <p className="text-red-500 text-sm">{authError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-primary underline text-sm"
            >
              Спробувати знову
            </button>
          </div>
        )}
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