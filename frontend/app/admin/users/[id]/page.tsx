'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import {
    ArrowLeft, User, Mail, Phone, Clock, Gift, CreditCard, Shield,
    CheckCircle, XCircle, UserPlus, ShoppingCart
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    bonus_balance: number;
    bonus_streak: number;
    created_at: string;
    last_login_at?: string;
    subscriptions: any[];
    orders: any[];
    referrals: any[];
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
            const userData = await adminApi.getUserDetails(userId);
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
            const res = await adminApi.toggleUserAdmin(user.id);
            toast.success(res.is_admin ? t('admin.users.toasts.adminGranted') : t('admin.users.toasts.adminRevoked'));
            fetchUserDetails();
        } catch (error) {
            toast.error(t('admin.users.toasts.adminError'));
        }
    };

    const handleToggleActive = async () => {
        if (!user) return;
        try {
            const res = await adminApi.toggleUserActive(user.id);
            toast.success(res.is_active ? t('admin.users.toasts.userUnblocked') : t('admin.users.toasts.userBlocked'));
            fetchUserDetails();
        } catch (error) {
            toast.error(t('admin.users.toasts.activityError'));
        }
    };

    const handleAddBonus = async () => {
        if (!user) return;
        try {
            await adminApi.addUserBonus(user.id, bonusAmount, bonusReason);
            toast.success(t('admin.users.toasts.bonusAdded', { amount: bonusAmount }));
            setShowBonusModal(false);
            setBonusAmount(100);
            setBonusReason('');
            fetchUserDetails();
        } catch (error) {
            toast.error(t('admin.users.toasts.bonusError'));
        }
    };

    const handleGiveSubscription = async () => {
        if (!user) return;
        try {
            await adminApi.giveSubscription(user.id, subscriptionDays);
            toast.success(t('admin.users.toasts.subscriptionGiven', { days: subscriptionDays }));
            setShowSubscriptionModal(false);
            setSubscriptionDays(30);
            fetchUserDetails();
        } catch (error) {
            toast.error(t('admin.users.toasts.subscriptionError'));
        }
    };

    if (loading || !user) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.push('/admin/users')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold">{t('admin.users.pageTitle')}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                        <img src={user.photo_url || `https://avatar.vercel.sh/${user.id}.png`} alt="avatar" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-gray-200 dark:border-gray-700" />
                        <h3 className="text-lg font-bold">{user.first_name} {user.last_name}</h3>
                        <p className="text-sm text-gray-500">@{user.username || 'N/A'}</p>
                        <div className="mt-2 flex justify-center gap-2">
                           {user.is_admin && <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded">{t('profilePages.main.adminBadge')}</span>}
                           {user.is_active ? <span className="px-2 py-1 text-xs bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 rounded">{t('admin.promo.active')}</span> : <span className="px-2 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded">{t('admin.promo.inactive')}</span>}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
                        <h4 className="font-semibold mb-2">{t('admin.users.mainActions')}</h4>
                        <button onClick={() => setShowBonusModal(true)} className="w-full flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"><Gift size={16}/> {t('admin.users.addBonus')}</button>
                        <button onClick={() => setShowSubscriptionModal(true)} className="w-full flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><CreditCard size={16}/> {t('admin.users.giveSubscription')}</button>
                        <button onClick={handleToggleAdmin} className="w-full flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"><Shield size={16}/> {user.is_admin ? t('admin.users.revokeAdmin') : t('admin.users.makeAdmin')}</button>
                        <button onClick={handleToggleActive} className="w-full flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">{user.is_active ? <XCircle size={16}/> : <CheckCircle size={16}/>} {user.is_active ? t('admin.users.block') : t('admin.users.unblock')}</button>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h4 className="font-semibold mb-4">{t('admin.users.details')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                           <div className="flex items-center gap-2"><User size={16} className="text-gray-400"/> <strong>{t('admin.users.id')}</strong> {user.telegram_id}</div>
                           <div className="flex items-center gap-2"><Mail size={16} className="text-gray-400"/> <strong>{t('admin.users.email')}</strong> {user.email || t('admin.users.notSpecified')}</div>
                           <div className="flex items-center gap-2"><Phone size={16} className="text-gray-400"/> <strong>{t('admin.users.phone')}</strong> {user.phone || t('admin.users.notSpecified')}</div>
                           <div className="flex items-center gap-2"><Gift size={16} className="text-gray-400"/> <strong>{t('admin.users.bonuses')}</strong> {user.bonus_balance} 💎</div>
                           <div className="flex items-center gap-2 col-span-2"><Clock size={16} className="text-gray-400"/> <strong>{t('admin.users.registration')}</strong> {new Date(user.created_at).toLocaleString()}</div>
                           <div className="flex items-center gap-2 col-span-2"><Clock size={16} className="text-gray-400"/> <strong>{t('admin.users.lastVisit')}</strong> {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : t('admin.users.wasNot')}</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                       <h4 className="font-semibold mb-4 flex items-center gap-2"><CreditCard size={18}/> {t('admin.users.subscriptions', {count: user.subscriptions.length})}</h4>
                       {user.subscriptions.length > 0 ? (
                           <ul className="text-sm space-y-2">
                               {user.subscriptions.map(s => <li key={s.id} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><span>{t('admin.orders.status')} <strong>{s.status}</strong></span><span>{t('subscription.activeUntil')} {new Date(s.end_date).toLocaleDateString()}</span></li>)}
                           </ul>
                       ) : <p className="text-sm text-gray-500">{t('admin.users.noSubscriptions')}</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                       <h4 className="font-semibold mb-4 flex items-center gap-2"><ShoppingCart size={18}/> {t('admin.users.orders', {count: user.orders.length})}</h4>
                       {user.orders.length > 0 ? (
                           <ul className="text-sm space-y-2">
                               {user.orders.map(o => <li key={o.id} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><span>#{o.id} на <strong>${o.final_total.toFixed(2)}</strong></span><span>{new Date(o.created_at).toLocaleDateString()}</span></li>)}
                           </ul>
                       ) : <p className="text-sm text-gray-500">{t('admin.users.noOrders')}</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                       <h4 className="font-semibold mb-4 flex items-center gap-2"><UserPlus size={18}/> {t('admin.users.referrals', {count: user.referrals.length})}</h4>
                       {user.referrals.length > 0 ? (
                           <ul className="text-sm space-y-2">
                               {user.referrals.map(r => <li key={r.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">{r.first_name} {r.last_name || ''} (@{r.username})</li>)}
                           </ul>
                       ) : <p className="text-sm text-gray-500">{t('admin.users.noReferrals')}</p>}
                    </div>
                </div>
            </div>

            {showBonusModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                    <h3 className="text-lg font-semibold mb-4">{t('admin.users.modals.addBonusTitle', {name: user?.first_name})}</h3>
                    <input type="number" placeholder={t('admin.users.modals.bonusAmount')} value={bonusAmount} onChange={(e) => setBonusAmount(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-3" />
                    <input type="text" placeholder={t('admin.users.modals.bonusReason')} value={bonusReason} onChange={(e) => setBonusReason(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-4" />
                    <div className="flex gap-2">
                      <button onClick={handleAddBonus} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">{t('admin.users.modals.add')}</button>
                      <button onClick={() => setShowBonusModal(false)} className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">{t('common.cancel')}</button>
                    </div>
                  </div>
                </div>
            )}
            {showSubscriptionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                    <h3 className="text-lg font-semibold mb-4">{t('admin.users.modals.giveSubscriptionTitle', {name: user?.first_name})}</h3>
                    <select value={subscriptionDays} onChange={(e) => setSubscriptionDays(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-4">
                      <option value={7}>{t('admin.users.modals.days.7')}</option>
                      <option value={30}>{t('admin.users.modals.days.30')}</option>
                      <option value={90}>{t('admin.users.modals.days.90')}</option>
                      <option value={365}>{t('admin.users.modals.days.365')}</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleGiveSubscription} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">{t('admin.users.modals.give')}</button>
                      <button onClick={() => setShowSubscriptionModal(false)} className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">{t('common.cancel')}</button>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
}