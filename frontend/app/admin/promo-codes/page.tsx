// frontend/app/admin/promo-codes/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, PlusCircle, ChevronRight } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function PromoCodesManagementPage() {
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPromoCodes();
      setPromoCodes(response || []);
    } catch (error) {
      toast.error(t('admin.promo.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="hidden lg:flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{t('admin.promo.pageTitle')}</h2>
        <button onClick={() => router.push('/admin/promo-codes/new')} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <PlusCircle size={18} />
          {t('admin.promo.new')}
        </button>
      </div>

      {promoCodes.length === 0 ? (
        <EmptyState message={t('admin.promo.empty')} icon={Tag} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {promoCodes.map((promo) => (
              <li
                key={promo.id}
                onClick={() => router.push(`/admin/promo-codes/${promo.id}`)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div className="font-mono font-bold">{promo.code}</div>
                    <div>
                        {promo.discount_type === 'percentage'
                          ? `${promo.value}%`
                          : `$${parseFloat(promo.value).toFixed(2)}`}
                    </div>
                    <div>{t('admin.promo.used', { current: promo.current_uses, max: promo.max_uses || t('admin.promo.unlimited') })}</div>
                    <div>
                      <span className={`px-2 py-1 text-xs rounded ${promo.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {promo.is_active ? t('admin.promo.active') : t('admin.promo.inactive')}
                      </span>
                    </div>
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