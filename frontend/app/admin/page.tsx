// frontend/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Package, ShoppingCart, CreditCard, TrendingUp, Tag, Loader, DollarSign,
  PlusCircle, UserPlus
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner } from '@/components/admin/Shared';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

function DashboardView({ stats }: { stats: any }) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">{t('admin.dashboard.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.totalUsers')}</p>
              <p className="text-2xl font-bold">{stats.users.total}</p>
              <p className="text-xs text-green-500">{t('admin.dashboard.newThisWeek', { count: stats.users.new_this_week })}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.products')}</p>
              <p className="text-2xl font-bold">{stats.products.total}</p>
            </div>
            <Package className="text-purple-500" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.activeSubscriptions')}</p>
              <p className="text-2xl font-bold">{stats.subscriptions.active}</p>
            </div>
            <CreditCard className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.revenue')}</p>
              <p className="text-2xl font-bold">${stats.revenue.total.toFixed(2)}</p>
              <p className="text-xs text-green-500">${stats.revenue.monthly.toFixed(2)} {t('admin.dashboard.thisMonth')}</p>
            </div>
            <DollarSign className="text-yellow-500" size={32} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="font-semibold mb-4">{t('admin.dashboard.ordersOverview')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('admin.dashboard.totalOrders')}</span>
              <span className="font-semibold">{stats.orders.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('admin.dashboard.paidOrders')}</span>
              <span className="font-semibold text-green-500">{stats.orders.paid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('admin.dashboard.conversionRate')}</span>
              <span className="font-semibold">{stats.orders.conversion_rate}%</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="font-semibold mb-4">{t('admin.dashboard.quickActions')}</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
              <PlusCircle size={18} className="inline mr-2" />
              {t('admin.dashboard.addNewProduct')}
            </button>
            <button className="w-full text-left px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              <Tag size={18} className="inline mr-2" />
              {t('admin.dashboard.createPromoCode')}
            </button>
            <button className="w-full text-left px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              <UserPlus size={18} className="inline mr-2" />
              {t('admin.dashboard.addAdmin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    adminApi.getDashboardStats()
      .then(setStats)
      .catch(error => {
          console.error(error);
          toast.error(t('toasts.dataLoadError'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return <div>{t('admin.dashboard.statsLoadError')}</div>;
  }

  return <DashboardView stats={stats} />;
}