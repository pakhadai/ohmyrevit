'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

interface EmailLinkModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmailLinkModal({ onClose, onSuccess }: EmailLinkModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { refreshUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(t('auth.enterEmail'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('auth.invalidEmail'));
      return;
    }

    setIsSubmitting(true);
    try {
      await profileAPI.updateProfile({ email });
      await refreshUser();
      setIsSuccess(true);
      toast.success(t('auth.emailLinked'));
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      const message = error.response?.data?.detail || t('auth.emailLinkError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius['2xl'],
            boxShadow: theme.shadows.xl,
          }}
        >
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: theme.colors.border }}>
            <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>
              {t('auth.linkEmail')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 transition-colors"
              style={{
                color: theme.colors.textMuted,
                borderRadius: theme.radius.md,
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5">
            {isSuccess ? (
              <div className="text-center py-6">
                <div
                  className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                  style={{
                    backgroundColor: theme.colors.successLight,
                    borderRadius: theme.radius.full,
                  }}
                >
                  <CheckCircle2 size={32} style={{ color: theme.colors.success }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>
                  {t('auth.emailLinkedSuccess')}
                </h3>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {t('auth.canContinue')}
                </p>
              </div>
            ) : (
              <>
                <div
                  className="w-14 h-14 mx-auto mb-4 flex items-center justify-center"
                  style={{
                    backgroundColor: theme.colors.primaryLight,
                    borderRadius: theme.radius.full,
                  }}
                >
                  <Mail size={24} style={{ color: theme.colors.primary }} />
                </div>

                <p className="text-sm text-center mb-6" style={{ color: theme.colors.textSecondary }}>
                  {t('auth.emailRequiredForPurchase')}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.lg,
                    }}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: '#FFF',
                      borderRadius: theme.radius.xl,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        <span>{t('common.saving')}</span>
                      </>
                    ) : (
                      <span>{t('auth.linkEmail')}</span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}