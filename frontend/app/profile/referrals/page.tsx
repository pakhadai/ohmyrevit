'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api';
import { Users, Gift, ShoppingCart, Copy, Share2, UserPlus, UserCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';

interface ReferralLog {
  referred_user_name: string;
  bonus_type: 'registration' | 'purchase';
  bonus_amount: number;
  purchase_amount?: number;
  created_at: string;
}

interface ReferrerInfo {
    first_name: string;
    last_name?: string;
    username?: string;
}

interface ReferralInfo {
  referral_code: string;
  total_referrals: number;
  total_bonuses_earned: number;
  logs: ReferralLog[];
  referrer?: ReferrerInfo;
}

export default function ReferralsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [botUsername, setBotUsername] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    setBotUsername(process.env.NEXT_PUBLIC_BOT_USERNAME || 'OhMyRevitBot');
    const fetchReferralInfo = async () => {
      try {
        const data = await profileAPI.getReferralInfo();
        setInfo(data);
      } catch (error) {
        toast.error(t('profilePages.referrals.toasts.loadError'));
      } finally {
        setLoading(false);
      }
    };
    if (user) {
        fetchReferralInfo();
    } else {
        setLoading(false);
    }
  }, [user, t]);

  const referralLink = useMemo(() => {
    if (botUsername && info?.referral_code) {
      return `https://t.me/${botUsername}?startapp=${info.referral_code}`;
    }
    return '';
  }, [botUsername, info]);


  const copyToClipboard = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
        toast.success(t('toasts.linkCopied'));
    }).catch(() => {
        toast.error(t('toasts.linkCopyError'));
    });
  };

  const shareViaTelegram = () => {
    if (!referralLink) return;

    if (window.Telegram?.WebApp) {
      const shareText = t('profilePages.referrals.shareText');
      const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      toast.error(t('toasts.telegramOnlyFeature'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: theme.colors.primary }} />
      </div>
    );
  }

  if (!user || !info) {
     return (
        <div className="container mx-auto px-5 pt-14 text-center min-h-screen flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold" style={{ color: theme.colors.text }}>{t('profilePages.referrals.loadError.title')}</h2>
            <p className="mt-2 mb-6" style={{ color: theme.colors.textMuted }}>{t('profilePages.referrals.loadError.subtitle')}</p>
             <button
               onClick={() => router.push('/profile')}
               className="px-6 py-3 font-semibold rounded-xl transition-colors"
               style={{
                 backgroundColor: theme.colors.primary,
                 color: '#FFF',
               }}
             >
                {t('profilePages.referrals.loadError.back')}
            </button>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-5 pt-14 pb-2 space-y-6">

      <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>{t('profilePages.referrals.pageTitle')}</h1>

      {/* БЛОК: Хто запросив */}
      {info.referrer && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl flex items-center gap-4"
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
              <div className="p-2.5 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.card, color: theme.colors.primary }}>
                  <UserCheck size={20} />
              </div>
              <div>
                  <p className="text-xs uppercase tracking-wider font-bold" style={{ color: theme.colors.textMuted }}>Вас запросив</p>
                  <p className="font-bold text-sm" style={{ color: theme.colors.text }}>
                      {info.referrer.first_name} {info.referrer.last_name || ''}
                      {info.referrer.username && <span className="font-normal ml-1" style={{ color: theme.colors.textMuted }}>(@{info.referrer.username})</span>}
                  </p>
              </div>
          </motion.div>
      )}

      {/* Головна картка (Invite) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] p-6 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.blue}, ${theme.colors.purple})`,
        }}
      >
         {/* Декор */}
         <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>

         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                <h2 className="text-lg font-bold">{t('profilePages.referrals.yourLink')}</h2>
            </div>

            <p className="text-white/80 text-sm mb-6 leading-relaxed max-w-sm" dangerouslySetInnerHTML={{ __html: t('profilePages.referrals.description') }} />

            <div className="bg-black/20 backdrop-blur-md p-1.5 rounded-xl flex items-center gap-2 border border-white/10">
               <div className="flex-1 px-3 overflow-hidden">
                  <p className="text-sm font-mono text-white/90 truncate">{referralLink}</p>
               </div>
               <button
                 onClick={copyToClipboard}
                 className="p-2.5 bg-white rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                 style={{ color: theme.colors.blue }}
               >
                 <Copy size={18} />
               </button>
            </div>

            <button
              onClick={shareViaTelegram}
              className="w-full mt-4 py-3 bg-white rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
              style={{ color: theme.colors.blue }}
            >
               <Share2 size={18} />
               {t('common.share')}
            </button>
         </div>
      </motion.div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 flex flex-col items-center text-center rounded-xl"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}>
                  <Users size={20} />
              </div>
              <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{info.total_referrals}</p>
              <p className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>{t('profilePages.referrals.invited')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 flex flex-col items-center text-center rounded-xl"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: theme.colors.accentLight, color: theme.colors.accent }}>
                  <Gift size={20} />
              </div>
              <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{info.total_bonuses_earned}</p>
              <p className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>{t('profilePages.referrals.bonusesEarned')}</p>
          </motion.div>
      </div>

      {/* Історія */}
      <div className="p-5 rounded-xl" style={{ backgroundColor: theme.colors.card, border: `1px solid ${theme.colors.border}` }}>
        <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <ShoppingCart size={18} style={{ color: theme.colors.textMuted }} />
            {t('profilePages.referrals.history')}
        </h2>

        {info.logs.length > 0 ? (
            <ul className="space-y-0">
            {info.logs.map((log, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className={`flex items-center justify-between py-3 ${index !== info.logs.length - 1 ? 'border-b' : ''}`}
                  style={{ borderColor: theme.colors.border }}
                >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-full flex-shrink-0`} style={{
                      backgroundColor: log.bonus_type === 'registration' ? theme.colors.successLight : theme.colors.primaryLight,
                      color: log.bonus_type === 'registration' ? theme.colors.success : theme.colors.primary
                    }}>
                    {log.bonus_type === 'registration' ? <UserPlus size={16} /> : <ShoppingCart size={16} />}
                    </div>
                    <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: theme.colors.text }}>
                        {log.bonus_type === 'registration'
                          ? t('profilePages.referrals.log.newUser', { name: log.referred_user_name})
                          : t('profilePages.referrals.log.purchase', { name: log.referred_user_name})}
                    </p>
                    <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-sm" style={{ color: theme.colors.success }}>+ {log.bonus_amount} 💎</p>
                    {log.purchase_amount && <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>з ${log.purchase_amount.toFixed(2)}</p>}
                </div>
                </motion.li>
            ))}
            </ul>
        ) : (
            <div className="text-center py-8" style={{ color: theme.colors.textMuted }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 opacity-50" style={{ backgroundColor: theme.colors.surface }}>
                    <Users size={24} />
                </div>
                <p className="text-sm">{t('profilePages.referrals.emptyHistory')}</p>
            </div>
        )}
      </div>

    </div>
  );
}
