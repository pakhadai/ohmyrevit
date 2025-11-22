'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Package, CreditCard, DollarSign, TrendingUp
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/admin/Shared';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

function StatCard({ title, value, subtitle, icon: Icon, colorClass }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-minimal p-6 relative overflow-hidden group"
        >
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-foreground">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
                </div>
            </div>
            {subtitle && (
                <p className="text-xs text-muted-foreground relative z-10">
                    {subtitle}
                </p>
            )}
            {/* Декоративний фон */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 ${colorClass}`}></div>
        </motion.div>
    )
}

function DashboardView({ stats }: { stats: any }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">{t('admin.dashboard.title')}</h1>

      {/* Статистика (верхній ряд) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
            title={t('admin.dashboard.totalUsers')}
            value={stats.users.total}
            subtitle={t('admin.dashboard.newThisWeek', { count: stats.users.new_this_week })}
            icon={Users}
            colorClass="bg-blue-500 text-blue-500"
        />
        <StatCard
            title={t('admin.dashboard.products')}
            value={stats.products.total}
            icon={Package}
            colorClass="bg-purple-500 text-purple-500"
        />
        <StatCard
            title={t('admin.dashboard.activeSubscriptions')}
            value={stats.subscriptions.active}
            icon={CreditCard}
            colorClass="bg-green-500 text-green-500"
        />
        <StatCard
            title={t('admin.dashboard.revenue')}
            value={`$${stats.revenue.total.toFixed(2)}`}
            subtitle={`$${stats.revenue.monthly.toFixed(2)} ${t('admin.dashboard.thisMonth')}`}
            icon={DollarSign}
            colorClass="bg-yellow-500 text-yellow-500"
        />
      </div>

      {/* Огляд замовлень */}
      <div className="grid grid-cols-1 gap-5">
        <div className="card-minimal p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            {t('admin.dashboard.ordersOverview')}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground text-sm">{t('admin.dashboard.totalOrders')}</span>
              <span className="font-bold text-lg">{stats.orders.total}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground text-sm">{t('admin.dashboard.paidOrders')}</span>
              <span className="font-bold text-lg text-green-500">{stats.orders.paid}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
              <span className="text-muted-foreground text-sm">{t('admin.dashboard.conversionRate')}</span>
              <span className="font-bold text-lg text-primary">{stats.orders.conversion_rate}%</span>
            </div>
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
    adminAPI.getDashboardStats()
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
    return <div className="text-center py-20 text-muted-foreground">{t('admin.dashboard.statsLoadError')}</div>;
  }

  return <DashboardView stats={stats} />;
}