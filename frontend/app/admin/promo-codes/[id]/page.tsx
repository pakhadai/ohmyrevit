// frontend/app/admin/promo-codes/[id]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Tag, Trash2, Save } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function PromoCodeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const promoId = params.id as string;
    const isNew = promoId === 'new';
    const { t } = useTranslation();

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
            toast.error(t('admin.promo.detail.toasts.loadError'));
            router.push('/admin/promo-codes');
        } finally {
            setLoading(false);
        }
    }, [promoId, isNew, router, t]);

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
                toast.success(t('admin.promo.detail.toasts.created'));
            } else {
                await adminApi.updatePromoCode(Number(promoId), dataToSend);
                toast.success(t('admin.promo.detail.toasts.updated'));
            }
            router.push('/admin/promo-codes');
        } catch (error: any) {
            toast.error(error.message || t('admin.promo.detail.toasts.saveError'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (isNew || !window.confirm(t('admin.promo.detail.toasts.confirmDelete', { code: promo.code }))) return;
        try {
            await adminApi.deletePromoCode(Number(promoId));
            toast.success(t('admin.promo.detail.toasts.deleted'));
            router.push('/admin/promo-codes');
        } catch (error) {
            toast.error(t('admin.promo.detail.toasts.deleteError'));
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.push('/admin/promo-codes')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold">{isNew ? t('admin.promo.detail.titleNew') : t('admin.promo.detail.titleEdit', { code: promo.code })}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('admin.promo.form.codePlaceholder').split(' ')[0]}</label>
                            <input type="text" value={promo.code} onChange={(e) => setPromo({...promo, code: e.target.value.toUpperCase()})} placeholder={t('admin.promo.form.codePlaceholder')} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('admin.promo.form.discountType')}</label>
                            <select value={promo.discount_type} onChange={(e) => setPromo({...promo, discount_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                <option value="percentage">{t('admin.promo.form.percentage')}</option>
                                <option value="fixed">{t('admin.promo.form.fixed')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('admin.promo.form.value')}</label>
                            <input type="number" value={promo.value} onChange={(e) => setPromo({...promo, value: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('admin.promo.form.maxUses')}</label>
                            <input type="number" placeholder={t('admin.promo.form.unlimitedPlaceholder')} value={promo.max_uses || ''} onChange={(e) => setPromo({...promo, max_uses: e.target.value ? Number(e.target.value) : null})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">{t('admin.promo.form.expiresAt')}</label>
                            <input type="datetime-local" value={promo.expires_at} onChange={(e) => setPromo({...promo, expires_at: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={promo.is_active} onChange={(e) => setPromo({...promo, is_active: e.target.checked})} className="w-4 h-4" />
                                <span>{t('admin.promo.form.isActive')}</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="font-semibold mb-4">{t('admin.promo.detail.actions')}</h3>
                        <div className="flex flex-col gap-2">
                            <button onClick={handleSave} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><Save size={16}/> {t('common.save')}</button>
                            {!isNew && <button onClick={handleDelete} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><Trash2 size={16}/> {t('common.delete')}</button>}
                        </div>
                    </div>
                    {!isNew && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="font-semibold mb-4">{t('admin.promo.detail.history', { count: orders.length })}</h3>
                            {orders.length > 0 ? (
                                <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">
                                   {orders.map((o: any) => (
                                       <li key={o.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                           <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">{t('admin.promo.detail.orderLink', {id: o.id})}</Link> {t('admin.promo.detail.byUser', {name: o.user.first_name})}
                                       </li>
                                   ))}
                                </ul>
                            ) : <p className="text-sm text-gray-500">{t('admin.promo.detail.noUses')}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}