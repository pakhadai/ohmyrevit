'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';

interface Transaction {
  id: number;
  transaction_type: string;
  amount_coins: number;
  description: string;
  created_at: string;
}

export default function CreatorTransactionsPage() {
  const router = useRouter();
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
        return 'text-green-400';
      case 'commission':
        return 'text-orange-400';
      case 'payout':
        return 'text-blue-400';
      case 'payout_refund':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
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
        return 'bg-green-500/10 border-green-500/20';
      case 'commission':
        return 'bg-orange-500/10 border-orange-500/20';
      case 'payout':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'payout_refund':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-slate-900/50 border-slate-700';
    }
  };

  if (!MARKETPLACE_ENABLED || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Завантаження...</div>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6 pb-28">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/creator/dashboard')}
          className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2"
        >
          ← Назад до дашборду
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Історія транзакцій
          </h1>
          <p className="text-slate-400">Всі операції з вашим балансом</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-900/30 backdrop-blur-sm border border-green-500/20 rounded-xl p-4">
            <div className="text-green-400 text-sm mb-1">Заroблено</div>
            <div className="text-2xl font-bold text-white">
              {formatCoins(stats.totalEarned)} 💎
            </div>
          </div>
          <div className="bg-orange-900/30 backdrop-blur-sm border border-orange-500/20 rounded-xl p-4">
            <div className="text-orange-400 text-sm mb-1">Комісія</div>
            <div className="text-2xl font-bold text-white">
              {formatCoins(stats.totalCommission)} 💎
            </div>
          </div>
          <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
            <div className="text-blue-400 text-sm mb-1">Виплачено</div>
            <div className="text-2xl font-bold text-white">
              {formatCoins(stats.totalPayout)} 💎
            </div>
          </div>
          <div className="bg-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
            <div className="text-purple-400 text-sm mb-1">Продажів</div>
            <div className="text-2xl font-bold text-white">
              {stats.salesCount}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-6xl mb-4">📊</div>
              <p>Поки що немає транзакцій</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${getBgColor(
                    tx.transaction_type
                  )}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{getTransactionIcon(tx.transaction_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTransactionColor(tx.transaction_type)}`}>
                          {getTransactionLabel(tx.transaction_type)}
                        </span>
                        <span className="text-slate-500 text-sm">
                          #{tx.id}
                        </span>
                      </div>
                      <div className="text-white font-medium mb-1">{tx.description}</div>
                      <div className="text-slate-500 text-sm">
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
                    <div className={`text-xl font-bold ${getTransactionColor(tx.transaction_type)}`}>
                      {tx.amount_coins > 0 ? '+' : ''}
                      {formatCoins(tx.amount_coins)} 💎
                    </div>
                    <div className="text-slate-500 text-sm">
                      ${(Math.abs(tx.amount_coins) / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && transactions.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
