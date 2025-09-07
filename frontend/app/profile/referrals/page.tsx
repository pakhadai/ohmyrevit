// ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
// frontend/app/profile/referrals/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api';
import { ArrowLeft, Users, Gift, ShoppingCart, Copy, Share2, Loader, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next'; // ДОДАНО

interface ReferralLog {
  referred_user_name: string;
  bonus_type: 'registration' | 'purchase';
  bonus_amount: number;
  purchase_amount?: number;
  created_at: string;
}

interface ReferralInfo {
  referral_code: string;
  total_referrals: number;
  total_bonuses_earned: number;
  logs: ReferralLog[];
}

export default function ReferralsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [botUsername, setBotUsername] = useState('');
  const { t } = useTranslation(); // ДОДАНО

  useEffect(() => {
    setBotUsername(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'OhMyRevitBot');
    const fetchReferralInfo = async () => {
      try {
        const data = await profileAPI.getReferralInfo();
        setInfo(data);
      } catch (error) {
        // OLD: toast.error("Не вдалося завантажити реферальну інформацію.");
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
      return `https://t.me/${botUsername}/app?startapp=${info.referral_code}`;
    }
    return '';
  }, [botUsername, info]);


  const copyToClipboard = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
        // OLD: toast.success('Посилання скопійовано!');
        toast.success(t('toasts.linkCopied'));
    }).catch(() => {
        // OLD: toast.error('Не вдалося скопіювати посилання.');
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
      // OLD: toast.error("Ця функція доступна тільки в додатку Telegram.");
      toast.error(t('toasts.telegramOnlyFeature'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin h-10 w-10 text-purple-500" />
      </div>
    );
  }

  if (!user || !info) {
     return (
        <div className="container mx-auto px-4 py-6 text-center">
            {/* OLD: <h2 className="text-xl font-semibold mt-10">Не вдалося завантажити дані</h2> */}
            <h2 className="text-xl font-semibold mt-10">{t('profilePages.referrals.loadError.title')}</h2>
            {/* OLD: <p className="text-gray-500 mt-2">Будь ласка, спробуйте оновити сторінку.</p> */}
            <p className="text-gray-500 mt-2">{t('profilePages.referrals.loadError.subtitle')}</p>
             <button onClick={() => router.push('/profile')} className="mt-4 px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                {/* OLD: Повернутися до профілю */}
                {t('profilePages.referrals.loadError.back')}
            </button>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/profile')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        {/* OLD: <h1 className="text-2xl font-bold">Реферальна програма</h1> */}
        <h1 className="text-2xl font-bold">{t('profilePages.referrals.pageTitle')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
            {/* OLD: <h2 className="text-lg font-semibold mb-3">Ваше посилання для запрошень</h2> */}
            <h2 className="text-lg font-semibold mb-3">{t('profilePages.referrals.yourLink')}</h2>
            {/* OLD: <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Діліться цим посиланням. Ви отримаєте <b>30 бонусів</b> за кожного, хто зареєструється, та <b>5%</b> від суми їхніх покупок.</p> */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4" dangerouslySetInnerHTML={{ __html: t('profilePages.referrals.description') }} />
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" readOnly value={loading ? t('common.loading') : referralLink} disabled={loading || !referralLink} className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 text-sm disabled:opacity-70" />
              <button onClick={copyToClipboard} disabled={!referralLink} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Copy size={16} /> <span className="sm:hidden lg:inline">{t('common.copy')}</span>
              </button>
              <button onClick={shareViaTelegram} disabled={!referralLink} className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Share2 size={16} /> {t('common.share')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
            {/* OLD: <h2 className="text-lg font-semibold mb-4">Історія нарахувань</h2> */}
            <h2 className="text-lg font-semibold mb-4">{t('profilePages.referrals.history')}</h2>
            {info.logs.length > 0 ? (
              <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {info.logs.map((log, index) => (
                  <motion.li key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-full flex-shrink-0 ${log.bonus_type === 'registration' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-purple-100 dark:bg-purple-900/50'}`}>
                        {log.bonus_type === 'registration' ? <UserPlus size={20} className="text-green-500" /> : <ShoppingCart size={20} className="text-purple-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {/* OLD: {log.bonus_type === 'registration' ? `Новий користувач: ${log.referred_user_name}` : `Покупка від ${log.referred_user_name}`} */}
                          {log.bonus_type === 'registration' ? t('profilePages.referrals.log.newUser', { name: log.referred_user_name}) : t('profilePages.referrals.log.purchase', { name: log.referred_user_name})}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-bold text-green-500">+ {log.bonus_amount} 💎</p>
                      {log.purchase_amount && <p className="text-xs text-gray-500">з ${log.purchase_amount.toFixed(2)}</p>}
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 py-6">
                {/* OLD: <p>Як тільки хтось зареєструється за вашим посиланням, це з'явиться тут.</p> */}
                <p>{t('profilePages.referrals.emptyHistory')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm text-center">
                <Users className="mx-auto text-blue-500" size={32}/>
                <p className="text-4xl font-bold mt-2">{info.total_referrals}</p>
                {/* OLD: <p className="text-gray-500 dark:text-gray-400 mt-1">Запрошено</p> */}
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('profilePages.referrals.invited')}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm text-center">
                <Gift className="mx-auto text-yellow-500" size={32}/>
                <p className="text-4xl font-bold mt-2">{info.total_bonuses_earned} 💎</p>
                {/* OLD: <p className="text-gray-500 dark:text-gray-400 mt-1">Зароблено бонусів</p> */}
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('profilePages.referrals.bonusesEarned')}</p>
            </div>
        </div>
      </div>
    </div>
  );
}