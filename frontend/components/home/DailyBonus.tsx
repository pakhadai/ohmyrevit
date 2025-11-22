'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, ChevronRight } from 'lucide-react';
import { profileAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function DailyBonus() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [bonusInfo, setBonusInfo] = useState<any>(null);
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
    if (isAuthenticated) fetchBonusInfo();
  }, [isAuthenticated]);

  const claimBonus = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!bonusInfo?.can_claim_today) return;

    try {
      const result = await profileAPI.claimDailyBonus();
      if (result.success) {
        toast.success(`🎉 +${result.bonus_amount} бонусів!`);
        if(user) {
            setUser({...user, bonus_balance: result.new_balance, bonus_streak: result.new_streak});
        }
        fetchBonusInfo();
      }
    } catch (error: any) {
      toast.error('Помилка при отриманні бонусу');
    }
  };

  if (!isAuthenticated || !bonusInfo) return null;

  // Розрахунок прогресу (1-7 днів)
  const progress = bonusInfo.streak > 0 ? (bonusInfo.streak % 7) || 7 : 0;
  const progressPercent = (progress / 7) * 100;

  return (
    <Link href="/profile/bonuses">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="card-minimal p-4 relative overflow-hidden group"
      >
        {/* Верхня частина: Заголовок та Баланс */}
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                    <Gift size={16} />
                </div>
                <div>
                    <h3 className="font-bold text-sm text-foreground">{t('bonus.dailyBonus')}</h3>
                    <p className="text-[10px] text-muted-foreground">
                        {bonusInfo.streak} {t('bonus.daysInARow')}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-primary">{bonusInfo.balance} <span className="text-sm">💎</span></p>
            </div>
        </div>

        {/* Прогрес бар або Кнопка */}
        {bonusInfo.can_claim_today ? (
            <button
                onClick={claimBonus}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20 animate-pulse"
            >
                {t('bonus.claimButton')}
            </button>
        ) : (
            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                    <span>Прогрес тижня</span>
                    <span>{progress}/7</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-gradient-to-r from-orange-400 to-primary rounded-full"
                    />
                </div>
            </div>
        )}

        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
      </motion.div>
    </Link>
  );
}