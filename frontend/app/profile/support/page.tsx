'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MessageCircle, Mail, Send, Loader, CheckCircle2, ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

export default function SupportPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error(t('support.fillAll'));
      return;
    }

    setIsSending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSent(true);
      toast.success(t('support.sent'));
    } catch (error) {
      toast.error(t('support.sendError'));
    } finally {
      setIsSending(false);
    }
  };

  const openTelegram = () => {
    const WebApp = (window as any).Telegram?.WebApp;
    if (WebApp?.openTelegramLink) {
      WebApp.openTelegramLink('https://t.me/your_support_bot');
    } else {
      window.open('https://t.me/your_support_bot', '_blank');
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen pb-28" style={{ background: theme.colors.bgGradient }}>
        <div className="max-w-2xl mx-auto px-5 pt-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2.5 transition-colors"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMuted,
                borderRadius: theme.radius.lg,
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold" style={{ color: theme.colors.text }}>
              {t('support.title')}
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius['2xl'],
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
            <h2 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
              {t('support.thankYou')}
            </h2>
            <p className="text-sm mb-8 px-6" style={{ color: theme.colors.textSecondary }}>
              {t('support.willReply')}
            </p>
            <button
              onClick={() => {
                setIsSent(false);
                setSubject('');
                setMessage('');
              }}
              className="px-6 py-2.5 font-medium"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#FFF',
                borderRadius: theme.radius.xl,
              }}
            >
              {t('support.sendAnother')}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-2xl mx-auto px-5 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2.5 transition-colors"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMuted,
              borderRadius: theme.radius.lg,
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: theme.colors.text }}>
            {t('support.title')}
          </h1>
        </div>

        <button
          onClick={openTelegram}
          className="w-full p-5 mb-6 flex items-center justify-between transition-all active:scale-[0.99]"
          style={{
            background: `linear-gradient(135deg, #0088cc, #00a2e8)`,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.md,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: theme.radius.lg }}
            >
              <MessageCircle size={24} color="#FFF" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white">{t('support.telegramSupport')}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {t('support.fastResponse')}
              </p>
            </div>
          </div>
          <ExternalLink size={20} color="#FFF" />
        </button>

        <div
          className="p-6"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius['2xl'],
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Mail size={20} style={{ color: theme.colors.primary }} />
            <h2 className="font-semibold" style={{ color: theme.colors.text }}>
              {t('support.emailForm')}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textSecondary }}>
                {t('support.subject')}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('support.subjectPlaceholder')}
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.lg,
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textSecondary }}>
                {t('support.message')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('support.messagePlaceholder')}
                rows={5}
                className="w-full px-4 py-3 text-sm outline-none transition-all resize-none"
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
              disabled={isSending}
              className="w-full py-3.5 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#FFF',
                borderRadius: theme.radius.xl,
              }}
            >
              {isSending ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>{t('common.sending')}</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>{t('support.send')}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}