'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { walletAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Coins, ArrowDownLeft, Gift, CreditCard,
  ShoppingCart, Crown, RefreshCw, Sparkles, ChevronRight,
  TrendingUp, Clock, Check, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CoinPack, Transaction, TransactionType } from '@/types';
import { useTheme } from '@/lib/theme';
import StripePaymentModal from '@/components/StripePaymentModal';

export default function WalletPage() {
  const { theme } = useTheme();
  const { user, updateBalance } = useAuthStore();

  const [balance, setBalance] = useState(0);
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<CoinPack | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  const fetchWalletInfo = useCallback(async () => {
    try {
      const info = await walletAPI.getInfo();
      setBalance(info.balance);
      setCoinPacks(info.coin_packs);
      setTransactions(info.recent_transactions);
      updateBalance(info.balance);
    } catch (error) {
      toast.error(t('wallet.loadError') || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, [updateBalance, t]);

  const loadMoreTransactions = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const response = await walletAPI.getTransactions({ page: page + 1, size: 10 });
      if (response.items.length > 0) {
        setTransactions(prev => [...prev, ...response.items]);
        setPage(page + 1);
        setHasMore(response.items.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchWalletInfo();
  }, [fetchWalletInfo]);

  const getTransactionIcon = (type: TransactionType) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className={iconClass} style={{ color: theme.colors.success }} />;
      case 'purchase':
        return <ShoppingCart className={iconClass} style={{ color: theme.colors.orange }} />;
      case 'subscription':
        return <Crown className={iconClass} style={{ color: theme.colors.purple }} />;
      case 'bonus':
        return <Gift className={iconClass} style={{ color: theme.colors.accent }} />;
      case 'refund':
        return <RefreshCw className={iconClass} style={{ color: theme.colors.warning }} />;
      case 'referral':
        return <TrendingUp className={iconClass} style={{ color: theme.colors.info }} />;
      default:
        return <Coins className={iconClass} style={{ color: theme.colors.textMuted }} />;
    }
  };

  const getTransactionLabel = (type: TransactionType) => {
    switch (type) {
      case 'deposit': return t('wallet.txDeposit', 'Поповнення');
      case 'purchase': return t('wallet.txPurchase', 'Покупка');
      case 'subscription': return t('wallet.txSubscription', 'Підписка');
      case 'bonus': return t('wallet.txBonus', 'Бонус');
      case 'refund': return t('wallet.txRefund', 'Повернення');
      case 'referral': return t('wallet.txReferral', 'Реферал');
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return t('wallet.yesterday', 'Вчора');
    } else if (days < 7) {
      return date.toLocaleDateString('uk-UA', { weekday: 'short' });
    }
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  };

  const handleBuyPack = (pack: CoinPack) => {
    setSelectedPack(pack);
    setShowStripeModal(true);
  };

  const handleStripePaymentSuccess = () => {
    setShowStripeModal(false);
    setSelectedPack(null);
    setLoading(true);
    fetchWalletInfo();
    toast.success(t('wallet.paymentSuccess') || 'Оплата успішна! Монети зараховано.');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div
          className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent"
          style={{ borderColor: theme.colors.accent }}
        />
      </div>
    );
  }

  const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 5);

  return (
    <div className="min-h-screen" style={{ background: theme.colors.bgGradient }}>
      <StripePaymentModal
        isOpen={showStripeModal}
        onClose={() => {
          setShowStripeModal(false);
          setSelectedPack(null);
        }}
        coinPack={selectedPack}
        onSuccess={handleStripePaymentSuccess}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-6 pb-24 space-y-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
          }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Wallet size={20} className="opacity-80" />
                <span className="text-sm font-medium opacity-80">
                  {t('wallet.yourBalance', 'Ваш баланс')}
                </span>
              </div>
              <button
                onClick={fetchWalletInfo}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Balance */}
            <div className="flex items-end gap-3 mb-2">
              <Image
                src="/omr_coin.png"
                alt="OMR"
                width={48}
                height={48}
                className="drop-shadow-lg"
              />
              <div>
                <span className="text-5xl font-bold tracking-tight">
                  {balance.toLocaleString()}
                </span>
                <span className="text-xl ml-2 opacity-80">OMR</span>
              </div>
            </div>

            {/* USD equivalent */}
            <p className="text-sm opacity-70 mb-4">
              ≈ ${(balance / 100).toFixed(2)} USD
            </p>

            {/* Info badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5 text-xs">
              <Info size={14} />
              <span>100 OMR = $1 USD</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => router.push('/profile/bonuses')}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all group hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.colors.accentLight }}
            >
              <Gift size={20} style={{ color: theme.colors.accent }} />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-sm" style={{ color: theme.colors.text }}>
                {t('wallet.dailyBonus', 'Бонус')}
              </p>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                {user?.bonusStreak || 0} {t('wallet.days', 'днів')}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: theme.colors.textMuted }} />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => router.push('/profile/referrals')}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all group hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.colors.primaryLight }}
            >
              <TrendingUp size={20} style={{ color: theme.colors.primary }} />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-sm" style={{ color: theme.colors.text }}>
                {t('wallet.referrals', 'Реферали')}
              </p>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                +5% {t('wallet.fromFriends', 'від друзів')}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: theme.colors.textMuted }} />
          </motion.button>
        </div>

        {/* Coin Packs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
              <CreditCard size={20} style={{ color: theme.colors.primary }} />
              {t('wallet.buyCoins', 'Поповнити баланс')}
            </h2>
          </div>

          <div className="space-y-3">
            {coinPacks.map((pack, index) => (
              <motion.button
                key={pack.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => handleBuyPack(pack)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: pack.is_featured ? theme.colors.accentLight : theme.colors.card,
                  borderColor: pack.is_featured ? theme.colors.accent : theme.colors.border,
                }}
              >
                {/* Coin icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: pack.is_featured ? theme.colors.accent : theme.colors.surface,
                  }}
                >
                  <Image
                    src="/omr_coin.png"
                    alt="OMR"
                    width={28}
                    height={28}
                  />
                </div>

                {/* Pack info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg" style={{ color: theme.colors.text }}>
                      {pack.coins_amount.toLocaleString()} OMR
                    </span>
                    {pack.is_featured && (
                      <span
                        className="px-2 py-0.5 text-white text-xs font-medium rounded-full"
                        style={{ backgroundColor: theme.colors.accent }}
                      >
                        {t('wallet.popular', 'Популярний')}
                      </span>
                    )}
                  </div>
                  {pack.bonus_percent > 0 && (
                    <p className="text-sm font-medium flex items-center gap-1" style={{ color: theme.colors.success }}>
                      <Sparkles size={14} />
                      +{pack.bonus_percent}% {t('wallet.bonus', 'бонус')} (+{pack.total_coins - pack.coins_amount} OMR)
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-right">
                  <span className="text-xl font-bold" style={{ color: theme.colors.accent }}>
                    ${pack.price_usd}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Payment info */}
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: theme.colors.textMuted }}>
            <Check size={14} style={{ color: theme.colors.success }} />
            <span>{t('wallet.securePayment', 'Безпечна оплата через Stripe')}</span>
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Clock size={20} style={{ color: theme.colors.primary }} />
              {t('wallet.history', 'Історія')}
            </h2>
            {transactions.length > 5 && (
              <button
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="text-sm font-medium"
                style={{ color: theme.colors.primary }}
              >
                {showAllTransactions
                  ? t('wallet.showLess', 'Згорнути')
                  : t('wallet.showAll', 'Показати всі')}
              </button>
            )}
          </div>

          {transactions.length === 0 ? (
            <div
              className="text-center py-12 rounded-2xl"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <Coins size={48} className="mx-auto mb-3" style={{ color: theme.colors.textMuted, opacity: 0.3 }} />
              <p style={{ color: theme.colors.textMuted }}>
                {t('wallet.noTransactions', 'Транзакцій поки немає')}
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <AnimatePresence>
                {displayedTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4"
                    style={{
                      borderBottom: index !== displayedTransactions.length - 1
                        ? `1px solid ${theme.colors.border}`
                        : 'none',
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.surface }}
                    >
                      {getTransactionIcon(tx.type)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: theme.colors.text }}>
                        {tx.description || getTransactionLabel(tx.type)}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                        {formatDate(tx.created_at)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p
                        className="font-bold"
                        style={{ color: tx.amount >= 0 ? theme.colors.success : theme.colors.error }}
                      >
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                        {tx.balance_after.toLocaleString()} OMR
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Load more */}
              {showAllTransactions && hasMore && (
                <button
                  onClick={loadMoreTransactions}
                  disabled={loadingMore}
                  className="w-full py-4 text-sm font-medium disabled:opacity-50"
                  style={{
                    color: theme.colors.primary,
                    borderTop: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {loadingMore ? (
                    <RefreshCw className="animate-spin mx-auto" size={18} />
                  ) : (
                    t('wallet.loadMore', 'Завантажити ще')
                  )}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
