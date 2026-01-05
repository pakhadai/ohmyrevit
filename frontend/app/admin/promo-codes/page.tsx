'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, ChevronRight, Calendar, Hash, Percent, DollarSign } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';

export default function PromoCodesManagementPage() {
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { theme } = useTheme();

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
      {promoCodes.length === 0 ? (
        <EmptyState message={t('admin.promo.empty')} icon={Tag} />
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
            {promoCodes.map((promo, index) => (
              <li
                key={promo.id}
                onClick={() => router.push(`/admin/promo-codes/${promo.id}`)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between transition-colors cursor-pointer group gap-4"
                style={{
                  borderBottom:
                    index < promoCodes.length - 1 ? `1px solid ${theme.colors.border}80` : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.colors.surface}4d`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Іконка типу знижки */}
                  <div
                    className="w-12 h-12 flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.purpleLight,
                      color: theme.colors.purple,
                      borderRadius: theme.radius.xl,
                    }}
                  >
                    {promo.discount_type === 'percentage' ? <Percent size={20} /> : <DollarSign size={20} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono font-bold text-lg tracking-wider px-2 py-0.5"
                        style={{
                          backgroundColor: `${theme.colors.surface}80`,
                          color: theme.colors.text,
                          borderRadius: theme.radius.lg,
                          border: `1px solid ${theme.colors.border}80`,
                        }}
                      >
                        {promo.code}
                      </span>
                      {!promo.is_active && (
                        <span
                          className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide"
                          style={{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.textMuted,
                            borderRadius: theme.radius.full,
                          }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-3 text-xs mt-1.5"
                      style={{ color: theme.colors.textMuted }}
                    >
                      <span className="flex items-center gap-1">
                        <span className="font-bold" style={{ color: theme.colors.primary }}>
                          {promo.discount_type === 'percentage' ? `${promo.value}%` : `$${parseFloat(promo.value).toFixed(2)}`}
                        </span>
                        знижки
                      </span>
                      {promo.expires_at && (
                        <>
                          <span
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: `${theme.colors.textMuted}80` }}
                          ></span>
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
                    <span
                      className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"
                      style={{ color: theme.colors.textMuted }}
                    >
                      <Hash size={10} /> Використано
                    </span>
                    <div className="text-sm font-medium" style={{ color: theme.colors.text }}>
                      {promo.current_uses} <span style={{ color: theme.colors.textMuted }}>/ {promo.max_uses || '∞'}</span>
                    </div>
                  </div>

                  <div
                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: promo.is_active ? theme.colors.successLight : theme.colors.surface,
                      color: promo.is_active ? theme.colors.success : theme.colors.textMuted,
                      border: `1px solid ${promo.is_active ? theme.colors.success + '33' : theme.colors.border}`,
                      borderRadius: theme.radius.full,
                    }}
                  >
                    {promo.is_active ? t('admin.promo.active') : t('admin.promo.inactive')}
                  </div>

                  <ChevronRight
                    className="hidden sm:block group-hover:scale-110 transition-transform"
                    size={20}
                    style={{ color: `${theme.colors.textMuted}80` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}