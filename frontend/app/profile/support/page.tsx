// frontend/app/profile/support/page.tsx
'use client';

import { useState } from 'react';
import { MessageCircle, Mail, Copy, Check, Clock, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Замініть ці дані на ваші реальні контакти
  const supportEmail = "support@ohmyrevit.com";
  const telegramSupportUsername = "OhMyRevitSupport";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    toast.success("Email скопійовано!");
    setTimeout(() => setCopied(false), 2000);
  };

  const openTelegramSupport = () => {
    // Відкриваємо посилання на чат підтримки
    const url = `https://t.me/${telegramSupportUsername}`;
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(url);
    } else {
        window.open(url, '_blank');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Заголовок та кнопка "Назад" видалені */}

      <div className="space-y-6">
        {/* Інформаційний блок */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative"
        >
            {/* Декоративний елемент */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

            <h2 className="text-xl font-bold mb-2 relative z-10">{t('profilePages.support.needHelp')}</h2>
            <p className="opacity-90 mb-4 text-sm relative z-10 leading-relaxed">
                Ми завжди раді допомогти вам з будь-якими питаннями щодо маркетплейсу, завантажень або оплати.
            </p>
            <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Clock size={14} />
                <span>Відповідаємо 10:00 - 20:00</span>
            </div>
        </motion.div>

        {/* Кнопки зв'язку */}
        <div className="grid gap-4">
            {/* Telegram */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openTelegramSupport}
                className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all group"
            >
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-xl mr-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <MessageCircle size={24} />
                </div>
                <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Telegram Chat</h3>
                        <ExternalLink size={14} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Найшвидший спосіб отримати відповідь</p>
                </div>
            </motion.button>

            {/* Email */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm"
            >
                <div className="flex items-center mb-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-500 rounded-xl mr-4">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Email</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Для ділових пропозицій та скарг</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-700 relative group">
                    <span className="flex-1 font-mono text-sm text-gray-600 dark:text-gray-300 truncate select-all">{supportEmail}</span>
                    <button
                        onClick={handleCopyEmail}
                        className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors text-gray-500 active:scale-90"
                        title="Копіювати"
                    >
                        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
}