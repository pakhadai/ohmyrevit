'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Onboarding from './Onboarding';
// ВИПРАВЛЕНО: Імпортуємо useSDK замість useWebApp
import { useSDK } from '@telegram-apps/sdk-react';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, login, isLoading, isAuthenticated } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ВИПРАВЛЕНО: Використовуємо більш надійний хук useSDK
  const { webApp, initData } = useSDK();

  useEffect(() => {
    // Тепер ми отримуємо webApp та initData безпечно з хука useSDK
    // і використовуємо їх, коли вони стануть доступними.
    if (webApp && initData && !isAuthenticated && !isLoading) {
      // Конвертуємо initData в рядок для відправки на бекенд
      const initDataString = new URLSearchParams(initData as any).toString();
      login(initDataString);
    }
  }, [webApp, initData, isAuthenticated, isLoading, login]);

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