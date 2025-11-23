'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronRight, Filter, User, Calendar, CreditCard } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function OrdersManagementPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { t } = useTranslation();

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
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
      return t(`admin.orders.statuses.${status}`) || status;
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-foreground">{t('admin.sidebar.orders')}</h2>

        {/* Фільтр */}
        <div className="relative w-full sm:w-64">
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3.5 bg-card border border-border/50 rounded-2xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all shadow-sm appearance-none cursor-pointer"
            >
                <option value="">{t('admin.orders.allOrders')}</option>
                <option value="pending">{t('admin.orders.statuses.pending')}</option>
                <option value="paid">{t('admin.orders.statuses.paid')}</option>
                <option value="failed">{t('admin.orders.statuses.failed')}</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} />
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState message={t('admin.orders.empty')} icon={ShoppingCart} />
      ) : (
        <div className="card-minimal overflow-hidden">
          <ul className="divide-y divide-border/50">
            {orders.map((order) => (
              <li
                key={order.id}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group gap-4"
              >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm">
                        #{order.id}
                    </div>

                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <User size={14} className="text-muted-foreground" />
                            {order.user.first_name} {order.user.last_name}
                            <span className="text-muted-foreground text-xs font-normal">(@{order.user.username || 'N/A'})</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(order.created_at).toLocaleString()}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                            <span className="flex items-center gap-1">
                                <CreditCard size={12} />
                                {order.items_count} items
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pl-16 sm:pl-0">
                    <div className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusStyles(order.status)}`}>
                        {getStatusLabel(order.status)}
                    </div>

                    <div className="text-right">
                        <span className="block text-lg font-bold text-foreground">${order.final_total.toFixed(2)}</span>
                        {order.discount_amount > 0 && (
                            <span className="text-xs text-green-500 font-medium">Save ${order.discount_amount.toFixed(2)}</span>
                        )}
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