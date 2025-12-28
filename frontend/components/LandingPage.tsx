'use client';

import { motion } from 'framer-motion';
import { Send, CheckCircle2, Box } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t } = useTranslation();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'OhMyRevitBot';
  const botLink = `https://t.me/${botUsername}`;

  return (
    <div className="min-h-screen bg-white dark:bg-[#1A1A23] text-zinc-900 dark:text-white flex flex-col font-sans">

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Box size={20} />
          </div>
          <span>OhMyRevit</span>
        </div>
        <a
          href={botLink}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
        >
          <Send size={18} /> {t('landing.openApp')}
        </a>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            OhMyRevit <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {t('landing.title')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landing.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={botLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 transition-all transform hover:scale-105"
            >
              <Send size={20} />
              {t('landing.openInTg')}
            </a>
            <Link
              href="/terms"
              className="w-full sm:w-auto px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-center"
            >
              {t('landing.learnMore')}
            </Link>
          </div>
        </motion.div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl w-full text-left">
          {[
            { title: t('landing.features.library.title'), desc: t('landing.features.library.desc') },
            { title: t('landing.features.bonuses.title'), desc: t('landing.features.bonuses.desc') },
            { title: t('landing.features.payments.title'), desc: t('landing.features.payments.desc') }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 py-10 px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} OhMyRevit. {t('landing.rights')}
          </p>
          <div className="flex gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <Link href="/terms" className="hover:text-blue-600 transition-colors">{t('landing.footer.terms')}</Link>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">{t('landing.footer.privacy')}</Link>
            <a href="mailto:support@ohmyrevit.pp.ua" className="hover:text-blue-600 transition-colors">{t('landing.footer.contact')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}