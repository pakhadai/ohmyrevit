'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';

interface CreatorBalance {
  balance_coins: number;
  balance_usd: number;
  total_sales: number;
  total_earned_coins: number;
  pending_coins: number;
}

interface ProductStats {
  total_products: number;
  draft_products: number;
  pending_products: number;
  approved_products: number;
  rejected_products: number;
  total_sales: number;
  total_revenue_coins: number;
}

interface Transaction {
  id: number;
  transaction_type: string;
  amount_coins: number;
  description: string;
  created_at: string;
}

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<CreatorBalance | null>(null);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceData, statsData, transactionsData] = await Promise.all([
        creatorsAPI.getBalance(),
        creatorsAPI.getProductStats(),
        creatorsAPI.getTransactions({ limit: 10 }),
      ]);

      setBalance(balanceData);
      setStats(statsData);
      setTransactions(transactionsData);
    } catch (err: any) {
      if (err.response?.status === 403) {
        // Не є креатором
        router.push('/become-creator');
      } else {
        setError('Не вдалося завантажити дані');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!MARKETPLACE_ENABLED || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Завантаження...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6 pb-28">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Дашборд креатора
          </h1>
          <p className="text-slate-400">Статистика продажів та баланс</p>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-900/50 to-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <div className="text-slate-400 mb-2">Доступний баланс</div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatCoins(balance?.balance_coins || 0)} 💎
            </div>
            <div className="text-lg text-slate-300">
              ${balance?.balance_usd.toFixed(2)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/50 to-slate-800/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
            <div className="text-slate-400 mb-2">Усього заробленo</div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatCoins(balance?.total_earned_coins || 0)} 💎
            </div>
            <div className="text-lg text-slate-300">
              {balance?.total_sales || 0} продажів
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/50 to-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
            <div className="text-slate-400 mb-2">Очікується</div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatCoins(balance?.pending_coins || 0)} 💎
            </div>
            <div className="text-sm text-slate-400">
              Товари на модерації
            </div>
          </div>
        </div>

        {/* Product Stats */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Товари</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {stats?.total_products || 0}
              </div>
              <div className="text-slate-400 text-sm">Усього</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {stats?.approved_products || 0}
              </div>
              <div className="text-slate-400 text-sm">Схвалено</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">
                {stats?.pending_products || 0}
              </div>
              <div className="text-slate-400 text-sm">На модерації</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-500 mb-1">
                {stats?.draft_products || 0}
              </div>
              <div className="text-slate-400 text-sm">Чернетки</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-1">
                {stats?.rejected_products || 0}
              </div>
              <div className="text-slate-400 text-sm">Відхилено</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-slate-400 text-sm">Дохід з товарів</div>
                <div className="text-2xl font-bold text-white">
                  {formatCoins(stats?.total_revenue_coins || 0)} 💎
                </div>
              </div>
              <button
                onClick={() => router.push('/creator/products')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Мої товари
              </button>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Останні транзакції</h2>

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
                  className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getTransactionIcon(tx.transaction_type)}</div>
                    <div>
                      <div className="text-white font-medium">{tx.description}</div>
                      <div className="text-slate-500 text-sm">
                        {new Date(tx.created_at).toLocaleDateString('uk-UA')}
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${getTransactionColor(tx.transaction_type)}`}>
                    {tx.amount_coins > 0 ? '+' : ''}{formatCoins(tx.amount_coins)} 💎
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/creator/transactions')}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Переглянути всі транзакції →
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/creator/payout')}
            className="py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
            disabled={(balance?.balance_coins || 0) < 3000}
          >
            💸 Запитати виплату
            {(balance?.balance_coins || 0) < 3000 && (
              <span className="block text-sm mt-1 opacity-80">
                (Мінімум: 3000 монет / $30)
              </span>
            )}
          </button>

          <button
            onClick={() => router.push('/creator/products/new')}
            className="py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            ➕ Додати новий товар
          </button>
        </div>
      </div>
    </div>
  );
}
