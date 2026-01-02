'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { creatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import {
  DollarSign, Package, TrendingUp, Eye, Download,
  Clock, CheckCircle, XCircle, FileText, ArrowRight,
  Wallet, BarChart3, Plus, AlertCircle
} from 'lucide-react';

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
  total_views: number;
  total_downloads: number;
  top_products_by_views: Array<{ id: number; views: number }>;
  top_products_by_downloads: Array<{ id: number; downloads: number }>;
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
  const { theme, isDark } = useTheme();
  const { user, refreshUser } = useAuthStore();

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
    
    // Оновлюємо дані користувача перед завантаженням дашборду
    const checkAndLoad = async () => {
      try {
        // Оновлюємо дані користувача для актуального статусу креатора
        await refreshUser();
        
        // Перевіряємо статус креатора
        const status = await creatorsAPI.getStatus();
        if (!status.is_creator) {
          setError('У вас немає доступу до кабінету креатора. Будь ласка, подайте заявку на статус креатора.');
          setTimeout(() => {
            router.push('/become-creator');
          }, 2000);
          setLoading(false);
          return;
        }
        
        // Завантажуємо дані дашборду
        await loadData();
      } catch (err: any) {
        console.error('Error checking creator status:', err);
        if (err.response?.status === 403) {
          setError('У вас немає доступу до кабінету креатора. Будь ласка, подайте заявку на статус креатора.');
          setTimeout(() => {
            router.push('/become-creator');
          }, 2000);
        } else {
          setError('Не вдалося перевірити статус креатора');
        }
        setLoading(false);
      }
    };
    
    checkAndLoad();
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
      console.error('Error loading creator dashboard data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      
      if (err.response?.status === 403) {
        setError('У вас немає доступу до кабінету креатора. Будь ласка, подайте заявку на статус креатора.');
        setTimeout(() => {
          router.push('/become-creator');
        }, 2000);
      } else {
        const errorMessage = err.response?.data?.detail || err.message || 'Не вдалося завантажити дані';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!MARKETPLACE_ENABLED || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.purpleLight }}>
            <div className="animate-spin w-8 h-8 border-4 border-current rounded-full"
              style={{ borderTopColor: 'transparent', color: theme.colors.purple }} />
          </div>
          <p style={{ color: theme.colors.text }}>Завантаження...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ background: theme.colors.bgGradient }}>
        <div className="max-w-4xl mx-auto pt-20">
          <div className="p-6 rounded-[24px] text-center"
            style={{
              backgroundColor: theme.colors.errorLight,
              border: `1px solid ${theme.colors.error}`,
            }}>
            <AlertCircle size={48} style={{ color: theme.colors.error }} className="mx-auto mb-4" />
            <p style={{ color: theme.colors.error }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCoins = (coins: number) => coins.toLocaleString('uk-UA');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale': return <TrendingUp size={16} style={{ color: theme.colors.success }} />;
      case 'payout': return <Wallet size={16} style={{ color: theme.colors.info }} />;
      case 'commission': return <DollarSign size={16} style={{ color: theme.colors.warning }} />;
      default: return <DollarSign size={16} style={{ color: theme.colors.textMuted }} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'sale': return theme.colors.success;
      case 'payout': return theme.colors.info;
      case 'commission': return theme.colors.warning;
      default: return theme.colors.text;
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-7xl mx-auto pt-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text }}>
            Кабінет креатора
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Керуйте своїми товарами та переглядайте статистику
          </p>
        </div>

        {/* Balance Card */}
        <div
          className="rounded-[32px] p-8 mb-8 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.purple} 0%, ${theme.colors.pink} 100%)`,
            boxShadow: theme.shadows.xl,
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Wallet size={28} color="#FFFFFF" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Ваш баланс</p>
                <p className="text-white text-3xl font-bold">
                  {formatCoins(balance?.balance_coins || 0)} OMR
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-[20px]" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <p className="text-white/70 text-xs mb-1">В доларах</p>
                <p className="text-white text-xl font-bold">
                  ${(balance?.balance_usd || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-[20px]" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <p className="text-white/70 text-xs mb-1">Продажів</p>
                <p className="text-white text-xl font-bold">
                  {balance?.total_sales || 0}
                </p>
              </div>
              <div className="p-4 rounded-[20px] col-span-2 md:col-span-1" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <p className="text-white/70 text-xs mb-1">Заробіток</p>
                <p className="text-white text-xl font-bold">
                  {formatCoins(balance?.total_earned_coins || 0)} OMR
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                href="/creator/payout"
                className="flex-1 py-3 px-6 rounded-full font-semibold text-center transition-all hover:scale-105"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: theme.colors.purple,
                }}
              >
                Вивести кошти
              </Link>
              <Link
                href="/creator/transactions"
                className="flex-1 py-3 px-6 rounded-full font-semibold text-center transition-all hover:scale-105"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                Історія
              </Link>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
              transform: 'translate(30%, -30%)',
            }} />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/creator/products"
            className="p-6 rounded-[24px] transition-all hover:scale-105"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.md,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-[16px] flex items-center justify-center"
                style={{ backgroundColor: theme.colors.blueLight }}>
                <Package size={24} style={{ color: theme.colors.blue }} />
              </div>
              <ArrowRight size={20} style={{ color: theme.colors.textMuted }} />
            </div>
            <p className="font-bold text-lg mb-1" style={{ color: theme.colors.text }}>
              Мої товари
            </p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {stats?.total_products || 0} товарів
            </p>
          </Link>

          <Link
            href="/creator/products?action=create"
            className="p-6 rounded-[24px] transition-all hover:scale-105"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.md,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-[16px] flex items-center justify-center"
                style={{ backgroundColor: theme.colors.successLight }}>
                <Plus size={24} style={{ color: theme.colors.success }} />
              </div>
              <ArrowRight size={20} style={{ color: theme.colors.textMuted }} />
            </div>
            <p className="font-bold text-lg mb-1" style={{ color: theme.colors.text }}>
              Новий товар
            </p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              Завантажити плагін
            </p>
          </Link>

          <div
            className="p-6 rounded-[24px]"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.md,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-[16px] flex items-center justify-center"
                style={{ backgroundColor: theme.colors.purpleLight }}>
                <BarChart3 size={24} style={{ color: theme.colors.purple }} />
              </div>
            </div>
            <p className="font-bold text-lg mb-1" style={{ color: theme.colors.text }}>
              Статистика
            </p>
            <div className="flex items-center gap-4 text-sm" style={{ color: theme.colors.textSecondary }}>
              <span className="flex items-center gap-1">
                <Eye size={14} /> {stats?.total_views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Download size={14} /> {stats?.total_downloads || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Product Stats */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
              Статус товарів
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                className="p-5 rounded-[24px]"
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText size={20} style={{ color: theme.colors.textMuted }} />
                  <p className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>
                    Чернетки
                  </p>
                </div>
                <p className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                  {stats?.draft_products || 0}
                </p>
              </div>

              <div
                className="p-5 rounded-[24px]"
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Clock size={20} style={{ color: theme.colors.warning }} />
                  <p className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>
                    На модерації
                  </p>
                </div>
                <p className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                  {stats?.pending_products || 0}
                </p>
              </div>

              <div
                className="p-5 rounded-[24px]"
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={20} style={{ color: theme.colors.success }} />
                  <p className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>
                    Опубліковано
                  </p>
                </div>
                <p className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                  {stats?.approved_products || 0}
                </p>
              </div>

              <div
                className="p-5 rounded-[24px]"
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <XCircle size={20} style={{ color: theme.colors.error }} />
                  <p className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>
                    Відхилено
                  </p>
                </div>
                <p className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                  {stats?.rejected_products || 0}
                </p>
              </div>
            </div>

            {/* Revenue Stats */}
            <div
              className="p-6 rounded-[24px]"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>
                Дохід
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>
                    Всього продажів
                  </p>
                  <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                    {stats?.total_sales || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>
                    Заробіток
                  </p>
                  <p className="text-2xl font-bold" style={{ color: theme.colors.purple }}>
                    {formatCoins(stats?.total_revenue_coins || 0)} OMR
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
              Останні транзакції
            </h2>

            <div
              className="rounded-[24px] p-4 space-y-2"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p style={{ color: theme.colors.textMuted }}>
                    Поки немає транзакцій
                  </p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-[16px] transition-all"
                    style={{
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-1">
                          {getTransactionIcon(tx.transaction_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: theme.colors.text }}>
                            {tx.description}
                          </p>
                          <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                            {formatDate(tx.created_at)}
                          </p>
                        </div>
                      </div>
                      <p
                        className="font-bold text-sm whitespace-nowrap"
                        style={{ color: getTransactionColor(tx.transaction_type) }}
                      >
                        {tx.amount_coins >= 0 ? '+' : ''}{formatCoins(tx.amount_coins)}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {transactions.length > 0 && (
                <Link
                  href="/creator/transactions"
                  className="block text-center py-3 mt-4 rounded-[16px] font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.purple,
                  }}
                >
                  Переглянути всі
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
