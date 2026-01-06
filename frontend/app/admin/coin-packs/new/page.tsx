'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins, DollarSign, Gift, Link, FileText, Sparkles, Save } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useTheme } from '@/lib/theme';

export default function NewCoinPackPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price_usd: '',
    coins_amount: '',
    bonus_percent: '0',
    stripe_price_id: '',
    description: '',
    is_active: true,
    is_featured: false,
    sort_order: '0',
  });

  const totalCoins = Math.round(
    (Number(formData.coins_amount) || 0) * (1 + (Number(formData.bonus_percent) || 0) / 100)
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price_usd || !formData.coins_amount || !formData.stripe_price_id) {
      toast.error(t('admin.coinPacks.form.fillRequired', 'Заповніть обов\'язкові поля'));
      return;
    }

    setLoading(true);
    try {
      await adminAPI.createCoinPack({
        name: formData.name,
        price_usd: parseFloat(formData.price_usd),
        coins_amount: parseInt(formData.coins_amount),
        bonus_percent: parseInt(formData.bonus_percent) || 0,
        stripe_price_id: formData.stripe_price_id,
        description: formData.description || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        sort_order: parseInt(formData.sort_order) || 0,
      });

      toast.success(t('admin.coinPacks.form.created', 'Пакет створено!'));
      router.push('/admin/coin-packs');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('admin.coinPacks.form.createError', 'Помилка створення'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 transition-colors"
          style={{
            borderRadius: theme.radius.xl,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ArrowLeft size={24} style={{ color: theme.colors.textMuted }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
            {t('admin.coinPacks.form.createTitle', 'Новий пакет монет')}
          </h1>
          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
            {t('admin.coinPacks.form.createSubtitle', 'Створіть новий пакет для поповнення балансу')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="p-6 space-y-5"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.md,
          }}
        >
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Coins size={20} style={{ color: theme.colors.primary }} />
            {t('admin.coinPacks.form.mainInfo', 'Основна інформація')}
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              {t('admin.coinPacks.form.name', 'Назва пакету')} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Starter Pack"
              className="w-full px-4 py-3 outline-none transition-all"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
                color: theme.colors.text,
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bg;
                e.currentTarget.style.borderColor = `${theme.colors.primary}80`;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.surface;
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                <DollarSign size={14} className="inline mr-1" />
                {t('admin.coinPacks.form.price', 'Ціна (USD)')} *
              </label>
              <input
                type="number"
                name="price_usd"
                value={formData.price_usd}
                onChange={handleChange}
                placeholder="5.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 outline-none transition-all"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.xl,
                  color: theme.colors.text,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.bg;
                  e.currentTarget.style.borderColor = `${theme.colors.primary}80`;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                <Coins size={14} className="inline mr-1" />
                {t('admin.coinPacks.form.coinsAmount', 'Кількість монет')} *
              </label>
              <input
                type="number"
                name="coins_amount"
                value={formData.coins_amount}
                onChange={handleChange}
                placeholder="500"
                min="1"
                className="w-full px-4 py-3 outline-none transition-all"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.xl,
                  color: theme.colors.text,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.bg;
                  e.currentTarget.style.borderColor = `${theme.colors.primary}80`;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                <Gift size={14} className="inline mr-1" />
                {t('admin.coinPacks.form.bonusPercent', 'Бонус (%)')}
              </label>
              <input
                type="number"
                name="bonus_percent"
                value={formData.bonus_percent}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="100"
                className="w-full px-4 py-3 outline-none transition-all"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.xl,
                  color: theme.colors.text,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.bg;
                  e.currentTarget.style.borderColor = `${theme.colors.primary}80`;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                {t('admin.coinPacks.form.sortOrder', 'Порядок сортування')}
              </label>
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 outline-none transition-all"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.xl,
                  color: theme.colors.text,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.bg;
                  e.currentTarget.style.borderColor = `${theme.colors.primary}80`;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div
            className="p-4"
            style={{
              backgroundColor: `${theme.colors.primaryLight}4d`,
              borderRadius: theme.radius.xl,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                {t('admin.coinPacks.form.totalCoins', 'Всього монет (з бонусом):')}
              </span>
              <div className="flex items-center gap-2">
                <Image src="/omr_coin.png" alt="OMR" width={24} height={24} />
                <span className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {totalCoins.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="p-6 space-y-5"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.md,
          }}
        >
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Link size={20} style={{ color: theme.colors.primary }} />
            Stripe
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              {t('admin.coinPacks.form.stripePriceId', 'Stripe Price ID')} *
            </label>
            <input
              type="text"
              name="stripe_price_id"
              value={formData.stripe_price_id}
              onChange={handleChange}
              placeholder="price_1234567890abcdef"
              className="w-full px-4 py-3 outline-none transition-all"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
                color: theme.colors.text,
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bg;
                e.currentTarget.style.borderColor = `${theme.colors.primary}80`;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.surface;
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
              required
            />
            <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
              {t('admin.coinPacks.form.stripePriceIdHint', 'Price ID з Stripe Dashboard (починається з price_)')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              <FileText size={14} className="inline mr-1" />
              {t('admin.coinPacks.form.description', 'Опис')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Опис пакету для користувачів..."
              rows={3}
              className="w-full px-4 py-3 outline-none transition-all"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
                color: theme.colors.text,
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bg;
                e.currentTarget.style.borderColor = `${theme.colors.primary}80`;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.surface;
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        <div
          className="p-6 space-y-4"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.md,
          }}
        >
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Sparkles size={20} style={{ color: theme.colors.primary }} />
            {t('admin.coinPacks.form.settings', 'Налаштування')}
          </h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-5 h-5"
              style={{
                accentColor: theme.colors.primary,
                borderRadius: theme.radius.md,
              }}
            />
            <div>
              <span className="font-medium" style={{ color: theme.colors.text }}>
                {t('admin.coinPacks.form.isActive', 'Активний')}
              </span>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                {t('admin.coinPacks.form.isActiveHint', 'Пакет доступний для покупки')}
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="w-5 h-5"
              style={{
                accentColor: theme.colors.primary,
                borderRadius: theme.radius.md,
              }}
            />
            <div>
              <span className="font-medium" style={{ color: theme.colors.text }}>
                {t('admin.coinPacks.form.isFeatured', 'Featured')}
              </span>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                {t('admin.coinPacks.form.isFeaturedHint', 'Виділити пакет як рекомендований')}
              </p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 font-medium transition-colors"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderRadius: theme.radius.xl,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.colors.surface}cc`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
            }}
          >
            {t('common.cancel', 'Скасувати')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 flex items-center justify-center gap-2 font-medium transition-all"
            style={{
              backgroundColor: loading ? `${theme.colors.primary}cc` : theme.colors.primary,
              color: '#FFFFFF',
              borderRadius: theme.radius.xl,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = `${theme.colors.primary}e6`;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
              }
            }}
          >
            <Save size={20} />
            {loading ? t('common.saving', 'Збереження...') : t('admin.coinPacks.form.create', 'Створити')}
          </button>
        </div>
      </form>
    </div>
  );
}