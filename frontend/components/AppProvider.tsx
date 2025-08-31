'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Onboarding from './Onboarding';
import { useWebApp } from '@telegram-apps/sdk-react';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, login, isLoading, isAuthenticated } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ВИПРАВЛЕНО: Хук useWebApp тепер буде працювати коректно,
  // оскільки він викликається всередині клієнтського TelegramProvider.
  const webApp = useWebApp();

  useEffect(() => {
    if (webApp && webApp.initData && !isAuthenticated && !isLoading) {
      login(webApp.initData);
    }
  }, [webApp, isAuthenticated, isLoading, login]);

  useEffect(() => {
    const isOnboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (user && !isOnboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  // Показуємо завантажувач, поки йде автентифікація
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
            <p className="font-semibold">Автентифікація...</p>
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

