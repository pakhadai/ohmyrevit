'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, ChevronRight, Percent, DollarSign, Gift, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useTheme } from '@/lib/theme';

interface CoinPack {
  id: number;
  name: string;
  price_usd: number;
  coins_amount: number;
  bonus_percent: number;
  total_coins: number;
  stripe_price_id: string;
  description?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export default function CoinPacksManagementPage() {
  const router = useRouter();
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const { t } = useTranslation();
  const { theme } = useTheme();

  const fetchCoinPacks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getCoinPacks(showInactive);
      setCoinPacks(response.packs || response || []);
    } catch (error) {
      toast.error(t('admin.coinPacks.loadError', 'Помилка завантаження пакетів'));
    } finally {
      setLoading(false);
    }
  }, [t, showInactive]);

  useEffect(() => {
    fetchCoinPacks();
  }, [fetchCoinPacks]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
            {t('admin.coinPacks.pageTitle', 'Пакети монет')}
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
            {t('admin.coinPacks.subtitle', 'Керування пакетами поповнення балансу')}
          </p>
        </div>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            color: theme.colors.text,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface;
          }}
        >
          {showInactive ? (
            <ToggleRight size={18} style={{ color: theme.colors.primary }} />
          ) : (
            <ToggleLeft size={18} />
          )}
          <span>
            {showInactive
              ? t('admin.coinPacks.hideInactive', 'Сховати неактивні')
              : t('admin.coinPacks.showInactive', 'Показати неактивні')}
          </span>
        </button>
      </div>

      {coinPacks.length === 0 ? (
        <EmptyState message={t('admin.coinPacks.empty', 'Немає пакетів монет')} icon={Coins} />
      ) : (
        <div
          className="overflow-hidden"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.md,
          }}
        >
          <ul>
            {coinPacks.map((pack, index) => (
              <li
                key={pack.id}
                onClick={() => router.push(`/admin/coin-packs/${pack.id}`)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between transition-colors cursor-pointer group gap-4"
                style={{
                  opacity: pack.is_active ? 1 : 0.5,
                  borderBottom:
                    index < coinPacks.length - 1 ? `1px solid ${theme.colors.border}80` : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.colors.surface}4d`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 flex items-center justify-center"
                    style={{
                      background: pack.is_featured
                        ? `linear-gradient(135deg, ${theme.colors.orange}33, ${theme.colors.orangeLight})`
                        : theme.colors.primaryLight,
                      borderRadius: theme.radius.xl,
                    }}
                  >
                    <Image src="/omr_coin.png" alt="OMR" width={32} height={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                        {pack.name}
                      </h3>
                      {pack.is_featured && (
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1"
                          style={{
                            backgroundColor: theme.colors.orangeLight,
                            color: theme.colors.orange,
                          }}
                        >
                          <Sparkles size={10} />
                          Featured
                        </span>
                      )}
                      {!pack.is_active && (
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: theme.colors.errorLight,
                            color: theme.colors.error,
                          }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: theme.colors.textMuted }}>
                      {pack.description || pack.stripe_price_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 text-sm">
                    <div
                      className="flex items-center gap-1.5"
                      style={{ color: theme.colors.textMuted }}
                    >
                      <DollarSign size={14} />
                      <span className="font-medium" style={{ color: theme.colors.text }}>
                        ${pack.price_usd}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5"
                      style={{ color: theme.colors.textMuted }}
                    >
                      <Coins size={14} />
                      <span className="font-medium" style={{ color: theme.colors.text }}>
                        {pack.coins_amount.toLocaleString()}
                      </span>
                    </div>
                    {pack.bonus_percent > 0 && (
                      <div
                        className="flex items-center gap-1.5"
                        style={{ color: theme.colors.success }}
                      >
                        <Gift size={14} />
                        <span className="font-medium">+{pack.bonus_percent}%</span>
                      </div>
                    )}
                    <div
                      className="flex items-center gap-1.5 px-2 py-1"
                      style={{
                        backgroundColor: theme.colors.primaryLight,
                        borderRadius: theme.radius.lg,
                      }}
                    >
                      <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                        Всього:
                      </span>
                      <span className="font-bold" style={{ color: theme.colors.primary }}>
                        {pack.total_coins.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="group-hover:scale-110 transition-transform"
                    style={{ color: theme.colors.textMuted }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="hidden lg:block">
        <button
          onClick={() => router.push('/admin/coin-packs/new')}
          className="px-6 py-3 flex items-center gap-2 font-medium transition-all"
          style={{
            backgroundColor: theme.colors.primary,
            color: '#fff',
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.md,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = theme.shadows.lg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = theme.shadows.md;
          }}
        >
          <Coins size={20} />
          {t('admin.coinPacks.create', 'Створити пакет')}
        </button>
      </div>
    </div>
  );
}
