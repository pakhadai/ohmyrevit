'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface EmailRequiredModalProps {
  onClose: () => void;
}

export default function EmailRequiredModal({ onClose }: EmailRequiredModalProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const router = useRouter();

  const hasEmail = !!user?.email;
  const isVerified = user?.isEmailVerified;

  const handleAddEmail = () => {
    onClose();
    router.push('/profile/settings');
  };

  const handleGoToSettings = () => {
    onClose();
    router.push('/profile/settings');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl transition-colors"
            style={{ backgroundColor: theme.colors.surface }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
          >
            <X size={20} style={{ color: theme.colors.textMuted }} />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: `${theme.colors.warning}20`,
              }}
            >
              <AlertCircle size={32} style={{ color: theme.colors.warning }} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
              {t('emailRequired.title', 'Потрібна електронна пошта')}
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
              {!hasEmail
                ? t('emailRequired.noEmail', 'Для оплати ОБОВ\'ЯЗКОВО потрібно вказати email адресу.')
                : !isVerified
                ? t('emailRequired.notVerified', 'Для оплати ОБОВ\'ЯЗКОВО потрібно підтвердити email адресу.')
                : t('emailRequired.generic', 'Потрібна підтверджена email адреса')}
            </p>

            {/* Info Box */}
            <div
              className="p-4 rounded-xl text-left mb-6"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div className="flex items-start gap-3">
                <Mail size={20} className="flex-shrink-0 mt-0.5" style={{ color: theme.colors.primary }} />
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  <p className="font-medium mb-1" style={{ color: theme.colors.text }}>
                    {t('emailRequired.whyTitle', 'Чому потрібен email?')}
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: theme.colors.success }} />
                      <span>{t('emailRequired.reason1', 'Отримання чеків та підтверджень оплати')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: theme.colors.success }} />
                      <span>{t('emailRequired.reason2', 'Доступ до завантажень та ліцензій')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: theme.colors.success }} />
                      <span>{t('emailRequired.reason3', 'Важливі повідомлення про замовлення')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {!hasEmail ? (
              <button
                onClick={handleAddEmail}
                className="w-full py-3.5 rounded-2xl font-bold transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
                  color: '#FFFFFF',
                  boxShadow: theme.shadows.md,
                }}
              >
                {t('emailRequired.addEmail', 'Додати email')}
              </button>
            ) : !isVerified ? (
              <button
                onClick={handleGoToSettings}
                className="w-full py-3.5 rounded-2xl font-bold transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
                  color: '#FFFFFF',
                  boxShadow: theme.shadows.md,
                }}
              >
                {t('emailRequired.verifyEmail', 'Підтвердити email')}
              </button>
            ) : null}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-medium transition-colors"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textSecondary,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
            >
              {t('common.cancel', 'Скасувати')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
