// frontend/app/admin/promo-codes/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, PlusCircle } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';

export default function PromoCodesManagementPage() {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount_type: 'percentage',
    value: 10,
    max_uses: null as number | null,
    expires_at: null as string | null
  });

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPromoCodes();
      setPromoCodes(response || []);
    } catch (error) {
      toast.error('Не вдалося завантажити промокоди');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const createPromoCode = async () => {
    try {
      await adminApi.createPromoCode(newPromo);
      toast.success('Промокод успішно створено');
      setShowCreateForm(false);
      setNewPromo({ code: '', discount_type: 'percentage', value: 10, max_uses: null, expires_at: null });
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.message || 'Не вдалося створити промокод');
    }
  };

  const togglePromoCode = async (promoId: number) => {
    try {
      await adminApi.togglePromoCode(promoId);
      toast.success('Статус промокоду оновлено');
      fetchPromoCodes();
    } catch (error) {
      toast.error('Не вдалося оновити статус');
    }
  };

  const deletePromoCode = async (promoId: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей промокод?')) return;
    try {
      await adminApi.deletePromoCode(promoId);
      toast.success('Промокод видалено');
      fetchPromoCodes();
    } catch (error) {
      toast.error('Не вдалося видалити промокод');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Керування промокодами</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <PlusCircle size={18} />
          {showCreateForm ? 'Сховати форму' : 'Створити промокод'}
        </button>
      </div>
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
          <h3 className="font-semibold mb-4">Новий промокод</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Код (напр., WINTER25)" value={newPromo.code} onChange={(e) => setNewPromo({...newPromo, code: e.target.value})} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            <select value={newPromo.discount_type} onChange={(e) => setNewPromo({...newPromo, discount_type: e.target.value})} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
              <option value="percentage">Відсоток</option>
              <option value="fixed">Фіксована сума</option>
            </select>
            <input type="number" placeholder="Значення" value={newPromo.value} onChange={(e) => setNewPromo({...newPromo, value: Number(e.target.value)})} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            <input type="number" placeholder="Макс. використань (необов'язково)" value={newPromo.max_uses || ''} onChange={(e) => setNewPromo({...newPromo, max_uses: e.target.value ? Number(e.target.value) : null})} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            <input type="datetime-local" placeholder="Дійсний до" value={newPromo.expires_at || ''} onChange={(e) => setNewPromo({...newPromo, expires_at: e.target.value || null})} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 md:col-span-2" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={createPromoCode} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Створити</button>
            <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200">Скасувати</button>
          </div>
        </div>
      )}
      {promoCodes.length === 0 ? (
        <EmptyState message="Промокодів ще немає" icon={Tag} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Код</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Тип/Значення</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Використання</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {promoCodes.map((promo) => (
                  <tr key={promo.id}>
                    <td className="p-3 font-mono">{promo.code}</td>
                    <td className="p-3">{promo.discount_type === 'percentage' ? `${promo.value}%` : `${promo.value}`}</td>
                    <td className="p-3">{promo.current_uses}/{promo.max_uses || '∞'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded ${promo.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'}`}>{promo.is_active ? 'Активний' : 'Неактивний'}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => togglePromoCode(promo.id)} className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">{promo.is_active ? 'Деактивувати' : 'Активувати'}</button>
                        <button onClick={() => deletePromoCode(promo.id)} className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Видалити</button>
                      </div>
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