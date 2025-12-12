'use client';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>

        <article className="prose dark:prose-invert max-w-none">
          <h1>{t('legal.terms.title')}</h1>
          <p className="text-muted-foreground">{t('legal.updated', { date: new Date().toLocaleDateString() })}</p>

          <h2>{t('legal.terms.intro.title')}</h2>
          <p>{t('legal.terms.intro.text')}</p>

          <h2>{t('legal.terms.service.title')}</h2>
          <p>{t('legal.terms.service.text')}</p>

          <h2>{t('legal.terms.license.title')}</h2>
          <p>{t('legal.terms.license.text')}</p>

          <h2>{t('legal.terms.payments.title')}</h2>
          <p>{t('legal.terms.payments.text')}</p>
        </article>
      </div>
    </div>
  );
}