'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import {
    ArrowLeft, User, Mail, Phone, Clock, Gift, CreditCard, Shield,
    CheckCircle, XCircle, UserPlus, ShoppingCart, Ban, Unlock, Calendar, ChevronRight, Coins
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme';

// ВИПРАВЛЕНО: bonus_balance -> balance
interface UserDetail {
    id: number;
    telegram_id: number;
    username?: string;
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    photo_url?: string;
    is_admin: boolean;
    is_active: boolean;
    balance: number;  // ВИПРАВЛЕНО: було bonus_balance
    bonus_streak: number;
    created_at: string;
    last_login_at?: string;
    subscriptions: any[];
    orders: any[];
    referrals: any[];
    recent_transactions?: any[];  // Додано для транзакцій
}

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = Number(params.id);
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const [showBonusModal, setShowBonusModal] = useState(false);
    const [bonusAmount, setBonusAmount] = useState(100);
    const [bonusReason, setBonusReason] = useState('');
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscriptionDays, setSubscriptionDays] = useState(30);

    const fetchUserDetails = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const userData = await adminAPI.getUserDetails(userId);
            setUser(userData);
        } catch (error) {
            toast.error(t('admin.users.loadError'));
            router.push('/admin/users');
        } finally {
            setLoading(false);
        }
    }, [userId, router, t]);

    useEffect(() => {
        fetchUserDetails();
    }, [fetchUserDetails]);

    const handleToggleAdmin = async () => {
        if (!user) return;
        try {
            const res = await adminAPI.toggleUserAdmin(user.id);
            toast.success(res.is_admin ? t('admin.users.toasts.adminGranted') : t('admin.users.toasts.adminRevoked'));
            fetchUserDetails();
        } catch (error) {
            toast.error(t('admin.users.toasts.adminError'));
        }
    };

    const handleToggleActive = async () => {
        if (!user) return;
        try {
            const res = await adminAPI.toggleUserActive(user.id);
            toast.success(res.is_active ? t('admin.users.toasts.activated') : t('admin.users.toasts.deactivated'));
            fetchUserDetails();
        } catch (error) {
            toast.error(t('admin.users.toasts.statusError'));
        }
    };

    const handleAddCoins = async () => {
        if (!user || bonusAmount <= 0) return;
        try {
            await adminAPI.addUserBonus(user.id, bonusAmount, bonusReason || 'Ручне нарахування адміном');
            toast.success(t('admin.users.toasts.coinsAdded', { amount: bonusAmount }));
            setShowBonusModal(false);
            setBonusAmount(100);
            setBonusReason('');
            fetchUserDetails();
        } catch (error) {
            toast.error(t('admin.users.toasts.coinsError'));
        }
    };

    const handleGiveSubscription = async () => {
        if (!user || subscriptionDays <= 0) return;
        try {
            await adminAPI.giveSubscription(user.id, subscriptionDays);
            toast.success(t('admin.users.toasts.subscriptionGranted', { days: subscriptionDays }));
            setShowSubscriptionModal(false);
            setSubscriptionDays(30);
            fetchUserDetails();
        } catch (error) {
            toast.error(t('admin.users.toasts.subscriptionError'));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p style={{ color: theme.colors.textMuted }}>{t('admin.users.notFound')}</p>
            </div>
        );
    }

    const activeSubscription = user.subscriptions?.find(s => s.status === 'active');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/admin/users')}
                    className="p-2 transition-colors"
                    style={{
                        borderRadius: theme.radius.lg,
                        color: theme.colors.text,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.surface;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    {user.photo_url ? (
                        <img
                            src={user.photo_url}
                            alt={user.first_name}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{
                                backgroundColor: theme.colors.primaryLight,
                            }}
                        >
                            <User style={{ color: theme.colors.primary }} size={24} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                            {user.first_name} {user.last_name || ''}
                        </h1>
                        <p style={{ color: theme.colors.textMuted }}>
                            @{user.username || 'no_username'} · ID: {user.telegram_id}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
                {user.is_admin && (
                    <span
                        className="px-3 py-1 text-sm flex items-center gap-1"
                        style={{
                            backgroundColor: theme.colors.purpleLight,
                            color: theme.colors.purple,
                            borderRadius: theme.radius.full,
                        }}
                    >
                        <Shield size={14} /> Admin
                    </span>
                )}
                {activeSubscription && (
                    <span
                        className="px-3 py-1 text-sm flex items-center gap-1"
                        style={{
                            backgroundColor: theme.colors.orangeLight,
                            color: theme.colors.orange,
                            borderRadius: theme.radius.full,
                        }}
                    >
                        <CreditCard size={14} /> Premium
                    </span>
                )}
                <span
                    className="px-3 py-1 text-sm flex items-center gap-1"
                    style={{
                        backgroundColor: user.is_active ? theme.colors.successLight : theme.colors.errorLight,
                        color: user.is_active ? theme.colors.success : theme.colors.error,
                        borderRadius: theme.radius.full,
                    }}
                >
                    {user.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {user.is_active ? 'Active' : 'Blocked'}
                </span>
            </div>

            {/* Main Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Balance Card - ВИПРАВЛЕНО */}
                <div
                    className="p-4"
                    style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                    }}
                >
                    <div className="flex items-center gap-2 mb-2" style={{ color: theme.colors.textMuted }}>
                        <Coins size={16} />
                        <span className="text-sm">OMR Coins</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                        {user.balance.toLocaleString()} 💎
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                        ≈ ${(user.balance / 100).toFixed(2)}
                    </p>
                </div>

                {/* Streak */}
                <div
                    className="p-4"
                    style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                    }}
                >
                    <div className="flex items-center gap-2 mb-2" style={{ color: theme.colors.textMuted }}>
                        <Gift size={16} />
                        <span className="text-sm">Bonus Streak</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{user.bonus_streak} 🔥</p>
                    <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>days in a row</p>
                </div>

                {/* Orders */}
                <div
                    className="p-4"
                    style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                    }}
                >
                    <div className="flex items-center gap-2 mb-2" style={{ color: theme.colors.textMuted }}>
                        <ShoppingCart size={16} />
                        <span className="text-sm">Orders</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{user.orders?.length || 0}</p>
                </div>

                {/* Referrals */}
                <div
                    className="p-4"
                    style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                    }}
                >
                    <div className="flex items-center gap-2 mb-2" style={{ color: theme.colors.textMuted }}>
                        <UserPlus size={16} />
                        <span className="text-sm">Referrals</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{user.referrals?.length || 0}</p>
                </div>
            </div>

            {/* Contact Info */}
            <div
                className="p-6"
                style={{
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.xl,
                }}
            >
                <h3 className="font-semibold mb-4" style={{ color: theme.colors.text }}>Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.email && (
                        <div className="flex items-center gap-3">
                            <Mail size={18} style={{ color: theme.colors.textMuted }} />
                            <span style={{ color: theme.colors.text }}>{user.email}</span>
                        </div>
                    )}
                    {user.phone && (
                        <div className="flex items-center gap-3">
                            <Phone size={18} style={{ color: theme.colors.textMuted }} />
                            <span style={{ color: theme.colors.text }}>{user.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <Clock size={18} style={{ color: theme.colors.textMuted }} />
                        <span style={{ color: theme.colors.text }}>Registered: {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    {user.last_login_at && (
                        <div className="flex items-center gap-3">
                            <Calendar size={18} style={{ color: theme.colors.textMuted }} />
                            <span style={{ color: theme.colors.text }}>Last login: {new Date(user.last_login_at).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            {user.recent_transactions && user.recent_transactions.length > 0 && (
                <div
                    className="p-6"
                    style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                    }}
                >
                    <h3 className="font-semibold mb-4" style={{ color: theme.colors.text }}>Recent Transactions</h3>
                    <div className="space-y-2">
                        {user.recent_transactions.slice(0, 5).map((tx: any, index: number) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between py-2"
                                style={{
                                    borderBottom: index < Math.min(user.recent_transactions.length, 5) - 1
                                        ? `1px solid ${theme.colors.border}`
                                        : 'none',
                                }}
                            >
                                <div>
                                    <p className="font-medium" style={{ color: theme.colors.text }}>{tx.description || tx.type}</p>
                                    <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                                        {new Date(tx.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <span
                                    className="font-bold"
                                    style={{ color: tx.amount > 0 ? theme.colors.success : theme.colors.error }}
                                >
                                    {tx.amount > 0 ? '+' : ''}{tx.amount} 💎
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin Actions */}
            <div
                className="p-6"
                style={{
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.xl,
                }}
            >
                <h3 className="font-semibold mb-4" style={{ color: theme.colors.text }}>Admin Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowBonusModal(true)}
                        className="px-4 py-2 transition-opacity flex items-center gap-2"
                        style={{
                            backgroundColor: theme.colors.primary,
                            color: '#fff',
                            borderRadius: theme.radius.lg,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                        }}
                    >
                        <Gift size={16} />
                        Add Coins
                    </button>
                    <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="px-4 py-2 transition-opacity flex items-center gap-2"
                        style={{
                            backgroundColor: theme.colors.orange,
                            color: '#fff',
                            borderRadius: theme.radius.lg,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                        }}
                    >
                        <CreditCard size={16} />
                        Give Premium
                    </button>
                    <button
                        onClick={handleToggleAdmin}
                        className="px-4 py-2 transition-opacity flex items-center gap-2"
                        style={{
                            backgroundColor: user.is_admin ? theme.colors.error : theme.colors.purple,
                            color: '#fff',
                            borderRadius: theme.radius.lg,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                        }}
                    >
                        <Shield size={16} />
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                        onClick={handleToggleActive}
                        className="px-4 py-2 transition-opacity flex items-center gap-2"
                        style={{
                            backgroundColor: user.is_active ? theme.colors.error : theme.colors.success,
                            color: '#fff',
                            borderRadius: theme.radius.lg,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                        }}
                    >
                        {user.is_active ? <Ban size={16} /> : <Unlock size={16} />}
                        {user.is_active ? 'Block User' : 'Unblock User'}
                    </button>
                </div>
            </div>

            {/* Add Coins Modal */}
            <AnimatePresence>
                {showBonusModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                        onClick={() => setShowBonusModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="p-6 max-w-md w-full"
                            style={{
                                backgroundColor: theme.colors.card,
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: theme.radius.xl,
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>Add OMR Coins</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text }}>Amount</label>
                                    <input
                                        type="number"
                                        value={bonusAmount}
                                        onChange={(e) => setBonusAmount(Number(e.target.value))}
                                        min="1"
                                        className="w-full px-3 py-2"
                                        style={{
                                            backgroundColor: theme.colors.bg,
                                            border: `1px solid ${theme.colors.border}`,
                                            borderRadius: theme.radius.lg,
                                            color: theme.colors.text,
                                        }}
                                    />
                                    <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                                        ≈ ${(bonusAmount / 100).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text }}>Reason</label>
                                    <input
                                        type="text"
                                        value={bonusReason}
                                        onChange={(e) => setBonusReason(e.target.value)}
                                        placeholder="e.g., Compensation, Promotion"
                                        className="w-full px-3 py-2"
                                        style={{
                                            backgroundColor: theme.colors.bg,
                                            border: `1px solid ${theme.colors.border}`,
                                            borderRadius: theme.radius.lg,
                                            color: theme.colors.text,
                                        }}
                                    />
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowBonusModal(false)}
                                        className="px-4 py-2 transition-colors"
                                        style={{
                                            border: `1px solid ${theme.colors.border}`,
                                            borderRadius: theme.radius.lg,
                                            color: theme.colors.text,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = theme.colors.surface;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddCoins}
                                        className="px-4 py-2 transition-opacity"
                                        style={{
                                            backgroundColor: theme.colors.primary,
                                            color: '#fff',
                                            borderRadius: theme.radius.lg,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = '0.9';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                    >
                                        Add {bonusAmount} coins
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subscription Modal */}
            <AnimatePresence>
                {showSubscriptionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                        onClick={() => setShowSubscriptionModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="p-6 max-w-md w-full"
                            style={{
                                backgroundColor: theme.colors.card,
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: theme.radius.xl,
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>Give Premium Subscription</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text }}>Duration (days)</label>
                                    <input
                                        type="number"
                                        value={subscriptionDays}
                                        onChange={(e) => setSubscriptionDays(Number(e.target.value))}
                                        min="1"
                                        max="365"
                                        className="w-full px-3 py-2"
                                        style={{
                                            backgroundColor: theme.colors.bg,
                                            border: `1px solid ${theme.colors.border}`,
                                            borderRadius: theme.radius.lg,
                                            color: theme.colors.text,
                                        }}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {[7, 30, 90, 365].map(days => (
                                        <button
                                            key={days}
                                            onClick={() => setSubscriptionDays(days)}
                                            className="px-3 py-1 text-sm"
                                            style={{
                                                backgroundColor: subscriptionDays === days ? theme.colors.primary : theme.colors.surface,
                                                color: subscriptionDays === days ? '#fff' : theme.colors.text,
                                                borderRadius: theme.radius.lg,
                                            }}
                                        >
                                            {days}d
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowSubscriptionModal(false)}
                                        className="px-4 py-2 transition-colors"
                                        style={{
                                            border: `1px solid ${theme.colors.border}`,
                                            borderRadius: theme.radius.lg,
                                            color: theme.colors.text,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = theme.colors.surface;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGiveSubscription}
                                        className="px-4 py-2 transition-opacity"
                                        style={{
                                            backgroundColor: theme.colors.orange,
                                            color: '#fff',
                                            borderRadius: theme.radius.lg,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = '0.9';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                    >
                                        Give {subscriptionDays} days
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}