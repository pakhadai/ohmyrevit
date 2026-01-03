'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, ChevronRight, Percent, DollarSign, Gift, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

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
          <h1 className="text-2xl font-bold text-foreground">{t('admin.coinPacks.pageTitle', 'Пакети монет')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('admin.coinPacks.subtitle', 'Керування пакетами поповнення балансу')}</p>
        </div>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          {showInactive ? <ToggleRight size={18} className="text-primary" /> : <ToggleLeft size={18} />}
          <span>{showInactive ? t('admin.coinPacks.hideInactive', 'Сховати неактивні') : t('admin.coinPacks.showInactive', 'Показати неактивні')}</span>
        </button>
      </div>

      {coinPacks.length === 0 ? (
        <EmptyState
          message={t('admin.coinPacks.empty', 'Немає пакетів монет')}
          icon={Coins}
        />
      ) : (
        <div className="card-minimal overflow-hidden">
          <ul className="divide-y divide-border/50">
            {coinPacks.map((pack) => (
              <li
                key={pack.id}
                onClick={() => router.push(`/admin/coin-packs/${pack.id}`)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group gap-4 ${!pack.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${pack.is_featured ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20' : 'bg-primary/10'}`}>
                    <Image src="/omr_coin.png" alt="OMR" width={32} height={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{pack.name}</h3>
                      {pack.is_featured && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-600 rounded-full flex items-center gap-1">
                          <Sparkles size={10} />
                          Featured
                        </span>
                      )}
                      {!pack.is_active && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-500 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {pack.description || pack.stripe_price_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign size={14} />
                      <span className="font-medium text-foreground">${pack.price_usd}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Coins size={14} />
                      <span className="font-medium text-foreground">{pack.coins_amount.toLocaleString()}</span>
                    </div>
                    {pack.bonus_percent > 0 && (
                      <div className="flex items-center gap-1.5 text-green-500">
                        <Gift size={14} />
                        <span className="font-medium">+{pack.bonus_percent}%</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-lg">
                      <span className="text-xs text-muted-foreground">Всього:</span>
                      <span className="font-bold text-primary">{pack.total_coins.toLocaleString()}</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="hidden lg:block">
        <button
          onClick={() => router.push('/admin/coin-packs/new')}
          className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <Coins size={20} />
          {t('admin.coinPacks.create', 'Створити пакет')}
        </button>
      </div>
    </div>
  );
}