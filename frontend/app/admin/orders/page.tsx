// frontend/app/admin/orders/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : undefined;
      const response = await adminApi.getOrders(params);
      setOrders(response.orders || []);
    } catch (error) {
      toast.error('Не вдалося завантажити замовлення');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      toast.success('Статус замовлення оновлено');
      fetchOrders();
    } catch (error) {
      toast.error('Не вдалося оновити статус замовлення');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Керування замовленнями</h2>
      <div className="mb-6 flex gap-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
          <option value="">Всі замовлення</option>
          <option value="pending">Очікує</option>
          <option value="paid">Оплачено</option>
          <option value="failed">Невдале</option>
        </select>
      </div>
      {orders.length === 0 ? (
        <EmptyState message="Замовлень не знайдено" icon={ShoppingCart} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Користувач</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Сума</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дата</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="p-3 font-medium">#{order.id}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{order.user.first_name}</div>
                        <div className="text-xs text-gray-500">@{order.user.username}</div>
                      </div>
                    </td>
                    <td className="p-3">${order.final_total}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded ${order.status === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'}`}>
                        {order.status === 'paid' ? 'Оплачено' : order.status === 'pending' ? 'Очікує' : 'Невдале'}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="text-xs px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600">
                        <option value="pending">Очікує</option>
                        <option value="paid">Оплачено</option>
                        <option value="failed">Невдале</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}