'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Tag, Trash2, Save } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner } from '@/components/admin/Shared';
import toast from 'react-hot-toast';

export default function PromoCodeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const promoId = params.id as string;
    const isNew = promoId === 'new';

    const [promo, setPromo] = useState({
        code: '',
        discount_type: 'percentage',
        value: 10,
        max_uses: null as number | null,
        expires_at: '',
        is_active: true
    });
    const [loading, setLoading] = useState(!isNew);
    const [orders, setOrders] = useState([]);

    const fetchPromoCode = useCallback(async () => {
        if (isNew) return;
        setLoading(true);
        try {
            const data = await adminApi.getPromoCodeDetails(Number(promoId));
            setPromo({
                ...data,
                expires_at: data.expires_at ? new Date(data.expires_at).toISOString().slice(0, 16) : ''
            });
            setOrders(data.orders_used_in || []);
        } catch (error) {
            toast.error('Не вдалося завантажити промокод.');
            router.push('/admin/promo-codes');
        } finally {
            setLoading(false);
        }
    }, [promoId, isNew, router]);

    useEffect(() => {
        fetchPromoCode();
    }, [fetchPromoCode]);

    const handleSave = async () => {
        setLoading(true);
        const dataToSend = {
            ...promo,
            max_uses: promo.max_uses ? Number(promo.max_uses) : null,
            expires_at: promo.expires_at ? new Date(promo.expires_at).toISOString() : null
        };

        try {
            if (isNew) {
                await adminApi.createPromoCode(dataToSend);
                toast.success('Промокод створено!');
            } else {
                await adminApi.updatePromoCode(Number(promoId), dataToSend);
                toast.success('Промокод оновлено!');
            }
            router.push('/admin/promo-codes');
        } catch (error: any) {
            toast.error(error.message || 'Помилка збереження');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (isNew || !window.confirm(`Видалити промокод "${promo.code}"?`)) return;
        try {
            await adminApi.deletePromoCode(Number(promoId));
            toast.success('Промокод видалено');
            router.push('/admin/promo-codes');
        } catch (error) {
            toast.error('Помилка видалення');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.push('/admin/promo-codes')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold">{isNew ? 'Новий промокод' : `Редагування: ${promo.code}`}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Код</label>
                            <input type="text" value={promo.code} onChange={(e) => setPromo({...promo, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Тип знижки</label>
                            <select value={promo.discount_type} onChange={(e) => setPromo({...promo, discount_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                <option value="percentage">Відсоток (%)</option>
                                <option value="fixed">Фіксована сума ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Значення</label>
                            <input type="number" value={promo.value} onChange={(e) => setPromo({...promo, value: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Макс. використань</label>
                            <input type="number" placeholder="Безлімітно" value={promo.max_uses || ''} onChange={(e) => setPromo({...promo, max_uses: e.target.value ? Number(e.target.value) : null})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Дійсний до (необов'язково)</label>
                            <input type="datetime-local" value={promo.expires_at} onChange={(e) => setPromo({...promo, expires_at: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={promo.is_active} onChange={(e) => setPromo({...promo, is_active: e.target.checked})} className="w-4 h-4" />
                                <span>Активний промокод</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="font-semibold mb-4">Дії</h3>
                        <div className="flex flex-col gap-2">
                            <button onClick={handleSave} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><Save size={16}/> Зберегти</button>
                            {!isNew && <button onClick={handleDelete} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><Trash2 size={16}/> Видалити</button>}
                        </div>
                    </div>
                    {!isNew && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="font-semibold mb-4">Історія використань ({orders.length})</h3>
                            {orders.length > 0 ? (
                                <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">
                                   {orders.map((o: any) => (
                                       <li key={o.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                           <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">Замовлення #{o.id}</Link> від {o.user.first_name}
                                       </li>
                                   ))}
                                </ul>
                            ) : <p className="text-sm text-gray-500">Ще не використовувався.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}