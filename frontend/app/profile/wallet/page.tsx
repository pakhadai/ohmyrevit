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

export default function WalletPage() {
  const { user, updateBalance } = useAuthStore();

  const [balance, setBalance] = useState(0);
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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
        return <Coins className="text-muted-foreground" size={20} />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'text-green-500' : 'text-red-500';
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
    // Додаємо user_id до URL Gumroad
    const url = `${pack.gumroad_url}?user_id=${user?.id}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-14 pb-24 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="text-primary" size={28} />
          {t('wallet.title') || 'Гаманець'}
        </h1>
        <button
          onClick={fetchWalletInfo}
          className="p-2 hover:bg-muted rounded-xl transition-colors"
        >
          <RefreshCw size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-white shadow-xl"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <p className="text-white/80 text-sm mb-1">{t('wallet.yourBalance') || 'Ваш баланс'}</p>

          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/omr_coin.png"
              alt="OMR Coin"
              width={48}
              height={48}
              className="drop-shadow-lg"
            />
            <div>
              <span className="text-4xl font-bold tracking-tight">
                {balance.toLocaleString()}
              </span>
              <span className="text-xl ml-2 opacity-80">OMR</span>
            </div>
          </div>

          <p className="text-white/70 text-sm">
            ≈ ${(balance / 100).toFixed(2)} USD
          </p>
        </div>

        {/* Quick stats */}
        <div className="relative z-10 mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
          <div>
            <p className="text-white/60">{t('wallet.rate') || 'Курс'}</p>
            <p className="font-medium">100 OMR = $1</p>
          </div>
          <div className="text-right">
            <p className="text-white/60">{t('wallet.streak') || 'Streak'}</p>
            <p className="font-medium flex items-center gap-1 justify-end">
              <Sparkles size={14} />
              {user?.bonus_streak || 0} {t('wallet.days') || 'днів'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Coin Packs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
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
              className={`relative p-4 rounded-2xl border transition-all text-left group hover:scale-[1.02] active:scale-[0.98] ${
                pack.is_featured
                  ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50'
                  : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              {pack.is_featured && (
                <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
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
                <span className="font-bold text-lg text-foreground">
                  {pack.total_coins.toLocaleString()}
                </span>
              </div>

              {pack.bonus_percent > 0 && (
                <div className="text-xs text-green-500 font-medium mb-1 flex items-center gap-1">
                  <Gift size={12} />
                  +{pack.bonus_percent}% бонус
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-xl font-bold text-primary">
                  ${pack.price_usd}
                </span>
                <ExternalLink
                  size={16}
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                />
              </div>

              {pack.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {pack.description}
                </p>
              )}
            </motion.button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {t('wallet.gumroadInfo') || 'Оплата через Gumroad. Монети зараховуються автоматично.'}
        </p>
      </div>

      {/* Transaction History */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <History size={20} className="text-primary" />
          {t('wallet.history') || 'Історія транзакцій'}
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
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
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
                >
                  <div className="p-2 bg-muted rounded-lg">
                    {getTransactionIcon(tx.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {tx.description || tx.type}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(tx.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold ${getTransactionColor(tx.amount)}`}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
                className="w-full py-3 text-sm text-primary hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
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
          onClick={() => router.push('/profile/bonus')}
          className="p-4 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all text-left group"
        >
          <Gift className="text-blue-500 mb-2" size={24} />
          <p className="font-medium text-sm text-foreground">
            {t('wallet.dailyBonus') || 'Щоденний бонус'}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('wallet.dailyBonusDesc') || 'Отримуй монети щодня'}
          </p>
          <ChevronRight
            size={16}
            className="absolute bottom-4 right-4 text-muted-foreground group-hover:text-primary transition-colors"
          />
        </button>

        <button
          onClick={() => router.push('/profile/referrals')}
          className="p-4 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all text-left group"
        >
          <TrendingUp className="text-cyan-500 mb-2" size={24} />
          <p className="font-medium text-sm text-foreground">
            {t('wallet.referrals') || 'Реферали'}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('wallet.referralsDesc') || '5% від покупок друзів'}
          </p>
          <ChevronRight
            size={16}
            className="absolute bottom-4 right-4 text-muted-foreground group-hover:text-primary transition-colors"
          />
        </button>
      </div>
    </div>
  );
}