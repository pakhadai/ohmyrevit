'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronRight, Filter, User, Calendar, CreditCard } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';

export default function OrdersManagementPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { t } = useTranslation();
  const { theme } = useTheme();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await adminAPI.getOrders(params);
      setOrders(response.orders || []);
    } catch (error) {
      toast.error(t('admin.orders.loadError'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          backgroundColor: theme.colors.successLight,
          color: theme.colors.success,
          border: `1px solid ${theme.colors.success}33`,
        };
      case 'pending':
        return {
          backgroundColor: theme.colors.warningLight,
          color: theme.colors.warning,
          border: `1px solid ${theme.colors.warning}33`,
        };
      case 'failed':
        return {
          backgroundColor: theme.colors.errorLight,
          color: theme.colors.error,
          border: `1px solid ${theme.colors.error}33`,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          color: theme.colors.textMuted,
          border: `1px solid ${theme.colors.border}`,
        };
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`admin.orders.statuses.${status}`) || status;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
          {t('admin.sidebar.orders')}
        </h2>

        {/* Фільтр */}
        <div className="relative w-full sm:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3.5 outline-none transition-all shadow-sm appearance-none cursor-pointer"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}80`,
              borderRadius: theme.radius['2xl'],
              color: theme.colors.text,
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
              e.target.style.borderColor = `${theme.colors.primary}4d`;
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = theme.shadows.sm;
              e.target.style.borderColor = `${theme.colors.border}80`;
            }}
          >
            <option value="">{t('admin.orders.allOrders')}</option>
            <option value="pending">{t('admin.orders.statuses.pending')}</option>
            <option value="paid">{t('admin.orders.statuses.paid')}</option>
            <option value="failed">{t('admin.orders.statuses.failed')}</option>
          </select>
          <Filter
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            size={20}
            style={{ color: theme.colors.textMuted }}
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState message={t('admin.orders.empty')} icon={ShoppingCart} />
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
            {orders.map((order, index) => (
              <li
                key={order.id}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between transition-colors cursor-pointer group gap-4"
                style={{
                  borderBottom:
                    index < orders.length - 1 ? `1px solid ${theme.colors.border}80` : 'none',
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
                    className="w-12 h-12 flex items-center justify-center font-bold text-sm"
                    style={{
                      backgroundColor: theme.colors.primaryLight,
                      color: theme.colors.primary,
                      borderRadius: theme.radius.xl,
                    }}
                  >
                    #{order.id}
                  </div>

                  <div>
                    <div
                      className="flex items-center gap-2 text-sm font-medium"
                      style={{ color: theme.colors.text }}
                    >
                      <User size={14} style={{ color: theme.colors.textMuted }} />
                      {order.user.first_name} {order.user.last_name}
                      <span
                        className="text-xs font-normal"
                        style={{ color: theme.colors.textMuted }}
                      >
                        (@{order.user.username || 'N/A'})
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 text-xs mt-1"
                      style={{ color: theme.colors.textMuted }}
                    >
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: `${theme.colors.textMuted}80` }}
                      ></span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={12} />
                        {order.items_count} items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pl-16 sm:pl-0">
                  <div
                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full"
                    style={getStatusStyles(order.status)}
                  >
                    {getStatusLabel(order.status)}
                  </div>

                  <div className="text-right">
                    <span
                      className="block text-lg font-bold"
                      style={{ color: theme.colors.text }}
                    >
                      ${order.final_total.toFixed(2)}
                    </span>
                    {order.discount_amount > 0 && (
                      <span
                        className="text-xs font-medium"
                        style={{ color: theme.colors.success }}
                      >
                        Save ${order.discount_amount.toFixed(2)}
                      </span>
                    )}
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
