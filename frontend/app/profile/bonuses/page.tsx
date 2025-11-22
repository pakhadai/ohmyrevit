// frontend/app/profile/bonuses/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Clock } from 'lucide-react';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function BonusesPage() {
  const [bonusInfo, setBonusInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchBonusInfo();
  }, []);

  const fetchBonusInfo = async () => {
    setLoading(true);
    try {
      const bonusData = await profileAPI.getBonusInfo();
      setBonusInfo(bonusData);
    } catch (error) {
      console.error('Error fetching bonus info:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimBonus = async () => {
    try {
      const result = await profileAPI.claimDailyBonus();
      if (result.success) {
        toast.success(result.message);
        fetchBonusInfo();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(t('profilePages.bonuses.toasts.claimError'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!bonusInfo) {
    return <div className="text-center py-12">{t('profilePages.bonuses.loadError')}</div>;
  }

  return (
    // Використовуємо стандартний відступ py-6
    <div className="container mx-auto px-4 py-6">

      {/* Заголовок видалено згідно з побажаннями */}

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-4">{t('bonus.dailyBonus')}</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{bonusInfo.streak} {t('profilePages.bonuses.days')}</p>
              <p className="opacity-90">{t('profilePages.bonuses.currentStreak')}</p>
            </div>
            <button
              onClick={claimBonus}
              disabled={!bonusInfo.can_claim_today}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                bonusInfo.can_claim_today
                  ? 'bg-white text-orange-500 hover:bg-gray-100 transform hover:scale-105'
                  : 'bg-white/30 text-white cursor-not-allowed'
              }`}
            >
              {bonusInfo.can_claim_today ? t('profilePages.bonuses.claimBonus') : t('profilePages.bonuses.alreadyClaimed')}
            </button>
          </div>
          {!bonusInfo.can_claim_today && bonusInfo.next_claim_time && (
            <p className="mt-4 flex items-center gap-2 text-sm">
              <Clock size={16} />
              {t('profilePages.bonuses.nextBonusTomorrow')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('profilePages.bonuses.currentBalance')}</p>
            <p className="text-3xl font-bold mt-1">{bonusInfo.balance} 💎</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('profilePages.bonuses.equivalentDiscount', { amount: (bonusInfo.balance / 100).toFixed(2) })}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
             <h3 className="font-semibold mb-2">{t('profilePages.bonuses.howItWorks')}</h3>
             <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>- {t('profilePages.bonuses.rule1')}</li>
                <li>- {t('profilePages.bonuses.rule2')}</li>
                <li>- {t('profilePages.bonuses.rule3')}</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}