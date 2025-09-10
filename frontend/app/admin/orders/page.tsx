# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronRight } from 'lucide-react';
// OLD: import { adminApi } from '@/lib/api/admin';
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

  const statusMap: { [key: string]: { text: string; className: string } } = {
    paid: { text: t('admin.orders.statuses.paid'), className: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' },
    pending: { text: t('admin.orders.statuses.pending'), className: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' },
    failed: { text: t('admin.orders.statuses.failed'), className: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' },
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
// OLD:       const response = await adminApi.getOrders(params);
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">{t('admin.sidebar.orders')}</h2>
      <div className="mb-6 flex gap-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
          <option value="">{t('admin.orders.allOrders')}</option>
          <option value="pending">{t('admin.orders.statuses.pending')}</option>
          <option value="paid">{t('admin.orders.statuses.paid')}</option>
          <option value="failed">{t('admin.orders.statuses.failed')}</option>
        </select>
      </div>
      {orders.length === 0 ? (
        <EmptyState message={t('admin.orders.empty')} icon={ShoppingCart} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => (
              <li
                key={order.id}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div>
                        <div className="font-bold">#{order.id}</div>
                        <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="font-semibold">{order.user.first_name}</div>
                        <div className="text-xs text-gray-500">@{order.user.username || 'N/A'}</div>
                    </div>
                    <div className="text-right md:text-left">
                        <span className={`px-2 py-1 text-xs rounded ${statusMap[order.status]?.className || ''}`}>
                            {statusMap[order.status]?.text || order.status}
                        </span>
                    </div>
                    <div className="font-semibold text-right md:text-left">${order.final_total.toFixed(2)}</div>
                </div>
                <ChevronRight className="text-gray-400 ml-4" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}