'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminCreatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';

interface ModerationStats {
  pending_applications: number;
  pending_products: number;
  pending_payouts: number;
}

interface CommissionStats {
  total_commissions_coins: number;
  total_commissions_usd: number;
  total_creator_sales_coins: number;
  total_creator_sales_usd: number;
  total_sales_count: number;
  commission_percent: number;
  average_sale_coins: number;
}

export default function AdminCreatorsStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null);
  const [commissionStats, setCommissionStats] = useState<CommissionStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/admin');
      return;
    }
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [moderation, commission] = await Promise.all([
        adminCreatorsAPI.getModerationStats(),
        adminCreatorsAPI.getCommissionStats(),
      ]);

      setModerationStats(moderation);
      setCommissionStats(commission);
    } catch (err: any) {
      setError('Не вдалося завантажити статистику');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCoins = (coins: number) => {
    return coins.toLocaleString('uk-UA');
  };

  const formatUSD = (usd: number) => {
    return usd.toFixed(2);
  };

  if (!MARKETPLACE_ENABLED || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6 pb-28">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/admin')}
          className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2"
        >
          ← Назад до адмін-панелі
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Статистика маркетплейсу
          </h1>
          <p className="text-slate-400">Зведена інформація про креаторів та продажі</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Moderation Queue */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Черга модерації</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div
              className="bg-gradient-to-br from-yellow-900/50 to-slate-800/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 cursor-pointer hover:border-yellow-400/40 transition-colors"
              onClick={() => router.push('/admin/creators/applications')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📝</div>
                <div className="text-yellow-400 text-sm font-medium px-3 py-1 bg-yellow-500/20 rounded-lg">
                  На розгляді
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {moderationStats?.pending_applications || 0}
              </div>
              <div className="text-slate-300">Заявок на статус креатора</div>
            </div>

            <div
              className="bg-gradient-to-br from-blue-900/50 to-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 cursor-pointer hover:border-blue-400/40 transition-colors"
              onClick={() => router.push('/admin/creators/products')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📦</div>
                <div className="text-blue-400 text-sm font-medium px-3 py-1 bg-blue-500/20 rounded-lg">
                  На модерації
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {moderationStats?.pending_products || 0}
              </div>
              <div className="text-slate-300">Товарів креаторів</div>
            </div>

            <div
              className="bg-gradient-to-br from-green-900/50 to-slate-800/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 cursor-pointer hover:border-green-400/40 transition-colors"
              onClick={() => router.push('/admin/creators/payouts')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">💸</div>
                <div className="text-green-400 text-sm font-medium px-3 py-1 bg-green-500/20 rounded-lg">
                  Очікують
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {moderationStats?.pending_payouts || 0}
              </div>
              <div className="text-slate-300">Запитів на виплату</div>
            </div>
          </div>
        </div>

        {/* Commission Statistics */}
        {commissionStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Фінансова статистика</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Platform Commission */}
              <div className="bg-gradient-to-br from-purple-900/50 to-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">💰</div>
                  <div className="text-purple-400 text-sm font-medium px-3 py-1 bg-purple-500/20 rounded-lg">
                    Комісія {commissionStats.commission_percent}%
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-slate-400 text-sm mb-1">Дохід платформи</div>
                  <div className="text-4xl font-bold text-purple-400 mb-1">
                    {formatCoins(commissionStats.total_commissions_coins)} 💎
                  </div>
                  <div className="text-2xl text-slate-300">
                    ${formatUSD(commissionStats.total_commissions_usd)}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">Продажів</div>
                      <div className="text-white font-bold text-lg">
                        {commissionStats.total_sales_count}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Середній чек</div>
                      <div className="text-white font-bold text-lg">
                        {formatCoins(commissionStats.average_sale_coins)} 💎
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creator Earnings */}
              <div className="bg-gradient-to-br from-green-900/50 to-slate-800/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">👥</div>
                  <div className="text-green-400 text-sm font-medium px-3 py-1 bg-green-500/20 rounded-lg">
                    Виплачено {100 - commissionStats.commission_percent}%
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-slate-400 text-sm mb-1">Дохід креаторів</div>
                  <div className="text-4xl font-bold text-green-400 mb-1">
                    {formatCoins(commissionStats.total_creator_sales_coins)} 💎
                  </div>
                  <div className="text-2xl text-slate-300">
                    ${formatUSD(commissionStats.total_creator_sales_usd)}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <div className="text-sm text-slate-400">
                    Загальний оборот маркетплейсу
                  </div>
                  <div className="text-white font-bold text-xl mt-1">
                    $
                    {formatUSD(
                      commissionStats.total_commissions_usd +
                        commissionStats.total_creator_sales_usd
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown Chart */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Розподіл доходу</h3>

              {/* Visual Bar */}
              <div className="mb-6">
                <div className="flex h-12 rounded-lg overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold transition-all"
                    style={{
                      width: `${100 - commissionStats.commission_percent}%`,
                    }}
                  >
                    {100 - commissionStats.commission_percent}%
                  </div>
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold transition-all"
                    style={{
                      width: `${commissionStats.commission_percent}%`,
                    }}
                  >
                    {commissionStats.commission_percent}%
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded"></div>
                  <div>
                    <div className="text-white font-medium">Креатори</div>
                    <div className="text-slate-400 text-sm">
                      {formatCoins(commissionStats.total_creator_sales_coins)} 💎 ($
                      {formatUSD(commissionStats.total_creator_sales_usd)})
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded"></div>
                  <div>
                    <div className="text-white font-medium">Платформа</div>
                    <div className="text-slate-400 text-sm">
                      {formatCoins(commissionStats.total_commissions_coins)} 💎 ($
                      {formatUSD(commissionStats.total_commissions_usd)})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Швидкі дії</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/admin/creators/applications')}
              className="p-6 bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl hover:border-purple-400/40 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">📝</div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg mb-1">
                    Модерувати заявки
                  </div>
                  <div className="text-slate-400 text-sm">
                    Переглянути заявки на статус креатора
                  </div>
                </div>
                <div className="text-purple-400">→</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/creators/products')}
              className="p-6 bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl hover:border-purple-400/40 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">📦</div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg mb-1">
                    Модерувати товари
                  </div>
                  <div className="text-slate-400 text-sm">
                    Переглянути товари креаторів на модерації
                  </div>
                </div>
                <div className="text-purple-400">→</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/creators/payouts')}
              className="p-6 bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl hover:border-purple-400/40 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">💸</div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg mb-1">
                    Обробити виплати
                  </div>
                  <div className="text-slate-400 text-sm">
                    Підтвердити виплати USDT креаторам
                  </div>
                </div>
                <div className="text-purple-400">→</div>
              </div>
            </button>

            <button
              onClick={() => {
                loadStats();
              }}
              className="p-6 bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl hover:border-purple-400/40 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">🔄</div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg mb-1">
                    Оновити статистику
                  </div>
                  <div className="text-slate-400 text-sm">
                    Завантажити актуальні дані
                  </div>
                </div>
                <div className="text-purple-400">↻</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
