'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Clock, Zap, Info, CheckCircle2, TrendingUp } from 'lucide-react';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';

export default function BonusesPage() {
  const { theme } = useTheme();
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: theme.colors.primary }} />
      </div>
    );
  }

  if (!bonusInfo) {
    return <div className="text-center py-12" style={{ color: theme.colors.textMuted }}>{t('profilePages.bonuses.loadError')}</div>;
  }

  const progress = bonusInfo.streak > 0 ? (bonusInfo.streak % 7) || 7 : 0;
  const progressPercent = (progress / 7) * 100;

  return (
    <div className="container mx-auto px-5 pt-14 pb-2 space-y-6">

      <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>{t('profilePages.bonuses.pageTitle')}</h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] p-6 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
        }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full mb-3 border border-white/10">
                <Zap size={14} className="text-yellow-200 fill-yellow-200" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">{t('profilePages.bonuses.dailyStreakLabel')}</span>
              </div>
              <h2 className="text-3xl font-bold mb-1">{bonusInfo.streak} {t('profilePages.bonuses.days')}</h2>
              <p className="text-white/80 text-sm font-medium">{t('profilePages.bonuses.currentStreak')}</p>
            </div>
            <Gift size={48} className="text-white/20 rotate-12" />
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-xs font-medium text-white/80 mb-2">
              <span>{t('profilePages.bonuses.weeklyProgress')}</span>
              <span>{progress}/7</span>
            </div>
            <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-white rounded-full shadow-sm"
              />
            </div>
          </div>

          <button
            onClick={claimBonus}
            disabled={!bonusInfo.can_claim_today}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${bonusInfo.can_claim_today
                ? 'bg-white hover:bg-orange-50 active:scale-[0.98]'
                : 'bg-black/20 text-white/60 cursor-not-allowed'
              }`}
            style={{ color: bonusInfo.can_claim_today ? theme.colors.accent : undefined }}
          >
            {bonusInfo.can_claim_today ? (
              <>
                <Gift size={18} />
                {t('profilePages.bonuses.claimBonus')}
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                {t('profilePages.bonuses.alreadyClaimed')}
              </>
            )}
          </button>

          {!bonusInfo.can_claim_today && bonusInfo.next_claim_time && (
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-white/70 font-medium">
              <Clock size={14} />
              {t('profilePages.bonuses.nextBonusTomorrow')}
            </p>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.colors.textMuted }}>{t('profilePages.bonuses.currentBalance')}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: theme.colors.text }}>{bonusInfo.balance}</span>
            <span className="text-xl">💎</span>
          </div>
          <div className="mt-3 pt-3 flex items-center gap-2 text-xs font-medium" style={{ borderTop: `1px solid ${theme.colors.border}`, color: theme.colors.primary }}>
            <TrendingUp size={14} />
            {t('profilePages.bonuses.equivalentDiscount', { amount: (bonusInfo.balance / 100).toFixed(2) })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-xl"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: theme.colors.textMuted }}>
            <Info size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider">{t('profilePages.bonuses.howItWorks')}</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm" style={{ color: theme.colors.textSecondary }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: theme.colors.primary }}></div>
              <span>{t('profilePages.bonuses.rule1')}</span>
            </li>
            <li className="flex gap-3 text-sm" style={{ color: theme.colors.textSecondary }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: theme.colors.primary }}></div>
              <span>{t('profilePages.bonuses.rule2')}</span>
            </li>
            <li className="flex gap-3 text-sm" style={{ color: theme.colors.textSecondary }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: theme.colors.primary }}></div>
              <span>{t('profilePages.bonuses.rule3')}</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
