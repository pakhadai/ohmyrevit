'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Gift, Calendar, Flame, Trophy, Star, Loader, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { bonusAPI } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

interface DailyBonus {
  day: number;
  coins: number;
  claimed: boolean;
  current: boolean;
}

export default function BonusesPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, updateBalance } = useAuthStore();
  const { t } = useTranslation();

  const [streak, setStreak] = useState(0);
  const [dailyBonuses, setDailyBonuses] = useState<DailyBonus[]>([]);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    fetchBonusData();
  }, []);

  const fetchBonusData = async () => {
    try {
      const data = await bonusAPI.getDailyStatus();
      setStreak(data.streak || 0);
      setCanClaimDaily(data.can_claim || false);
      setDailyBonuses(data.weekly_bonuses || generateDefaultBonuses(data.streak || 0, data.can_claim || false));
    } catch (error) {
      setDailyBonuses(generateDefaultBonuses(0, true));
      setCanClaimDaily(true);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDefaultBonuses = (currentStreak: number, canClaim: boolean): DailyBonus[] => {
    const bonusAmounts = [10, 15, 20, 30, 40, 50, 100];
    return bonusAmounts.map((coins, index) => ({
      day: index + 1,
      coins,
      claimed: index < currentStreak,
      current: index === currentStreak && canClaim,
    }));
  };

  const handleClaimDaily = async () => {
    if (!canClaimDaily || isClaiming) return;
    setIsClaiming(true);
    try {
      const response = await bonusAPI.claimDaily();
      if (response.success) {
        toast.success(t('bonuses.claimed', { amount: response.coins }));
        updateBalance(response.new_balance);
        setCanClaimDaily(false);
        setStreak(prev => prev + 1);
        setDailyBonuses(prev =>
          prev.map((b, i) =>
            i === streak ? { ...b, claimed: true, current: false } : b
          )
        );
      }
    } catch (error) {
      toast.error(t('bonuses.claimError'));
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
        <Loader className="animate-spin" size={32} style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.colors.bgGradient }}>
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
            {t('bonuses.title')}
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 mb-6"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
            borderRadius: theme.radius['2xl'],
            boxShadow: theme.shadows.lg,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: theme.radius.lg }}
              >
                <Flame size={24} color="#FFF" />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {t('bonuses.currentStreak')}
                </p>
                <p className="text-2xl font-bold text-white">
                  {streak} {t('bonuses.days')}
                </p>
              </div>
            </div>
            <Trophy size={40} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>

          {canClaimDaily && (
            <button
              onClick={handleClaimDaily}
              disabled={isClaiming}
              className="w-full py-3 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: '#FFF',
                color: theme.colors.accentDark,
                borderRadius: theme.radius.xl,
              }}
            >
              {isClaiming ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <>
                  <Gift size={20} />
                  {t('bonuses.claimToday')}
                </>
              )}
            </button>
          )}
        </motion.div>

        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>
            {t('bonuses.weeklyRewards')}
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {dailyBonuses.map((bonus) => (
              <motion.div
                key={bonus.day}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: bonus.day * 0.05 }}
                className="relative p-3 text-center"
                style={{
                  backgroundColor: bonus.claimed
                    ? theme.colors.successLight
                    : bonus.current
                    ? theme.colors.primaryLight
                    : theme.colors.card,
                  border: bonus.current
                    ? `2px solid ${theme.colors.primary}`
                    : `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.lg,
                }}
              >
                {bonus.claimed && (
                  <div className="absolute -top-1.5 -right-1.5">
                    <CheckCircle2 size={16} style={{ color: theme.colors.success }} fill={theme.colors.successLight} />
                  </div>
                )}
                <p className="text-xs font-medium mb-1" style={{ color: theme.colors.textMuted }}>
                  {t('bonuses.day')} {bonus.day}
                </p>
                <div className="flex items-center justify-center gap-0.5">
                  <Image src="/omr_coin.png" alt="OMR" width={12} height={12} />
                  <span
                    className="text-sm font-bold"
                    style={{ color: bonus.claimed ? theme.colors.success : theme.colors.text }}
                  >
                    {bonus.coins}
                  </span>
                </div>
                {bonus.day === 7 && (
                  <Star size={10} className="mx-auto mt-1" style={{ color: theme.colors.accent }} fill={theme.colors.accent} />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div
          className="p-5"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={20} style={{ color: theme.colors.primary }} />
            <h3 className="font-bold" style={{ color: theme.colors.text }}>
              {t('bonuses.howItWorks')}
            </h3>
          </div>
          <ul className="space-y-2 text-sm" style={{ color: theme.colors.textSecondary }}>
            <li className="flex items-start gap-2">
              <span style={{ color: theme.colors.primary }}>•</span>
              {t('bonuses.rule1')}
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: theme.colors.primary }}>•</span>
              {t('bonuses.rule2')}
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: theme.colors.primary }}>•</span>
              {t('bonuses.rule3')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}