'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, ArrowRight, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface EmailLinkModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmailLinkModal({ onClose, onSuccess }: EmailLinkModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.post('/auth/link-email', { email });
      setSent(true);
      toast.success(t('auth.emailLinkSent', 'Лист підтвердження відправлено!'));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('auth.emailLinkError', 'Помилка відправки'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {sent ? t('auth.checkEmail', 'Перевірте пошту') : t('auth.linkEmailTitle', 'Потрібен Email')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-500">
                <Mail size={32} />
            </div>
            <p className="text-sm text-muted-foreground">
              Ми відправили посилання на <b>{email}</b>.
              Перейдіть за ним, щоб підтвердити пошту, отримати пароль та завершити покупку.
            </p>
            <button
                onClick={onClose}
                className="btn-primary w-full py-2.5 mt-4"
            >
                Зрозуміло
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Для оформлення покупки та доступу до товарів через сайт нам потрібна ваша пошта. Ми також надішлемо вам пароль.
            </p>

            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary/50 outline-none transition-all"
                    required
                    autoFocus
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
                {loading ? <Loader className="animate-spin" size={18} /> : (
                    <>
                        <span>Надіслати</span>
                        <ArrowRight size={18} />
                    </>
                )}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}