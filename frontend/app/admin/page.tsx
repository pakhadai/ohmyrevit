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
import { useTheme } from '@/lib/theme';

function StatCard({ title, value, subtitle, icon: Icon, color, bgColor }: any) {
    const { theme } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 relative overflow-hidden group"
            style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
                boxShadow: theme.shadows.md,
            }}
        >
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div>
                    <p
                      className="text-xs font-bold uppercase tracking-wider mb-1"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {title}
                    </p>
                    <h3
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.text }}
                    >
                      {value}
                    </h3>
                </div>
                <div
                  className="p-3 group-hover:scale-110 transition-transform duration-300"
                  style={{
                    borderRadius: theme.radius.xl,
                    backgroundColor: bgColor,
                  }}
                >
                    <Icon size={24} style={{ color: color }} />
                </div>
            </div>
            {subtitle && (
                <p
                  className="text-xs relative z-10"
                  style={{ color: theme.colors.textMuted }}
                >
                    {subtitle}
                </p>
            )}
            {/* Декоративний фон */}
            <div
              className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full"
              style={{ backgroundColor: color, opacity: 0.05 }}
            ></div>
        </motion.div>
    )
}

function DashboardView({ stats }: { stats: any }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className="space-y-8">
      <h1
        className="text-3xl font-bold"
        style={{ color: theme.colors.text }}
      >
        {t('admin.dashboard.title')}
      </h1>

      {/* Статистика (верхній ряд) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
            title={t('admin.dashboard.totalUsers')}
            value={stats.users.total}
            subtitle={t('admin.dashboard.newThisWeek', { count: stats.users.new_this_week })}
            icon={Users}
            color={theme.colors.blue}
            bgColor={theme.colors.blueLight}
        />
        <StatCard
            title={t('admin.dashboard.products')}
            value={stats.products.total}
            icon={Package}
            color={theme.colors.purple}
            bgColor={theme.colors.purpleLight}
        />
        <StatCard
            title={t('admin.dashboard.activeSubscriptions')}
            value={stats.subscriptions.active}
            icon={CreditCard}
            color={theme.colors.green}
            bgColor={theme.colors.greenLight}
        />
        <StatCard
            title={t('admin.dashboard.revenue')}
            value={`$${stats.revenue.total.toFixed(2)}`}
            subtitle={`$${stats.revenue.monthly.toFixed(2)} ${t('admin.dashboard.thisMonth')}`}
            icon={DollarSign}
            color={theme.colors.orange}
            bgColor={theme.colors.orangeLight}
        />
      </div>

      {/* Огляд замовлень */}
      <div className="grid grid-cols-1 gap-5">
        <div
          className="p-6"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.md,
          }}
        >
          <h3
            className="text-lg font-bold mb-6 flex items-center gap-2"
            style={{ color: theme.colors.text }}
          >
            <TrendingUp size={20} style={{ color: theme.colors.primary }} />
            {t('admin.dashboard.ordersOverview')}
          </h3>
          <div className="space-y-4">
            <div
              className="flex justify-between items-center p-3"
              style={{
                backgroundColor: `${theme.colors.surface}4d`,
                borderRadius: theme.radius.xl,
              }}
            >
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                {t('admin.dashboard.totalOrders')}
              </span>
              <span className="font-bold text-lg" style={{ color: theme.colors.text }}>
                {stats.orders.total}
              </span>
            </div>
            <div
              className="flex justify-between items-center p-3"
              style={{
                backgroundColor: `${theme.colors.surface}4d`,
                borderRadius: theme.radius.xl,
              }}
            >
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                {t('admin.dashboard.paidOrders')}
              </span>
              <span className="font-bold text-lg" style={{ color: theme.colors.green }}>
                {stats.orders.paid}
              </span>
            </div>
            <div
              className="flex justify-between items-center p-3"
              style={{
                backgroundColor: `${theme.colors.surface}4d`,
                borderRadius: theme.radius.xl,
              }}
            >
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                {t('admin.dashboard.conversionRate')}
              </span>
              <span className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                {stats.orders.conversion_rate}%
              </span>
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
  const { theme } = useTheme();

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
    return (
      <div
        className="text-center py-20"
        style={{ color: theme.colors.textMuted }}
      >
        {t('admin.dashboard.statsLoadError')}
      </div>
    );
  }

  return <DashboardView stats={stats} />;
}