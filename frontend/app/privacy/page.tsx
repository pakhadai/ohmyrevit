'use client';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>

        <article className="prose dark:prose-invert max-w-none">
          <h1>{t('legal.privacy.title')}</h1>
          <p className="text-muted-foreground">{t('legal.updated', { date: new Date().toLocaleDateString() })}</p>

          <h2>{t('legal.privacy.collection.title')}</h2>
          <p>{t('legal.privacy.collection.text')}</p>

          <h2>{t('legal.privacy.usage.title')}</h2>
          <p>{t('legal.privacy.usage.text')}</p>

          <h2>{t('legal.privacy.storage.title')}</h2>
          <p>{t('legal.privacy.storage.text')}</p>
        </article>
      </div>
    </div>
  );
}