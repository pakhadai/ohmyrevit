// frontend/components/AppProvider.tsx

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Onboarding from './Onboarding';
// ВИПРАВЛЕНО: Імпортуємо useSDK для більш надійного доступу
import { useSDK } from '@telegram-apps/sdk-react';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, login, isLoading, isAuthenticated } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ВИПРАВЛЕНО: Використовуємо useSDK, щоб безпечно отримати initData
  const { initData } = useSDK();

  useEffect(() => {
    // Передаємо об'єкт initData напряму, коли він доступний
    if (initData && !isAuthenticated && !isLoading) {
      login(initData);
    }
  }, [initData, isAuthenticated, isLoading, login]);

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