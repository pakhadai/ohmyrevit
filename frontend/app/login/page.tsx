'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader, LogIn, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { isAuthenticated, setToken, setUser } = useAuthStore();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTelegram, setLoadingTelegram] = useState(false);
  const [isTelegramAvailable, setIsTelegramAvailable] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
      return;
    }

    const initAuth = async () => {
      const WebApp = (window as any).Telegram?.WebApp;

      // Check if Telegram is available
      if (WebApp?.initData) {
        setIsTelegramAvailable(true);
      }

      // Auto-login if we have user data
      if (WebApp?.initDataUnsafe?.user && WebApp?.initData) {
        setLoadingTelegram(true);
        try {
          const data = await authAPI.loginTelegram({ initData: WebApp.initData });
          if (data.access_token && data.user) {
            setToken(data.access_token);
            setUser({
              id: data.user.id,
              telegramId: data.user.telegram_id,
              username: data.user.username,
              firstName: data.user.first_name,
              lastName: data.user.last_name,
              email: data.user.email,
              photoUrl: data.user.photo_url,
              languageCode: data.user.language_code || 'uk',
              isAdmin: data.user.is_admin,
              balance: data.user.balance || 0,
              bonusStreak: data.user.bonus_streak || 0,
              referralCode: data.user.referral_code,
              isEmailVerified: data.user.is_email_verified,
            });
            router.replace('/');
          }
        } catch (error) {
          console.error('Auto-login failed:', error);
        } finally {
          setLoadingTelegram(false);
        }
      }
    };

    const timer = setTimeout(initAuth, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, setToken, setUser, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authAPI.loginEmail(email, password);
      if (data.access_token && data.user) {
        setToken(data.access_token);
        setUser({
          id: data.user.id,
          telegramId: data.user.telegram_id,
          username: data.user.username,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          email: data.user.email,
          photoUrl: data.user.photo_url,
          languageCode: data.user.language_code || 'uk',
          isAdmin: data.user.is_admin,
          balance: data.user.balance || 0,
          bonusStreak: data.user.bonus_streak || 0,
          referralCode: data.user.referral_code,
          isEmailVerified: data.user.is_email_verified,
        });
        toast.success('Вхід успішний');
        router.push('/');
      } else {
        toast.error('Помилка даних сервера');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Невірний логін або пароль';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    const WebApp = (window as any).Telegram?.WebApp;
    if (!WebApp?.initData) {
      toast.error('Telegram Web App недоступний');
      return;
    }

    setLoadingTelegram(true);
    try {
      const data = await authAPI.loginTelegram({ initData: WebApp.initData });
      if (data.access_token && data.user) {
        setToken(data.access_token);
        setUser({
          id: data.user.id,
          telegramId: data.user.telegram_id,
          username: data.user.username,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          email: data.user.email,
          photoUrl: data.user.photo_url,
          languageCode: data.user.language_code || 'uk',
          isAdmin: data.user.is_admin,
          balance: data.user.balance || 0,
          bonusStreak: data.user.bonus_streak || 0,
          referralCode: data.user.referral_code,
          isEmailVerified: data.user.is_email_verified,
        });
        router.replace('/');
      }
    } catch (error) {
      console.error('Telegram login failed:', error);
      toast.error('Помилка входу через Telegram');
    } finally {
      setLoadingTelegram(false);
    }
  };

  if (loading || loadingTelegram) {
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
          className="p-8"
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
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
              borderRadius: theme.radius.full,
            }}
          >
            <LogIn size={36} color="#FFF" />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.colors.text }}>
            {t('auth.welcome')}
          </h1>
          <p className="text-sm mb-8 text-center" style={{ color: theme.colors.textSecondary }}>
            {t('auth.loginSubtitle')}
          </p>

          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
            <div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.lg,
                  }}
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textMuted }} />
              </div>
            </div>

            <div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.lg,
                  }}
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textMuted }} />
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#FFF',
                borderRadius: theme.radius.xl,
              }}
            >
              {loading && <Loader className="animate-spin w-5 h-5" />}
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
          </form>

          {isTelegramAvailable && (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: `1px solid ${theme.colors.border}` }}></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2" style={{ backgroundColor: theme.colors.card, color: theme.colors.textMuted }}>
                    або
                  </span>
                </div>
              </div>

              <button
                onClick={handleTelegramLogin}
                disabled={loadingTelegram}
                className="w-full py-3.5 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                style={{
                  backgroundColor: '#0088cc',
                  color: '#FFF',
                  borderRadius: theme.radius.xl,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                {t('auth.continueWithTelegram')}
              </button>
            </>
          )}

          <div className="mt-6 pt-6 text-center" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              Немає акаунту?{' '}
              <Link href="/register" className="font-semibold" style={{ color: theme.colors.primary }}>
                Зареєструватися
              </Link>
            </p>
          </div>

          <p className="text-xs mt-6 text-center" style={{ color: theme.colors.textMuted }}>
            {t('auth.termsNotice')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
