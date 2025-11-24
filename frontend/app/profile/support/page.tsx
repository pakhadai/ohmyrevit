'use client';

import { useState } from 'react';
import { MessageCircle, Mail, Copy, Check, Clock, ExternalLink, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const supportEmail = "support@ohmyrevit.com";
  const telegramSupportUsername = "OhMyRevitSupport";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    toast.success(t('profilePages.support.toasts.emailCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const openTelegramSupport = () => {
    const url = `https://t.me/${telegramSupportUsername}`;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 space-y-6">

      <h1 className="text-2xl font-bold text-foreground">{t('profilePages.support.pageTitle')}</h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[24px] p-6 text-white shadow-lg shadow-blue-500/20"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -mr-6 -mt-6 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 text-white">
            <HelpCircle size={24} />
          </div>

          <h2 className="text-xl font-bold mb-2">{t('profilePages.support.needHelp')}</h2>
          <p className="opacity-90 mb-6 text-sm leading-relaxed max-w-sm">
            {t('profilePages.support.description')}
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            <Clock size={14} />
            <span>{t('profilePages.support.workingHours')}</span>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={openTelegramSupport}
          className="card-minimal w-full p-5 flex items-center gap-4 group hover:border-primary/30 transition-all"
        >
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <MessageCircle size={24} />
          </div>
          <div className="text-left flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-base">{t('profilePages.support.telegramChat')}</h3>
              <ExternalLink size={14} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t('profilePages.support.telegramDesc')}</p>
          </div>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-minimal p-5"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-2xl flex items-center justify-center">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">{t('profilePages.support.email')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('profilePages.support.emailDesc')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-transparent group hover:border-border transition-colors">
            <span className="flex-1 font-mono text-sm text-foreground truncate select-all px-1">{supportEmail}</span>
            <button
              onClick={handleCopyEmail}
              className="p-2 bg-background hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground active:scale-90 shadow-sm"
              title={t('common.copy')}
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}