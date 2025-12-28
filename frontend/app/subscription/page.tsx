'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, CheckCircle2, Wallet, ArrowLeft, Calendar,
  Sparkles, Shield, Zap, RefreshCw, Loader, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { subscriptionsAPI, walletAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useTheme } from '@/lib/theme';

const COINS_PER_USD = 100;

interface SubscriptionStatus {
  has_active_subscription: boolean;
  subscription?: {
    id: number;
    start_date: string;
    end_date: string;
    days_remaining: number;
    is_auto_renewal: boolean;
  };
}

interface PriceInfo {
  price_coins: number;
  price_usd: number;
  user_balance: number;
  has_enough_balance: boolean;
  shortfall: number;
}

export default function SubscriptionPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, updateBalance } = useAuthStore();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, priceRes] = await Promise.all([
        subscriptionsAPI.getStatus(),
        subscriptionsAPI.getPrice()
      ]);
      setStatus(statusRes);
      setPriceInfo(priceRes);
    } catch (error) {
      toast.error(t('subscription.loadError', 'Помилка завантаження'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePurchase = async () => {
    if (!priceInfo?.has_enough_balance) {
      router.push('/profile/wallet');
      return;
    }

    setProcessing(true);
    try {
      const response = await subscriptionsAPI.checkout();

      if (response.success) {
        updateBalance(response.new_balance);
        toast.success(response.message || t('subscription.purchaseSuccess', 'Підписку активовано!'));
        fetchData();
      }
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (detail?.error === 'insufficient_funds') {
        toast.error(detail.message || t('subscription.insufficientFunds', 'Недостатньо монет'));
        router.push('/profile/wallet');
      } else {
        toast.error(detail || t('subscription.purchaseError', 'Помилка оформлення'));
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
        <Loader className="w-8 h-8 animate-spin" style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  const userBalance = priceInfo?.user_balance || user?.balance || 0;
  const priceCoins = priceInfo?.price_coins || 500;
  const priceUsd = priceInfo?.price_usd || 5;
  const hasEnough = priceInfo?.has_enough_balance || false;
  const shortfall = priceInfo?.shortfall || 0;

  if (status?.has_active_subscription && status.subscription) {
    return (
      <div className="min-h-screen pb-20" style={{ background: theme.colors.bgGradient }}>
        <div className="sticky top-0 z-10 backdrop-blur-xl" style={{ backgroundColor: `${theme.colors.background}CC`, borderBottom: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-xl transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ArrowLeft size={24} style={{ color: theme.colors.text }} />
            </button>
            <h1 className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('subscription.pageTitle')}</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-6 shadow-xl"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: theme.colors.primaryLight, opacity: 0.2 }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: theme.colors.accentLight, opacity: 0.15 }} />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                  <Crown size={28} style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>{t('subscription.activeTitle')}</h2>
                  <p className="text-sm" style={{ color: theme.colors.textMuted }}>{t('subscription.activeSubtitle')}</p>
                </div>
              </div>

              <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: theme.colors.surface }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: theme.colors.textMuted }}>{t('subscription.daysRemaining')}</span>
                  <span className="text-2xl font-bold" style={{ color: theme.colors.primary }}>{status.subscription.days_remaining}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: theme.colors.textMuted }}>{t('subscription.activeUntil')}</span>
                  <span className="font-medium" style={{ color: theme.colors.text }}>{formatDate(status.subscription.end_date)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 space-y-4 rounded-3xl shadow-sm"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <h3 className="font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
              <RefreshCw size={18} style={{ color: theme.colors.primary }} />
              {t('subscription.management.title', 'Керування підпискою')}
            </h3>

            <button
              onClick={handlePurchase}
              disabled={processing}
              className="w-full flex items-center justify-between p-4 rounded-xl transition-colors"
              style={{ backgroundColor: theme.colors.surface }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
            >
              <div className="flex items-center gap-3">
                <Calendar size={20} style={{ color: theme.colors.primary }} />
                <div className="text-left">
                  <p className="font-medium" style={{ color: theme.colors.text }}>{t('subscription.management.extend')}</p>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>{t('subscription.management.extendDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold" style={{ color: theme.colors.primary }}>
                <Image src="/omr_coin.png" alt="OMR" width={18} height={18} />
                {priceCoins}
              </div>
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.colors.bgGradient }}>
      <div className="sticky top-0 z-10 backdrop-blur-xl" style={{ backgroundColor: `${theme.colors.background}CC`, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={24} style={{ color: theme.colors.text }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('subscription.pageTitle')}</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 shadow-xl"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: theme.colors.primaryLight, opacity: 0.15 }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: theme.colors.accentLight, opacity: 0.1 }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                <Crown size={32} style={{ color: theme.colors.primary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>{t('subscription.premiumTitle')}</h2>
                <p style={{ color: theme.colors.textMuted }}>{t('subscription.pageSubtitle')}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" style={{ color: theme.colors.success }} />
                <span className="text-sm" style={{ color: theme.colors.textSecondary }} dangerouslySetInnerHTML={{ __html: t('subscription.feature1') }} />
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" style={{ color: theme.colors.success }} />
                <span className="text-sm" style={{ color: theme.colors.textSecondary }} dangerouslySetInnerHTML={{ __html: t('subscription.feature2') }} />
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" style={{ color: theme.colors.success }} />
                <span className="text-sm" style={{ color: theme.colors.textSecondary }} dangerouslySetInnerHTML={{ __html: t('subscription.feature3') }} />
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" style={{ color: theme.colors.success }} />
                <span className="text-sm" style={{ color: theme.colors.textSecondary }}>{t('subscription.feature4')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 space-y-4 rounded-3xl shadow-sm"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <h3 className="font-semibold" style={{ color: theme.colors.text }}>{t('subscription.priceTitle', 'Вартість')}</h3>

          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: `${theme.colors.primary}10`, border: `1px solid ${theme.colors.primary}33` }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                <Image src="/omr_coin.png" alt="OMR" width={28} height={28} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{priceCoins.toLocaleString()}</p>
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>≈ ${priceUsd}{t('subscription.perMonth')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>{t('subscription.perMonth', '/місяць')}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ backgroundColor: theme.colors.surface }}>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2" style={{ color: theme.colors.textMuted }}>
                <Wallet size={16} />
                {t('cart.yourBalance', 'Ваш баланс')}
              </span>
              <span className="font-bold flex items-center gap-1" style={{ color: theme.colors.text }}>
                <Image src="/omr_coin.png" alt="OMR" width={16} height={16} />
                {userBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {!hasEnough && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${theme.colors.warning}10`, border: `1px solid ${theme.colors.warning}33` }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" style={{ color: theme.colors.warning }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.warning }}>{t('subscription.notEnoughCoins', 'Недостатньо монет')}</p>
                  <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                    {t('subscription.needMore', 'Потрібно ще')} <span className="font-bold" style={{ color: theme.colors.warning }}>{shortfall.toLocaleString()}</span> {t('subscription.coins', 'монет')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {hasEnough ? (
            <button
              onClick={handlePurchase}
              disabled={processing}
              className="w-full text-white px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                boxShadow: `0 10px 30px -10px ${theme.colors.primary}4D`,
              }}
            >
              {processing ? (
                <>
                  <Loader className="animate-spin" size={22} />
                  {t('common.processing', 'Обробка...')}
                </>
              ) : (
                <>
                  <Crown size={22} />
                  {t('subscription.checkoutButton')}
                  <span className="flex items-center gap-1 ml-2 px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <Image src="/omr_coin.png" alt="OMR" width={16} height={16} />
                    {priceCoins}
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => router.push('/profile/wallet')}
              className="w-full text-white px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.warning}, ${theme.colors.accent})`,
                boxShadow: `0 10px 30px -10px ${theme.colors.warning}4D`,
              }}
            >
              <Wallet size={22} />
              {t('subscription.topUpWallet', 'Поповнити гаманець')}
            </button>
          )}

          <p className="text-xs text-center" style={{ color: theme.colors.textMuted }}>
            {t('subscription.cancelAnytime')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="p-4 text-center rounded-2xl" style={{ backgroundColor: theme.colors.card, border: `1px solid ${theme.colors.border}` }}>
            <Sparkles size={24} className="mx-auto mb-2" style={{ color: theme.colors.accent }} />
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>{t('subscription.benefit1', 'Ексклюзивний контент')}</p>
          </div>
          <div className="p-4 text-center rounded-2xl" style={{ backgroundColor: theme.colors.card, border: `1px solid ${theme.colors.border}` }}>
            <Shield size={24} className="mx-auto mb-2" style={{ color: theme.colors.success }} />
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>{t('subscription.benefit2', 'Пожиттєвий доступ')}</p>
          </div>
          <div className="p-4 text-center rounded-2xl" style={{ backgroundColor: theme.colors.card, border: `1px solid ${theme.colors.border}` }}>
            <Zap size={24} className="mx-auto mb-2" style={{ color: theme.colors.primary }} />
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>{t('subscription.benefit3', 'Пріоритетна підтримка')}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}