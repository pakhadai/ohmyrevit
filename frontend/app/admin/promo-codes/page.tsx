'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, ChevronRight, Calendar, Hash, Percent, DollarSign } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function PromoCodesManagementPage() {
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPromoCodes();
      setPromoCodes(response || []);
    } catch (error) {
      toast.error(t('admin.promo.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      {/* Заголовок та кнопку видалено, оскільки вони є в Layout */}

      {promoCodes.length === 0 ? (
        <EmptyState message={t('admin.promo.empty')} icon={Tag} />
      ) : (
        <div className="card-minimal overflow-hidden">
          <ul className="divide-y divide-border/50">
            {promoCodes.map((promo) => (
              <li
                key={promo.id}
                onClick={() => router.push(`/admin/promo-codes/${promo.id}`)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group gap-4"
              >
                <div className="flex items-center gap-4">
                    {/* Іконка типу знижки */}
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                        {promo.discount_type === 'percentage' ? <Percent size={20} /> : <DollarSign size={20} />}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg text-foreground tracking-wider bg-muted/50 px-2 py-0.5 rounded-lg border border-border/50">
                                {promo.code}
                            </span>
                            {!promo.is_active && (
                                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] uppercase font-bold tracking-wide">
                                    Inactive
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                            <span className="flex items-center gap-1">
                                <span className="font-bold text-primary">
                                    {promo.discount_type === 'percentage' ? `${promo.value}%` : `$${parseFloat(promo.value).toFixed(2)}`}
                                </span>
                                знижки
                            </span>
                            {promo.expires_at && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={10} />
                                        {new Date(promo.expires_at).toLocaleDateString()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-16 sm:pl-0">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                            <Hash size={10} /> Використано
                        </span>
                        <div className="text-sm font-medium text-foreground">
                            {promo.current_uses} <span className="text-muted-foreground">/ {promo.max_uses || '∞'}</span>
                        </div>
                    </div>

                    <div className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${
                        promo.is_active
                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                        {promo.is_active ? t('admin.promo.active') : t('admin.promo.inactive')}
                    </div>

                    <ChevronRight className="text-muted-foreground/50 group-hover:text-primary transition-colors hidden sm:block" size={20} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}