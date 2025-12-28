'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { walletAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Coins, ArrowUpRight, ArrowDownLeft, Gift, CreditCard,
  ShoppingCart, Crown, RefreshCw, History, Sparkles, ChevronRight,
  ExternalLink, TrendingUp, Clock, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CoinPack, Transaction, TransactionType } from '@/types';
import { useTheme } from '@/lib/theme';
import EmailRequiredModal from '@/components/EmailRequiredModal';

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
  const [showEmailRequiredModal, setShowEmailRequiredModal] = useState(false);
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
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="text-green-500" size={20} />;
      case 'purchase':
        return <ShoppingCart className="text-orange-500" size={20} />;
      case 'subscription':
        return <Crown className="text-purple-500" size={20} />;
      case 'bonus':
        return <Gift className="text-blue-500" size={20} />;
      case 'refund':
        return <RefreshCw className="text-yellow-500" size={20} />;
      case 'referral':
        return <TrendingUp className="text-cyan-500" size={20} />;
      default:
        return <Coins size={20} style={{ color: theme.colors.textMuted }} />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? theme.colors.success : theme.colors.error;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBuyPack = (pack: CoinPack) => {
    // Перевірка email та його підтвердження перед покупкою
    if (!user?.email || !user?.isEmailVerified) {
      setShowEmailRequiredModal(true);
      return;
    }

    // URL для повернення після успішної оплати
    const returnUrl = typeof window !== 'undefined' ? window.location.origin + '/profile/wallet' : '';

    const separator = pack.gumroad_url.includes('?') ? '&' : '?';
    const url = `${pack.gumroad_url}${separator}custom_fields%5Buser_id%5D=${user?.id}&wanted=true&redirect_url=${encodeURIComponent(returnUrl)}`;

    // Відкриваємо в тому ж вікні для зручності в Telegram WebApp
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent" style={{ borderColor: theme.colors.primary }} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-14 pb-2 space-y-6 max-w-2xl">
      <AnimatePresence>
        {showEmailRequiredModal && (
          <EmailRequiredModal
            onClose={() => setShowEmailRequiredModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
          <Wallet size={28} style={{ color: theme.colors.primary }} />
          {t('wallet.title') || 'Гаманець'}
        </h1>
        <button
          onClick={fetchWalletInfo}
          className="p-2 rounded-xl transition-colors"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <RefreshCw size={20} style={{ color: theme.colors.textMuted }} />
        </button>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 shadow-xl"
        style={{
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: theme.colors.primaryLight, opacity: 0.3 }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: theme.colors.accentLight, opacity: 0.2 }} />

        <div className="relative z-10">
          <p className="text-sm mb-1" style={{ color: theme.colors.textMuted }}>{t('wallet.yourBalance') || 'Ваш баланс'}</p>

          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/omr_coin.png"
              alt="OMR Coin"
              width={48}
              height={48}
              className="drop-shadow-lg"
            />
            <div>
              <span className="text-4xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                {balance.toLocaleString()}
              </span>
              <span className="text-xl ml-2" style={{ color: theme.colors.textSecondary }}>OMR</span>
            </div>
          </div>

          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
            ≈ ${(balance / 100).toFixed(2)} USD
          </p>
        </div>

        {/* Quick stats */}
        <div className="relative z-10 mt-4 pt-4 flex justify-between text-sm" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
          <div>
            <p style={{ color: theme.colors.textMuted }}>{t('wallet.rate') || 'Курс'}</p>
            <p className="font-medium" style={{ color: theme.colors.text }}>100 OMR = $1</p>
          </div>
          <div className="text-right">
            <p style={{ color: theme.colors.textMuted }}>{t('wallet.streak') || 'Streak'}</p>
            <p className="font-medium flex items-center gap-1 justify-end" style={{ color: theme.colors.text }}>
              <Sparkles size={14} style={{ color: theme.colors.accent }} />
              {user?.bonusStreak || 0} {t('wallet.days') || 'днів'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Coin Packs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <CreditCard size={20} style={{ color: theme.colors.primary }} />
            {t('wallet.buyCoins') || 'Поповнити баланс'}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {coinPacks.map((pack, index) => (
            <motion.button
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleBuyPack(pack)}
              className={`relative p-4 rounded-2xl border transition-all text-left group hover:scale-[1.02] active:scale-[0.98]`}
              style={{
                backgroundColor: pack.is_featured ? theme.colors.primaryLight : theme.colors.card,
                borderColor: pack.is_featured ? theme.colors.primary : theme.colors.border,
              }}
            >
              {pack.is_featured && (
                <div className="absolute -top-2 -right-2 text-white text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: theme.colors.primary }}>
                  {t('wallet.popular') || 'Популярний'}
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Image
                  src="/omr_coin.png"
                  alt="OMR"
                  width={24}
                  height={24}
                />
                <span className="font-bold text-lg" style={{ color: theme.colors.text }}>
                  {pack.total_coins.toLocaleString()}
                </span>
              </div>

              {pack.bonus_percent > 0 && (
                <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: theme.colors.success }}>
                  <Gift size={12} />
                  +{pack.bonus_percent}% бонус
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                  ${pack.price_usd}
                </span>
                <ExternalLink
                  size={16}
                  className="transition-colors"
                  style={{ color: theme.colors.textMuted }}
                />
              </div>

              {pack.description && (
                <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                  {pack.description}
                </p>
              )}
            </motion.button>
          ))}
        </div>

        <p className="text-xs text-center" style={{ color: theme.colors.textMuted }}>
          {t('wallet.gumroadInfo') || 'Оплата через Gumroad. Монети зараховуються автоматично.'}
        </p>
      </div>

      {/* Transaction History */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
          <History size={20} style={{ color: theme.colors.primary }} />
          {t('wallet.history') || 'Історія транзакцій'}
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-12" style={{ color: theme.colors.textMuted }}>
            <Coins size={48} className="mx-auto mb-3 opacity-30" />
            <p>{t('wallet.noTransactions') || 'Транзакцій поки немає'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                    {getTransactionIcon(tx.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: theme.colors.text }}>
                      {tx.description || tx.type}
                    </p>
                    <p className="text-xs flex items-center gap-1" style={{ color: theme.colors.textMuted }}>
                      <Clock size={12} />
                      {formatDate(tx.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold" style={{ color: getTransactionColor(tx.amount) }}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                      {tx.balance_after.toLocaleString()} OMR
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {hasMore && (
              <button
                onClick={loadMoreTransactions}
                disabled={loadingMore}
                className="w-full py-3 text-sm rounded-xl transition-colors disabled:opacity-50"
                style={{
                  color: theme.colors.primary,
                  backgroundColor: loadingMore ? 'transparent' : theme.colors.surface,
                }}
              >
                {loadingMore ? (
                  <RefreshCw className="animate-spin mx-auto" size={20} />
                ) : (
                  t('wallet.loadMore') || 'Завантажити ще'
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3 pt-4">
        <button
          onClick={() => router.push('/profile/bonuses')}
          className="relative p-4 rounded-2xl border transition-all text-left group"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          }}
        >
          <Gift className="text-blue-500 mb-2" size={24} />
          <p className="font-medium text-sm" style={{ color: theme.colors.text }}>
            {t('wallet.dailyBonus') || 'Щоденний бонус'}
          </p>
          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
            {t('wallet.dailyBonusDesc') || 'Отримуй монети щодня'}
          </p>
          <ChevronRight
            size={16}
            className="absolute bottom-4 right-4 transition-colors"
            style={{ color: theme.colors.textMuted }}
          />
        </button>

        <button
          onClick={() => router.push('/profile/referrals')}
          className="relative p-4 rounded-2xl border transition-all text-left group"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          }}
        >
          <TrendingUp className="text-cyan-500 mb-2" size={24} />
          <p className="font-medium text-sm" style={{ color: theme.colors.text }}>
            {t('wallet.referrals') || 'Реферали'}
          </p>
          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
            {t('wallet.referralsDesc') || '5% від покупок друзів'}
          </p>
          <ChevronRight
            size={16}
            className="absolute bottom-4 right-4 transition-colors"
            style={{ color: theme.colors.textMuted }}
          />
        </button>
      </div>
    </div>
  );
}
