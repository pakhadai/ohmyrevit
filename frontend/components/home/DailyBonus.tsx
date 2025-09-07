// ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, TrendingUp, Clock } from 'lucide-react';
import { profileAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next'; // ДОДАНО

export default function DailyBonus() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [bonusInfo, setBonusInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const { t } = useTranslation(); // ДОДАНО

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
        fetchBonusInfo(); // Час вийшов, оновлюємо дані
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
      const result = await profileAPI.claimBonus();
      if (result.success) {
        toast.success(`🎉 ${result.message}`);
        if(user) {
            setUser({...user, bonus_balance: result.new_balance, bonus_streak: result.streak});
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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Gift size={24} />
            {/* OLD: Щоденний бонус */}
            {t('bonus.dailyBonus')}
          </h3>
          <div className="text-right">
            <p className="text-2xl font-bold">{bonusInfo.streak}</p>
            {/* OLD: <p className="text-xs opacity-90">днів поспіль</p> */}
            <p className="text-xs opacity-90">{t('bonus.daysInARow')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Прогрес стріку */}
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-2">
              {/* OLD: <span>Стрік-прогрес</span> */}
              <span>{t('bonus.streakProgress')}</span>
              <span>{bonusInfo.streak % 7}/7</span>
            </div>
            <div className="bg-white/30 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(bonusInfo.streak % 7) / 7 * 100}%` }}
                className="bg-white h-full rounded-full"
              />
            </div>
            <p className="text-xs mt-1 opacity-90">
              {bonusInfo.streak > 0 && bonusInfo.streak % 7 === 0
                // OLD: ? 'Ви отримали супер-бонус!'
                ? t('bonus.superBonusClaimed')
                // OLD: : `Ще ${7 - (bonusInfo.streak % 7)} днів до бонусу за тиждень`
                : t('bonus.daysToSuperBonus', { count: 7 - (bonusInfo.streak % 7) })
              }
            </p>
          </div>

          {/* Кнопка отримання */}
          {bonusInfo.can_claim_today ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={claimBonus}
              className="w-full bg-white text-orange-500 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              {/* OLD: Отримати бонус! 🎁 */}
              {t('bonus.claimButton')}
            </motion.button>
          ) : (
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <p className="flex items-center justify-center gap-2">
                <Clock size={16} />
                {/* OLD: Наступний бонус через */}
                {t('bonus.nextBonusIn')}
              </p>
              <p className="text-xl font-bold mt-1">{timeLeft}</p>
            </div>
          )}

          {/* Поточний баланс */}
          <div className="flex justify-between items-center pt-3 border-t border-white/20">
            {/* OLD: <span className="opacity-90">Ваш баланс:</span> */}
            <span className="opacity-90">{t('bonus.yourBalance')}</span>
            <span className="font-bold text-xl">{bonusInfo.balance} 💎</span>
          </div>
        </div>
      </motion.div>
    );
}