// frontend/components/home/DailyBonus.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Clock, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { profileAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Link from 'next/link'; // Added Link

export default function DailyBonus() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [bonusInfo, setBonusInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const { t } = useTranslation();

  const fetchBonusInfo = async () => {
    try {
      const data = await profileAPI.getBonusInfo();
      setBonusInfo(data);
    } catch (error) {
      console.error('Error fetching bonus info:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBonusInfo();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!bonusInfo) return;

    const timer = setInterval(() => {
      if (bonusInfo.can_claim_today) {
        setTimeLeft('');
        return;
      }

      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      if (diff <= 0) {
        fetchBonusInfo();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [bonusInfo]);

  const claimBonus = async () => {
    try {
      const result = await profileAPI.claimDailyBonus();
      if (result.success) {
        toast.success(`🎉 ${result.message}`);
        if(user) {
            setUser({...user, bonus_balance: result.new_balance, bonus_streak: result.new_streak});
        }
        fetchBonusInfo();
      } else {
        toast.error(result.message || 'Не вдалося отримати бонус');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Помилка при отриманні бонусу');
    }
  };

  if (!isAuthenticated || !bonusInfo) {
    return null;
  }

  return (
      // ЗМІНЕНО: Білий фон, бурштиновий (amber) бордер
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-amber-100 dark:border-amber-900/30 relative overflow-hidden"
      >
        {/* Фоновий декор */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 dark:bg-amber-900/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
            <Link href="/profile/bonuses" className="flex items-center gap-3 group">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl group-hover:scale-105 transition-transform">
                    <Gift size={22} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1">
                        {t('bonus.dailyBonus')}
                        <ChevronRight size={14} className="text-slate-400" />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {bonusInfo.streak} {t('bonus.daysInARow')}
                    </p>
                </div>
            </Link>
            <div className="text-right">
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wide">{t('bonus.yourBalance')}</span>
                <p className="text-xl font-bold text-amber-500">{bonusInfo.balance} 💎</p>
            </div>
            </div>

            <div className="space-y-3">
            {/* Прогрес стріку */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    <span>{t('bonus.streakProgress')}</span>
                    <span>{bonusInfo.streak > 0 ? bonusInfo.streak % 7 : 0}/7</span>
                </div>
                <div className="bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(bonusInfo.streak > 0 ? bonusInfo.streak % 7 : 0) / 7 * 100}%` }}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full"
                />
                </div>
                <p className="text-[10px] mt-1.5 text-slate-400 text-center">
                {bonusInfo.streak > 0 && bonusInfo.streak % 7 === 0
                    ? t('bonus.superBonusClaimed')
                    : t('bonus.daysToSuperBonus', { count: 7 - (bonusInfo.streak > 0 ? bonusInfo.streak % 7 : 0) })
                }
                </p>
            </div>

            {/* Кнопка отримання */}
            {bonusInfo.can_claim_today ? (
                <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={claimBonus}
                className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
                >
                {t('bonus.claimButton')}
                </motion.button>
            ) : (
                <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-3 text-center border border-slate-200 dark:border-slate-600">
                <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-300">
                    <Clock size={14} />
                    {t('bonus.nextBonusIn')}
                </p>
                <p className="text-lg font-bold text-slate-700 dark:text-white mt-0.5 font-mono">{timeLeft}</p>
                </div>
            )}
            </div>
        </div>
      </motion.div>
    );
}