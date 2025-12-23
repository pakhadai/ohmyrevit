'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';

export default function RegisterPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { isAuthenticated, isLoading, loginWithTelegram } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
      return;
    }

    const initAuth = async () => {
      const WebApp = (window as any).Telegram?.WebApp;
      if (WebApp?.initDataUnsafe?.user) {
        try {
          await loginWithTelegram(WebApp.initData);
          router.replace('/');
        } catch (error) {
          console.error('Auto-register failed:', error);
        }
      }
    };

    const timer = setTimeout(initAuth, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, loginWithTelegram, router]);

  const handleTelegramRegister = async () => {
    const WebApp = (window as any).Telegram?.WebApp;
    if (WebApp?.initData) {
      try {
        await loginWithTelegram(WebApp.initData);
        router.replace('/');
      } catch (error) {
        console.error('Registration failed:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: theme.colors.bgGradient }}
      >
        <Loader className="w-10 h-10 animate-spin" style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: theme.colors.bgGradient }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div
          className="p-8 text-center"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius['2xl'],
            boxShadow: theme.shadows.lg,
          }}
        >
          <div
            className="w-20 h-20 mx-auto mb-6 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.primary})`,
              borderRadius: theme.radius.full,
            }}
          >
            <UserPlus size={36} color="#FFF" />
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
            {t('auth.createAccount')}
          </h1>
          <p className="text-sm mb-8" style={{ color: theme.colors.textSecondary }}>
            {t('auth.registerSubtitle')}
          </p>

          <button
            onClick={handleTelegramRegister}
            className="w-full py-3.5 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              backgroundColor: '#0088cc',
              color: '#FFF',
              borderRadius: theme.radius.xl,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {t('auth.registerWithTelegram')}
          </button>

          <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              {t('auth.haveAccount')}{' '}
              <button
                onClick={() => router.push('/login')}
                className="font-semibold"
                style={{ color: theme.colors.primary }}
              >
                {t('auth.signIn')}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}