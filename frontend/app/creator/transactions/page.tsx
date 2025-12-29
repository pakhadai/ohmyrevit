'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTheme } from '@/lib/theme';

interface Transaction {
  id: number;
  transaction_type: string;
  amount_coins: number;
  description: string;
  created_at: string;
}

export default function CreatorTransactionsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/');
      return;
    }
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await creatorsAPI.getTransactions({ limit, offset: 0 });
      setTransactions(data);
      setHasMore(data.length === limit);
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/become-creator');
      } else {
        setError('Не вдалося завантажити транзакції');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const data = await creatorsAPI.getTransactions({
        limit,
        offset: transactions.length,
      });
      setTransactions([...transactions, ...data]);
      setHasMore(data.length === limit);
    } catch (err: any) {
      setError('Не вдалося завантажити більше транзакцій');
    } finally {
      setLoadingMore(false);
    }
  };

  const formatCoins = (coins: number) => {
    return coins.toLocaleString('uk-UA');
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'sale':
        return theme.colors.green;
      case 'commission':
        return theme.colors.orange;
      case 'payout':
        return theme.colors.blue;
      case 'payout_refund':
        return theme.colors.yellow;
      default:
        return theme.colors.textMuted;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return '💰';
      case 'commission':
        return '📊';
      case 'payout':
        return '💸';
      case 'payout_refund':
        return '↩️';
      default:
        return '•';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'sale':
        return 'Продаж';
      case 'commission':
        return 'Комісія';
      case 'payout':
        return 'Виплата';
      case 'payout_refund':
        return 'Повернення';
      default:
        return type;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'sale':
        return { bg: theme.colors.greenLight, border: theme.colors.green + '30' };
      case 'commission':
        return { bg: theme.colors.orangeLight, border: theme.colors.orange + '30' };
      case 'payout':
        return { bg: theme.colors.blueLight, border: theme.colors.blue + '30' };
      case 'payout_refund':
        return { bg: theme.colors.yellowLight, border: theme.colors.yellow + '30' };
      default:
        return { bg: theme.colors.surface + '80', border: theme.colors.textMuted + '40' };
    }
  };

  if (!MARKETPLACE_ENABLED || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
        <div style={{ color: theme.colors.text }} className="text-xl">Завантаження...</div>
      </div>
    );
  }

  // Calculate stats
  const stats = transactions.reduce(
    (acc, tx) => {
      if (tx.transaction_type === 'sale') {
        acc.totalEarned += tx.amount_coins;
        acc.salesCount++;
      } else if (tx.transaction_type === 'commission') {
        acc.totalCommission += Math.abs(tx.amount_coins);
      } else if (tx.transaction_type === 'payout' && tx.amount_coins < 0) {
        acc.totalPayout += Math.abs(tx.amount_coins);
      }
      return acc;
    },
    { totalEarned: 0, salesCount: 0, totalCommission: 0, totalPayout: 0 }
  );

  return (
    <div className="min-h-screen p-6 pb-28" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/creator/dashboard')}
          className="mb-6 flex items-center gap-2 transition-colors hover:opacity-80"
          style={{ color: theme.colors.purple }}
        >
          ← Назад до дашборду
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Історія транзакцій
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>Всі операції з вашим балансом</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div
            className="backdrop-blur-sm p-4"
            style={{
              backgroundColor: theme.colors.greenLight,
              border: `1px solid ${theme.colors.green}30`,
              borderRadius: theme.radius.xl
            }}
          >
            <div className="text-sm mb-1" style={{ color: theme.colors.green }}>Заroблено</div>
            <div className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {formatCoins(stats.totalEarned)} 💎
            </div>
          </div>
          <div
            className="backdrop-blur-sm p-4"
            style={{
              backgroundColor: theme.colors.orangeLight,
              border: `1px solid ${theme.colors.orange}30`,
              borderRadius: theme.radius.xl
            }}
          >
            <div className="text-sm mb-1" style={{ color: theme.colors.orange }}>Комісія</div>
            <div className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {formatCoins(stats.totalCommission)} 💎
            </div>
          </div>
          <div
            className="backdrop-blur-sm p-4"
            style={{
              backgroundColor: theme.colors.blueLight,
              border: `1px solid ${theme.colors.blue}30`,
              borderRadius: theme.radius.xl
            }}
          >
            <div className="text-sm mb-1" style={{ color: theme.colors.blue }}>Виплачено</div>
            <div className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {formatCoins(stats.totalPayout)} 💎
            </div>
          </div>
          <div
            className="backdrop-blur-sm p-4"
            style={{
              backgroundColor: theme.colors.purpleLight,
              border: `1px solid ${theme.colors.purple}30`,
              borderRadius: theme.radius.xl
            }}
          >
            <div className="text-sm mb-1" style={{ color: theme.colors.purple }}>Продажів</div>
            <div className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {stats.salesCount}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div
          className="backdrop-blur-sm p-6"
          style={{
            backgroundColor: theme.colors.card + '80',
            border: `1px solid ${theme.colors.purple}30`,
            borderRadius: theme.radius['2xl']
          }}
        >
          {error && (
            <div
              className="p-4 mb-6"
              style={{
                backgroundColor: theme.colors.errorLight,
                border: `1px solid ${theme.colors.error}30`,
                borderRadius: theme.radius.lg
              }}
            >
              <p className="text-sm" style={{ color: theme.colors.error }}>{error}</p>
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="text-center py-12" style={{ color: theme.colors.textMuted }}>
              <div className="text-6xl mb-4">📊</div>
              <p>Поки що немає транзакцій</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const bgColors = getBgColor(tx.transaction_type);
                return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4"
                  style={{
                    backgroundColor: bgColors.bg,
                    border: `1px solid ${bgColors.border}`,
                    borderRadius: theme.radius.lg
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{getTransactionIcon(tx.transaction_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className="px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: getTransactionColor(tx.transaction_type),
                            borderRadius: theme.radius.md
                          }}
                        >
                          {getTransactionLabel(tx.transaction_type)}
                        </span>
                        <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                          #{tx.id}
                        </span>
                      </div>
                      <div className="font-medium mb-1" style={{ color: theme.colors.text }}>{tx.description}</div>
                      <div className="text-sm" style={{ color: theme.colors.textMuted }}>
                        {new Date(tx.created_at).toLocaleString('uk-UA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: getTransactionColor(tx.transaction_type) }}>
                      {tx.amount_coins > 0 ? '+' : ''}
                      {formatCoins(tx.amount_coins)} 💎
                    </div>
                    <div className="text-sm" style={{ color: theme.colors.textMuted }}>
                      ${(Math.abs(tx.amount_coins) / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && transactions.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-3 font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, ${theme.colors.purple}, ${theme.colors.pink})`,
                  color: '#FFFFFF',
                  borderRadius: theme.radius.lg
                }}
              >
                {loadingMore ? 'Завантаження...' : 'Завантажити ще'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
