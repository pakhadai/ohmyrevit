'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins, DollarSign, Gift, Link, FileText, Sparkles, Save } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

export default function NewCoinPackPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price_usd: '',
    coins_amount: '',
    bonus_percent: '0',
    gumroad_permalink: '',
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

    if (!formData.name || !formData.price_usd || !formData.coins_amount || !formData.gumroad_permalink) {
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
        gumroad_permalink: formData.gumroad_permalink,
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

  const inputClass = "w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-xl transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.coinPacks.form.createTitle', 'Новий пакет монет')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.coinPacks.form.createSubtitle', 'Створіть новий пакет для поповнення балансу')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card-minimal p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Coins size={20} className="text-primary" />
            {t('admin.coinPacks.form.mainInfo', 'Основна інформація')}
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('admin.coinPacks.form.name', 'Назва пакету')} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Starter Pack"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
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
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
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
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
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
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('admin.coinPacks.form.sortOrder', 'Порядок сортування')}
              </label>
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className={inputClass}
              />
            </div>
          </div>

          <div className="p-4 bg-primary/10 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('admin.coinPacks.form.totalCoins', 'Всього монет (з бонусом):')}</span>
              <div className="flex items-center gap-2">
                <Image src="/omr_coin.png" alt="OMR" width={24} height={24} />
                <span className="text-2xl font-bold text-primary">{totalCoins.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-minimal p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Link size={20} className="text-primary" />
            Gumroad
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('admin.coinPacks.form.permalink', 'Gumroad Permalink')} *
            </label>
            <input
              type="text"
              name="gumroad_permalink"
              value={formData.gumroad_permalink}
              onChange={handleChange}
              placeholder="starter-pack-500"
              className={inputClass}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin.coinPacks.form.permalinkHint', 'Ідентифікатор продукту на Gumroad (з URL)')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <FileText size={14} className="inline mr-1" />
              {t('admin.coinPacks.form.description', 'Опис')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Опис пакету для користувачів..."
              rows={3}
              className={inputClass}
            />
          </div>
        </div>

        <div className="card-minimal p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            {t('admin.coinPacks.form.settings', 'Налаштування')}
          </h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50"
            />
            <div>
              <span className="font-medium text-foreground">{t('admin.coinPacks.form.isActive', 'Активний')}</span>
              <p className="text-xs text-muted-foreground">{t('admin.coinPacks.form.isActiveHint', 'Пакет доступний для покупки')}</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50"
            />
            <div>
              <span className="font-medium text-foreground">{t('admin.coinPacks.form.isFeatured', 'Featured')}</span>
              <p className="text-xs text-muted-foreground">{t('admin.coinPacks.form.isFeaturedHint', 'Виділити пакет як рекомендований')}</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
          >
            {t('common.cancel', 'Скасувати')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary px-6 py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {loading ? t('common.saving', 'Збереження...') : t('admin.coinPacks.form.create', 'Створити')}
          </button>
        </div>
      </form>
    </div>
  );
}