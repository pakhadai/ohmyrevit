'use client';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function PrivacyPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen py-12 px-6" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-xl transition-all active:scale-95"
          style={{
            color: theme.colors.primary,
            backgroundColor: theme.colors.surface
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
        >
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>

        <article
          className="p-8 rounded-3xl"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.sm
          }}
        >
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>{t('legal.privacy.title')}</h1>
          <p className="mb-8" style={{ color: theme.colors.textMuted }}>{t('legal.updated', { date: new Date().toLocaleDateString() })}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: theme.colors.text }}>{t('legal.privacy.collection.title')}</h2>
          <p style={{ color: theme.colors.textSecondary }}>{t('legal.privacy.collection.text')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: theme.colors.text }}>{t('legal.privacy.usage.title')}</h2>
          <p style={{ color: theme.colors.textSecondary }}>{t('legal.privacy.usage.text')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: theme.colors.text }}>{t('legal.privacy.storage.title')}</h2>
          <p style={{ color: theme.colors.textSecondary }}>{t('legal.privacy.storage.text')}</p>
        </article>
      </div>
    </div>
  );
}