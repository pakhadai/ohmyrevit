'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import {
    ArrowLeft, ShoppingCart, User, Tag
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = Number(params.id);
    const { t } = useTranslation();

    const statusMap: { [key: string]: { text: string; className: string } } = {
      paid: { text: t('admin.orders.statuses.paid'), className: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' },
      pending: { text: t('admin.orders.statuses.pending'), className: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' },
      failed: { text: t('admin.orders.statuses.failed'), className: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' },
    };

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const orderData = await adminApi.getOrderDetail(orderId);
            setOrder(orderData);
        } catch (error) {
            toast.error(t('admin.orders.loadError'));
            router.push('/admin/orders');
        } finally {
            setLoading(false);
        }
    }, [orderId, router, t]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    const handleStatusChange = async (newStatus: string) => {
        if (!order) return;
        try {
            await adminApi.updateOrderStatus(order.id, newStatus);
            toast.success(t('toasts.statusUpdated'));
            fetchOrderDetails();
        } catch (error) {
            toast.error(t('toasts.statusUpdateError'));
        }
    };

    if (loading || !order) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.push('/admin/orders')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold">{t('admin.orders.title', {id: order.id})}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2"><ShoppingCart size={18} /> {t('admin.orders.orderContent')}</h3>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {order.items.map((item: any) => (
                                <li key={item.id} className="py-3 flex items-center gap-4">
                                    <img src={item.main_image_url} alt={item.title} className="w-16 h-16 object-cover rounded-md" />
                                    <div className="flex-1">
                                        <p className="font-semibold">{item.title}</p>
                                        <p className="text-sm text-gray-500">ID: {item.id}</p>
                                    </div>
                                    <p className="font-semibold">${item.price_at_purchase.toFixed(2)}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="font-semibold mb-4">{t('admin.orders.details')}</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span>{t('admin.orders.status')}</span> <span className={`px-2 py-0.5 text-xs rounded ${statusMap[order.status]?.className || ''}`}>{statusMap[order.status]?.text || order.status}</span></div>
                            <div className="flex justify-between"><span>{t('admin.orders.amount')}</span> <strong>${order.subtotal.toFixed(2)}</strong></div>
                            {order.discount_amount > 0 && <div className="flex justify-between"><span>{t('admin.orders.discount')}</span> <span className="text-green-500">-${order.discount_amount.toFixed(2)}</span></div>}
                            {order.bonus_used > 0 && <div className="flex justify-between"><span>{t('admin.orders.bonuses')}</span> <span className="text-green-500">-{order.bonus_used} 💎</span></div>}
                            <div className="flex justify-between font-bold border-t pt-2 dark:border-gray-700"><span>{t('admin.orders.total')}</span> <span>${order.final_total.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>{t('admin.orders.date')}</span> <span>{new Date(order.created_at).toLocaleString()}</span></div>
                             {order.paid_at && <div className="flex justify-between"><span>{t('admin.orders.paidAt')}</span> <span>{new Date(order.paid_at).toLocaleString()}</span></div>}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2"><User size={18} /> {t('admin.orders.customer')}</h3>
                        <Link href={`/admin/users/${order.user.id}`} className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                            <p className="font-semibold">{order.user.first_name} {order.user.last_name}</p>
                            <p className="text-sm text-gray-500">@{order.user.username || 'N/A'}</p>
                        </Link>
                    </div>

                    {order.promo_code && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Tag size={18} /> {t('admin.orders.promoCode')}</h3>
                            <p className="font-mono p-2 bg-gray-100 dark:bg-gray-700 rounded text-center">{order.promo_code.code}</p>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="font-semibold mb-4">{t('admin.orders.management')}</h3>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm">{t('admin.orders.changeStatus')}</label>
                            <select value={order.status} onChange={(e) => handleStatusChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                <option value="pending">{t('admin.orders.statuses.pending')}</option>
                                <option value="paid">{t('admin.orders.statuses.paid')}</option>
                                <option value="failed">{t('admin.orders.statuses.failed')}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}