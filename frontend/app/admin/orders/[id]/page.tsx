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
import { useTheme } from '@/lib/theme';

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = Number(params.id);
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            // ВИПРАВЛЕНО: getOrderDetail -> getOrderDetails
            const orderData = await adminAPI.getOrderDetails(orderId);
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
                    <span
                        className="px-3 py-1 text-xs font-bold flex items-center gap-1 w-fit"
                        style={{
                            backgroundColor: theme.colors.successLight,
                            color: theme.colors.success,
                            border: `1px solid ${theme.colors.success}33`,
                            borderRadius: theme.radius.full,
                        }}
                    >
                        <CheckCircle size={12} /> {t('admin.orders.statuses.paid')}
                    </span>
                );
            case 'pending':
                return (
                    <span
                        className="px-3 py-1 text-xs font-bold flex items-center gap-1 w-fit"
                        style={{
                            backgroundColor: theme.colors.warningLight,
                            color: theme.colors.warning,
                            border: `1px solid ${theme.colors.warning}33`,
                            borderRadius: theme.radius.full,
                        }}
                    >
                        <Clock size={12} /> {t('admin.orders.statuses.pending')}
                    </span>
                );
            case 'failed':
                return (
                    <span
                        className="px-3 py-1 text-xs font-bold flex items-center gap-1 w-fit"
                        style={{
                            backgroundColor: theme.colors.errorLight,
                            color: theme.colors.error,
                            border: `1px solid ${theme.colors.error}33`,
                            borderRadius: theme.radius.full,
                        }}
                    >
                        <XCircle size={12} /> {t('admin.orders.statuses.failed')}
                    </span>
                );
            default:
                return (
                    <span
                        className="px-3 py-1 text-xs font-bold"
                        style={{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.textMuted,
                            borderRadius: theme.radius.full,
                        }}
                    >
                        {status}
                    </span>
                );
        }
    };

    if (loading || !order) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/admin/orders')}
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
                <h2 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                    {t('admin.orders.title', {id: order.id})}
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div
                        className="p-6"
                        style={{
                            backgroundColor: theme.colors.card,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.radius.xl,
                            boxShadow: theme.shadows.md,
                        }}
                    >
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: theme.colors.text }}>
                            <ShoppingCart size={20} style={{ color: theme.colors.primary }} />
                            {t('admin.orders.orderContent')}
                        </h3>
                        <div className="space-y-4">
                            {order.items.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 p-4"
                                    style={{
                                        backgroundColor: `${theme.colors.surface}4d`,
                                        border: `1px solid ${theme.colors.border}80`,
                                        borderRadius: theme.radius['2xl'],
                                    }}
                                >
                                    <div
                                        className="w-20 h-20 flex-shrink-0 overflow-hidden"
                                        style={{
                                            backgroundColor: theme.colors.surface,
                                            borderRadius: theme.radius.xl,
                                        }}
                                    >
                                        <img src={item.main_image_url || '/placeholder.jpg'} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-semibold line-clamp-1" style={{ color: theme.colors.text }}>
                                                {item.title}
                                            </h4>
                                            <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                                                Product ID: {item.id}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-bold" style={{ color: theme.colors.text }}>
                                                ${item.price_at_purchase.toFixed(2)}
                                            </span>
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
                    <div
                        className="p-6"
                        style={{
                            backgroundColor: theme.colors.card,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.radius.xl,
                            boxShadow: theme.shadows.md,
                        }}
                    >
                        <h3 className="text-lg font-bold mb-5" style={{ color: theme.colors.text }}>
                            {t('admin.orders.details')}
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                                    {t('admin.orders.status')}
                                </span>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="h-px w-full my-2" style={{ backgroundColor: `${theme.colors.border}80` }}></div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                                    {t('admin.orders.amount')}
                                </span>
                                <span className="font-medium" style={{ color: theme.colors.text }}>
                                    ${order.subtotal.toFixed(2)}
                                </span>
                            </div>
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between items-center" style={{ color: theme.colors.success }}>
                                    <span className="text-sm">{t('admin.orders.discount')}</span>
                                    <span className="font-medium">-${order.discount_amount.toFixed(2)}</span>
                                </div>
                            )}
                            {order.bonus_used > 0 && (
                                <div className="flex justify-between items-center" style={{ color: theme.colors.success }}>
                                    <span className="text-sm">{t('admin.orders.bonuses')}</span>
                                    <span className="font-medium">-{order.bonus_used} 💎</span>
                                </div>
                            )}
                            <div className="h-px w-full my-2" style={{ backgroundColor: `${theme.colors.border}80` }}></div>
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold" style={{ color: theme.colors.text }}>
                                    {t('admin.orders.total')}
                                </span>
                                <span className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                                    ${order.final_total.toFixed(2)}
                                </span>
                            </div>

                            <div className="pt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textMuted }}>
                                    <Calendar size={14} />
                                    <span>{t('admin.orders.date')}:</span>
                                    <span style={{ color: theme.colors.text }}>
                                        {new Date(order.created_at).toLocaleString()}
                                    </span>
                                </div>
                                {order.paid_at && (
                                    <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textMuted }}>
                                        <CreditCard size={14} />
                                        <span>{t('admin.orders.paidAt')}:</span>
                                        <span style={{ color: theme.colors.text }}>
                                            {new Date(order.paid_at).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Customer */}
                    <div
                        className="p-6"
                        style={{
                            backgroundColor: theme.colors.card,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.radius.xl,
                            boxShadow: theme.shadows.md,
                        }}
                    >
                        <h3 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: theme.colors.text }}>
                            <User size={20} style={{ color: theme.colors.blue }} />
                            {t('admin.orders.customer')}
                        </h3>
                        <Link
                            href={`/admin/users/${order.user.id}`}
                            className="flex items-center gap-4 p-3 transition-colors group"
                            style={{
                                borderRadius: theme.radius.xl,
                                border: `1px solid transparent`,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                e.currentTarget.style.borderColor = `${theme.colors.border}80`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = 'transparent';
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                    backgroundColor: theme.colors.surface,
                                    color: theme.colors.textMuted,
                                }}
                            >
                                <User size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold truncate" style={{ color: theme.colors.text }}>
                                    {order.user.first_name} {order.user.last_name}
                                </p>
                                <p className="text-xs truncate" style={{ color: theme.colors.textMuted }}>
                                    @{order.user.username || 'N/A'}
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Promo Code */}
                    {order.promo_code && (
                        <div
                            className="p-6"
                            style={{
                                backgroundColor: theme.colors.card,
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: theme.radius.xl,
                                boxShadow: theme.shadows.md,
                            }}
                        >
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
                                <Tag size={20} style={{ color: theme.colors.purple }} />
                                {t('admin.orders.promoCode')}
                            </h3>
                            <div
                                className="p-3 text-center"
                                style={{
                                    backgroundColor: `${theme.colors.surface}4d`,
                                    border: `1px solid ${theme.colors.border}80`,
                                    borderRadius: theme.radius.xl,
                                }}
                            >
                                <span className="font-mono text-lg font-bold tracking-wider" style={{ color: theme.colors.primary }}>
                                    {order.promo_code.code}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Management */}
                    <div
                        className="p-6"
                        style={{
                            backgroundColor: theme.colors.card,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.radius.xl,
                            boxShadow: theme.shadows.md,
                        }}
                    >
                        <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>
                            {t('admin.orders.management')}
                        </h3>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                {t('admin.orders.changeStatus')}
                            </label>
                            <div className="relative">
                                <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="w-full appearance-none px-4 py-3 outline-none transition-all cursor-pointer"
                                    style={{
                                        backgroundColor: theme.colors.card,
                                        border: `1px solid ${theme.colors.border}80`,
                                        borderRadius: theme.radius.xl,
                                        color: theme.colors.text,
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                        e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = `${theme.colors.border}80`;
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="pending">{t('admin.orders.statuses.pending')}</option>
                                    <option value="paid">{t('admin.orders.statuses.paid')}</option>
                                    <option value="failed">{t('admin.orders.statuses.failed')}</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textMuted }}>
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