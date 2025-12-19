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
                <p className="text-muted-foreground">{t('admin.users.notFound')}</p>
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
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
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
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="text-primary" size={24} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">
                            {user.first_name} {user.last_name || ''}
                        </h1>
                        <p className="text-muted-foreground">
                            @{user.username || 'no_username'} · ID: {user.telegram_id}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
                {user.is_admin && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm flex items-center gap-1">
                        <Shield size={14} /> Admin
                    </span>
                )}
                {activeSubscription && (
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm flex items-center gap-1">
                        <CreditCard size={14} /> Premium
                    </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    user.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                    {user.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {user.is_active ? 'Active' : 'Blocked'}
                </span>
            </div>

            {/* Main Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Balance Card - ВИПРАВЛЕНО */}
                <div className="bg-card border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Coins size={16} />
                        <span className="text-sm">OMR Coins</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                        {user.balance.toLocaleString()} 💎
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        ≈ ${(user.balance / 100).toFixed(2)}
                    </p>
                </div>

                {/* Streak */}
                <div className="bg-card border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Gift size={16} />
                        <span className="text-sm">Bonus Streak</span>
                    </div>
                    <p className="text-2xl font-bold">{user.bonus_streak} 🔥</p>
                    <p className="text-xs text-muted-foreground mt-1">days in a row</p>
                </div>

                {/* Orders */}
                <div className="bg-card border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <ShoppingCart size={16} />
                        <span className="text-sm">Orders</span>
                    </div>
                    <p className="text-2xl font-bold">{user.orders?.length || 0}</p>
                </div>

                {/* Referrals */}
                <div className="bg-card border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <UserPlus size={16} />
                        <span className="text-sm">Referrals</span>
                    </div>
                    <p className="text-2xl font-bold">{user.referrals?.length || 0}</p>
                </div>
            </div>

            {/* Contact Info */}
            <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.email && (
                        <div className="flex items-center gap-3">
                            <Mail size={18} className="text-muted-foreground" />
                            <span>{user.email}</span>
                        </div>
                    )}
                    {user.phone && (
                        <div className="flex items-center gap-3">
                            <Phone size={18} className="text-muted-foreground" />
                            <span>{user.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <Clock size={18} className="text-muted-foreground" />
                        <span>Registered: {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    {user.last_login_at && (
                        <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-muted-foreground" />
                            <span>Last login: {new Date(user.last_login_at).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            {user.recent_transactions && user.recent_transactions.length > 0 && (
                <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Recent Transactions</h3>
                    <div className="space-y-2">
                        {user.recent_transactions.slice(0, 5).map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                    <p className="font-medium">{tx.description || tx.type}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(tx.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <span className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount} 💎
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin Actions */}
            <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Admin Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowBonusModal(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <Gift size={16} />
                        Add Coins
                    </button>
                    <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <CreditCard size={16} />
                        Give Premium
                    </button>
                    <button
                        onClick={handleToggleAdmin}
                        className={`px-4 py-2 rounded-lg transition-opacity flex items-center gap-2 ${
                            user.is_admin
                                ? 'bg-red-500 text-white hover:opacity-90'
                                : 'bg-purple-500 text-white hover:opacity-90'
                        }`}
                    >
                        <Shield size={16} />
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                        onClick={handleToggleActive}
                        className={`px-4 py-2 rounded-lg transition-opacity flex items-center gap-2 ${
                            user.is_active
                                ? 'bg-red-500 text-white hover:opacity-90'
                                : 'bg-green-500 text-white hover:opacity-90'
                        }`}
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
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowBonusModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card border rounded-xl p-6 max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4">Add OMR Coins</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={bonusAmount}
                                        onChange={(e) => setBonusAmount(Number(e.target.value))}
                                        min="1"
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        ≈ ${(bonusAmount / 100).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Reason</label>
                                    <input
                                        type="text"
                                        value={bonusReason}
                                        onChange={(e) => setBonusReason(e.target.value)}
                                        placeholder="e.g., Compensation, Promotion"
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                    />
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowBonusModal(false)}
                                        className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddCoins}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
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
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowSubscriptionModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card border rounded-xl p-6 max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4">Give Premium Subscription</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duration (days)</label>
                                    <input
                                        type="number"
                                        value={subscriptionDays}
                                        onChange={(e) => setSubscriptionDays(Number(e.target.value))}
                                        min="1"
                                        max="365"
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {[7, 30, 90, 365].map(days => (
                                        <button
                                            key={days}
                                            onClick={() => setSubscriptionDays(days)}
                                            className={`px-3 py-1 rounded-lg text-sm ${
                                                subscriptionDays === days
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted hover:bg-muted/80'
                                            }`}
                                        >
                                            {days}d
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowSubscriptionModal(false)}
                                        className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGiveSubscription}
                                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:opacity-90"
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