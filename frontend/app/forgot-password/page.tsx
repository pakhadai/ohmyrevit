'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Send, CheckCircle2, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(t('auth.enterEmail'));
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.forgotPassword(email);
      setIsSuccess(true);
      toast.success(t('auth.resetLinkSent'));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('auth.resetError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: theme.colors.bgGradient }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
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
                backgroundColor: theme.colors.successLight,
                borderRadius: theme.radius.full,
              }}
            >
              <CheckCircle2 size={40} style={{ color: theme.colors.success }} />
            </div>

            <h1 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
              {t('auth.checkEmail')}
            </h1>
            <p className="text-sm mb-6" style={{ color: theme.colors.textSecondary }}>
              Ми надіслали новий пароль на {email}
            </p>

            <button
              onClick={() => router.push('/login')}
              className="w-full py-3.5 font-semibold transition-all active:scale-95"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#FFF',
                borderRadius: theme.radius.xl,
              }}
            >
              {t('auth.backToLogin')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col px-6 pt-12"
      style={{ background: theme.colors.bgGradient }}
    >
      <button
        onClick={() => router.back()}
        className="p-2.5 self-start mb-8 transition-colors"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.textMuted,
          borderRadius: theme.radius.lg,
        }}
      >
        <ArrowLeft size={20} />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-auto"
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
            className="w-16 h-16 mx-auto mb-6 flex items-center justify-center"
            style={{
              backgroundColor: theme.colors.primaryLight,
              borderRadius: theme.radius.full,
            }}
          >
            <Mail size={28} style={{ color: theme.colors.primary }} />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2" style={{ color: theme.colors.text }}>
            {t('auth.forgotPassword')}
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: theme.colors.textSecondary }}>
            {t('auth.forgotPasswordSubtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textSecondary }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.lg,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#FFF',
                borderRadius: theme.radius.xl,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>{t('common.sending')}</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>{t('auth.sendResetLink')}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
            <button
              onClick={() => router.push('/login')}
              className="text-sm font-medium"
              style={{ color: theme.colors.primary }}
            >
              {t('auth.backToLogin')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
