'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Coins, DollarSign, Gift, Link, FileText, Sparkles, Save, Trash2 } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinPack {
  id: number;
  name: string;
  price_usd: number;
  coins_amount: number;
  bonus_percent: number;
  total_coins: number;
  gumroad_permalink: string;
  gumroad_url: string;
  description?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export default function EditCoinPackPage() {
  const router = useRouter();
  const params = useParams();
  const packId = params.id as string;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const fetchCoinPack = useCallback(async () => {
    try {
      const packs = await adminAPI.getCoinPacks(true);
      const packsList = packs.packs || packs || [];
      const pack = packsList.find((p: CoinPack) => p.id === parseInt(packId));

      if (pack) {
        setFormData({
          name: pack.name,
          price_usd: pack.price_usd.toString(),
          coins_amount: pack.coins_amount.toString(),
          bonus_percent: pack.bonus_percent.toString(),
          gumroad_permalink: pack.gumroad_permalink,
          description: pack.description || '',
          is_active: pack.is_active,
          is_featured: pack.is_featured,
          sort_order: pack.sort_order.toString(),
        });
      } else {
        toast.error(t('admin.coinPacks.notFound', 'Пакет не знайдено'));
        router.push('/admin/coin-packs');
      }
    } catch (error) {
      toast.error(t('admin.coinPacks.loadError', 'Помилка завантаження'));
      router.push('/admin/coin-packs');
    } finally {
      setLoading(false);
    }
  }, [packId, router, t]);

  useEffect(() => {
    fetchCoinPack();
  }, [fetchCoinPack]);

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

    setSaving(true);
    try {
      await adminAPI.updateCoinPack(parseInt(packId), {
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

      toast.success(t('admin.coinPacks.form.updated', 'Пакет оновлено!'));
      router.push('/admin/coin-packs');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('admin.coinPacks.form.updateError', 'Помилка оновлення'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminAPI.deleteCoinPack(parseInt(packId));
      toast.success(t('admin.coinPacks.form.deleted', 'Пакет деактивовано'));
      router.push('/admin/coin-packs');
    } catch (error) {
      toast.error(t('admin.coinPacks.form.deleteError', 'Помилка видалення'));
    }
    setShowDeleteModal(false);
  };

  const inputClass = "w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('admin.coinPacks.form.editTitle', 'Редагування пакету')}</h1>
            <p className="text-sm text-muted-foreground">ID: {packId}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <Trash2 size={20} />
        </button>
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
            disabled={saving}
            className="flex-1 btn-primary px-6 py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? t('common.saving', 'Збереження...') : t('common.save', 'Зберегти')}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card rounded-[24px] p-6 w-full max-w-sm shadow-2xl border border-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={28} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {t('admin.coinPacks.deleteConfirmTitle', 'Деактивувати пакет?')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('admin.coinPacks.deleteConfirmText', 'Пакет буде деактивовано і не буде відображатись користувачам.')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                  {t('common.cancel', 'Скасувати')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  {t('admin.coinPacks.deactivate', 'Деактивувати')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}