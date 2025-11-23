'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import {
    ArrowLeft, ShoppingCart, User, Tag, Calendar, CreditCard, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = Number(params.id);
    const { t } = useTranslation();

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const orderData = await adminAPI.getOrderDetail(orderId);
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
            await adminAPI.updateOrderStatus(order.id, newStatus);
            toast.success(t('toasts.statusUpdated'));
            fetchOrderDetails();
        } catch (error) {
            toast.error(t('toasts.statusUpdateError'));
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 border border-green-500/20 flex items-center gap-1 w-fit">
                        <CheckCircle size={12} /> {t('admin.orders.statuses.paid')}
                    </span>
                );
            case 'pending':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 flex items-center gap-1 w-fit">
                        <Clock size={12} /> {t('admin.orders.statuses.pending')}
                    </span>
                );
            case 'failed':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-1 w-fit">
                        <XCircle size={12} /> {t('admin.orders.statuses.failed')}
                    </span>
                );
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">{status}</span>;
        }
    };

    if (loading || !order) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push('/admin/orders')} className="p-2 hover:bg-muted rounded-xl transition-colors">
                    <ArrowLeft size={24} className="text-muted-foreground" />
                </button>
                <h2 className="text-3xl font-bold text-foreground">{t('admin.orders.title', {id: order.id})}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card-minimal p-6">
                        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                            <ShoppingCart size={20} className="text-primary" />
                            {t('admin.orders.orderContent')}
                        </h3>
                        <div className="space-y-4">
                            {order.items.map((item: any) => (
                                <div key={item.id} className="flex gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                                    <div className="w-20 h-20 bg-muted rounded-xl flex-shrink-0 overflow-hidden">
                                        <img src={item.main_image_url || '/placeholder.jpg'} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-semibold text-foreground line-clamp-1">{item.title}</h4>
                                            <p className="text-xs text-muted-foreground mt-1">Product ID: {item.id}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-bold text-foreground">${item.price_at_purchase.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Details & Actions */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Order Details */}
                    <div className="card-minimal p-6">
                        <h3 className="text-lg font-bold text-foreground mb-5">{t('admin.orders.details')}</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{t('admin.orders.status')}</span>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="h-px bg-border/50 w-full my-2"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{t('admin.orders.amount')}</span>
                                <span className="font-medium text-foreground">${order.subtotal.toFixed(2)}</span>
                            </div>
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span className="text-sm">{t('admin.orders.discount')}</span>
                                    <span className="font-medium">-${order.discount_amount.toFixed(2)}</span>
                                </div>
                            )}
                            {order.bonus_used > 0 && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span className="text-sm">{t('admin.orders.bonuses')}</span>
                                    <span className="font-medium">-{order.bonus_used} 💎</span>
                                </div>
                            )}
                            <div className="h-px bg-border/50 w-full my-2"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold text-foreground">{t('admin.orders.total')}</span>
                                <span className="text-xl font-bold text-primary">${order.final_total.toFixed(2)}</span>
                            </div>

                            <div className="pt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar size={14} />
                                    <span>{t('admin.orders.date')}:</span>
                                    <span className="text-foreground">{new Date(order.created_at).toLocaleString()}</span>
                                </div>
                                {order.paid_at && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CreditCard size={14} />
                                        <span>{t('admin.orders.paidAt')}:</span>
                                        <span className="text-foreground">{new Date(order.paid_at).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="card-minimal p-6">
                        <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                            <User size={20} className="text-blue-500" />
                            {t('admin.orders.customer')}
                        </h3>
                        <Link href={`/admin/users/${order.user.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group border border-transparent hover:border-border/50">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                                <User size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">{order.user.first_name} {order.user.last_name}</p>
                                <p className="text-xs text-muted-foreground truncate">@{order.user.username || 'N/A'}</p>
                            </div>
                        </Link>
                    </div>

                    {/* Promo Code */}
                    {order.promo_code && (
                        <div className="card-minimal p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Tag size={20} className="text-purple-500" />
                                {t('admin.orders.promoCode')}
                            </h3>
                            <div className="bg-muted/30 border border-border/50 rounded-xl p-3 text-center">
                                <span className="font-mono text-lg font-bold text-primary tracking-wider">{order.promo_code.code}</span>
                            </div>
                        </div>
                    )}

                    {/* Management */}
                    <div className="card-minimal p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4">{t('admin.orders.management')}</h3>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.orders.changeStatus')}</label>
                            <div className="relative">
                                <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="w-full appearance-none px-4 py-3 bg-card border border-border/50 rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all cursor-pointer"
                                >
                                    <option value="pending">{t('admin.orders.statuses.pending')}</option>
                                    <option value="paid">{t('admin.orders.statuses.paid')}</option>
                                    <option value="failed">{t('admin.orders.statuses.failed')}</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}