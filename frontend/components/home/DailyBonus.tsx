'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, ChevronRight } from 'lucide-react';
import { profileAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';

export default function DailyBonus() {
  const { theme } = useTheme();
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
        toast.success(t('bonus.toasts.claimed', { amount: result.bonus_amount }));
        if (user) {
          // ВИПРАВЛЕНО: bonus_streak -> bonusStreak
          setUser({ ...user, balance: result.new_balance, bonusStreak: result.new_streak });
        }
        fetchBonusInfo();
      }
    } catch (error: any) {
      toast.error(t('bonus.toasts.claimError'));
    }
  };

  if (!isAuthenticated || !bonusInfo) return null;

  const progress = bonusInfo.streak > 0 ? (bonusInfo.streak % 7) || 7 : 0;
  const progressPercent = (progress / 7) * 100;

  return (
    <Link href="/profile/bonuses">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="p-4 relative overflow-hidden group rounded-3xl"
        style={{
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.sm
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: theme.colors.surfaceHover,
                color: theme.colors.primary
              }}
            >
              <Gift size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: theme.colors.text }}>
                {t('bonus.dailyBonus')}
              </h3>
              <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                {bonusInfo.streak} {t('bonus.daysInARow')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: theme.colors.primary }}>
              {bonusInfo.balance} <span className="text-sm">💎</span>
            </p>
          </div>
        </div>

        {bonusInfo.can_claim_today ? (
          <button
            onClick={claimBonus}
            className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide animate-pulse transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
              color: '#FFFFFF',
              boxShadow: theme.shadows.md
            }}
          >
            {t('bonus.claimButton')}
          </button>
        ) : (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium" style={{ color: theme.colors.textMuted }}>
              <span>{t('bonus.weeklyProgress')}</span>
              <span>{progress}/7</span>
            </div>
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.accent})`
                }}
              />
            </div>
          </div>
        )}

        <ChevronRight
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          size={20}
          style={{ color: theme.colors.textMuted }}
        />
      </motion.div>
    </Link>
  );
}