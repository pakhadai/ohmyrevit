'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Tag, Trash2, Save, Clock, Percent, DollarSign, Hash, History } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';

export default function PromoCodeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const promoId = params.id as string;
    const isNew = promoId === 'new';
    const { t } = useTranslation();
    const { theme } = useTheme();

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
            const data = await adminAPI.getPromoCodeDetails(Number(promoId));
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
                await adminAPI.createPromoCode(dataToSend);
                toast.success(t('admin.promo.detail.toasts.created'));
            } else {
                await adminAPI.updatePromoCode(Number(promoId), dataToSend);
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
            await adminAPI.deletePromoCode(Number(promoId));
            toast.success(t('admin.promo.detail.toasts.deleted'));
            router.push('/admin/promo-codes');
        } catch (error) {
            toast.error(t('admin.promo.detail.toasts.deleteError'));
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/admin/promo-codes')}
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
                    {isNew ? t('admin.promo.detail.titleNew') : t('admin.promo.detail.titleEdit', { code: promo.code })}
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form */}
                <div className="lg:col-span-2">
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
                            <Tag size={20} style={{ color: theme.colors.primary }} />
                            Основна інформація
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                    {t('admin.promo.form.codePlaceholder').split(' ')[0]}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={promo.code}
                                        onChange={(e) => setPromo({...promo, code: e.target.value.toUpperCase()})}
                                        placeholder={t('admin.promo.form.codePlaceholder')}
                                        className="w-full px-4 py-3 text-sm uppercase font-mono font-bold tracking-wider outline-none transition-all"
                                        style={{
                                            backgroundColor: `${theme.colors.surface}80`,
                                            border: `1px solid transparent`,
                                            borderRadius: theme.radius.xl,
                                            color: theme.colors.text,
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.backgroundColor = theme.colors.bg;
                                            e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                    {t('admin.promo.form.discountType')}
                                </label>
                                <div className="relative">
                                    <select
                                        value={promo.discount_type}
                                        onChange={(e) => setPromo({...promo, discount_type: e.target.value})}
                                        className="w-full px-4 py-3 text-sm appearance-none cursor-pointer outline-none transition-all"
                                        style={{
                                            backgroundColor: `${theme.colors.surface}80`,
                                            border: `1px solid transparent`,
                                            borderRadius: theme.radius.xl,
                                            color: theme.colors.text,
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.backgroundColor = theme.colors.bg;
                                            e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                    >
                                        <option value="percentage">{t('admin.promo.form.percentage')}</option>
                                        <option value="fixed">{t('admin.promo.form.fixed')}</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textMuted }}>
                                        {promo.discount_type === 'percentage' ? <Percent size={16} /> : <DollarSign size={16} />}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                    {t('admin.promo.form.value')}
                                </label>
                                <input
                                    type="number"
                                    value={promo.value}
                                    onChange={(e) => setPromo({...promo, value: Number(e.target.value)})}
                                    className="w-full px-4 py-3 text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: `${theme.colors.surface}80`,
                                        border: `1px solid transparent`,
                                        borderRadius: theme.radius.xl,
                                        color: theme.colors.text,
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.backgroundColor = theme.colors.bg;
                                        e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                    {t('admin.promo.form.maxUses')}
                                </label>
                                <input
                                    type="number"
                                    placeholder={t('admin.promo.form.unlimitedPlaceholder')}
                                    value={promo.max_uses || ''}
                                    onChange={(e) => setPromo({...promo, max_uses: e.target.value ? Number(e.target.value) : null})}
                                    className="w-full px-4 py-3 text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: `${theme.colors.surface}80`,
                                        border: `1px solid transparent`,
                                        borderRadius: theme.radius.xl,
                                        color: theme.colors.text,
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.backgroundColor = theme.colors.bg;
                                        e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                    {t('admin.promo.form.expiresAt')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={promo.expires_at}
                                        onChange={(e) => setPromo({...promo, expires_at: e.target.value})}
                                        className="w-full px-4 py-3 text-sm outline-none transition-all"
                                        style={{
                                            backgroundColor: `${theme.colors.surface}80`,
                                            border: `1px solid transparent`,
                                            borderRadius: theme.radius.xl,
                                            color: theme.colors.text,
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.backgroundColor = theme.colors.bg;
                                            e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                    />
                                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: theme.colors.textMuted }} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4" style={{ borderTop: `1px solid ${theme.colors.border}80` }}>
                            <label
                                className="flex items-center gap-3 cursor-pointer group p-3 w-fit transition-colors"
                                style={{
                                    borderRadius: theme.radius.xl,
                                    border: `1px solid transparent`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = `${theme.colors.surface}4d`;
                                    e.currentTarget.style.borderColor = `${theme.colors.border}80`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={promo.is_active}
                                    onChange={(e) => setPromo({...promo, is_active: e.target.checked})}
                                    className="w-5 h-5"
                                    style={{
                                        accentColor: theme.colors.primary,
                                        borderRadius: theme.radius.md,
                                    }}
                                />
                                <span className="font-medium" style={{ color: theme.colors.text }}>
                                    {t('admin.promo.form.isActive')}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions and History */}
                <div className="space-y-6">
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
                            {t('admin.promo.detail.actions')}
                        </h3>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleSave}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 font-medium transition-all"
                                style={{
                                    backgroundColor: theme.colors.primary,
                                    color: '#FFFFFF',
                                    borderRadius: theme.radius.xl,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = `${theme.colors.primary}e6`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = theme.colors.primary;
                                }}
                            >
                                <Save size={18} /> {t('common.save')}
                            </button>
                            {!isNew && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 font-medium transition-colors"
                                    style={{
                                        backgroundColor: `${theme.colors.errorLight}33`,
                                        color: theme.colors.error,
                                        borderRadius: theme.radius.xl,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = `${theme.colors.errorLight}4d`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = `${theme.colors.errorLight}33`;
                                    }}
                                >
                                    <Trash2 size={18} /> {t('common.delete')}
                                </button>
                            )}
                        </div>
                    </div>

                    {!isNew && (
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
                                <History size={20} style={{ color: theme.colors.blue }} />
                                {t('admin.promo.detail.history', { count: orders.length })}
                            </h3>

                            {orders.length > 0 ? (
                                <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                                   {orders.map((o: any) => (
                                       <div
                                           key={o.id}
                                           className="flex items-center justify-between p-3 text-sm"
                                           style={{
                                               backgroundColor: `${theme.colors.surface}4d`,
                                               border: `1px solid ${theme.colors.border}80`,
                                               borderRadius: theme.radius.xl,
                                           }}
                                       >
                                           <Link
                                               href={`/admin/orders/${o.id}`}
                                               className="font-bold hover:underline"
                                               style={{ color: theme.colors.primary }}
                                           >
                                               Order #{o.id}
                                           </Link>
                                           <div className="text-right">
                                               <div className="font-medium" style={{ color: theme.colors.text }}>
                                                   {o.user.first_name}
                                               </div>
                                               <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                                                   {new Date(o.created_at).toLocaleDateString()}
                                               </div>
                                           </div>
                                       </div>
                                   ))}
                                </div>
                            ) : (
                                <div
                                    className="text-center py-8 border border-dashed"
                                    style={{
                                        backgroundColor: `${theme.colors.surface}33`,
                                        borderColor: theme.colors.border,
                                        borderRadius: theme.radius.xl,
                                        color: theme.colors.textMuted,
                                    }}
                                >
                                    <Hash size={24} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">{t('admin.promo.detail.noUses')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
