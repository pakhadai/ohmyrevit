'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import {
    ArrowLeft, User, Mail, Phone, Clock, Gift, CreditCard, Shield,
    CheckCircle, XCircle, UserPlus, ShoppingCart, Ban, Unlock, Calendar, ChevronRight
} from 'lucide-react'; // ДОДАНО: ChevronRight
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

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
            toast.success(res.is_active ? t('admin.users.toasts.userUnblocked') : t('admin.users.toasts.userBlocked'));
            fetchUserDetails();
        } catch (error) {
            toast.error(t('admin.users.toasts.activityError'));
        }
    };

    const handleAddBonus = async () => {
        if (!user) return;
        try {
            await adminAPI.addUserBonus(user.id, bonusAmount, bonusReason);
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
            await adminAPI.giveSubscription(user.id, subscriptionDays);
            toast.success(t('admin.users.toasts.subscriptionGiven', { days: subscriptionDays }));
            setShowSubscriptionModal(false);
            setSubscriptionDays(30);
            fetchUserDetails();
        } catch (error) {
            toast.error(t('admin.users.toasts.subscriptionError'));
        }
    };

    // Стиль інпутів
    const inputClass = "w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:bg-background focus:border-primary/30 focus:ring-0 outline-none transition-all";

    if (loading || !user) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push('/admin/users')} className="p-2 hover:bg-muted rounded-xl transition-colors">
                    <ArrowLeft size={24} className="text-muted-foreground" />
                </button>
                <h2 className="text-2xl font-bold text-foreground">{t('admin.users.profileTitle')}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Ліва колонка: Профіль та Дії */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card-minimal p-6 text-center relative overflow-hidden">
                        <div className="relative inline-block mb-4">
                            <img
                                src={user.photo_url || `https://avatar.vercel.sh/${user.id}.png`}
                                alt="avatar"
                                className="w-28 h-28 rounded-full object-cover border-4 border-card shadow-lg"
                            />
                            {user.is_admin && (
                                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full border-2 border-card shadow-sm" title="Admin">
                                    <Shield size={16} fill="currentColor" />
                                </div>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-foreground">{user.first_name} {user.last_name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">@{user.username || 'N/A'}</p>

                        <div className="flex justify-center gap-2 mb-6">
                           <span className={`px-3 py-1 text-xs font-bold rounded-full border ${user.is_active ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                                {user.is_active ? 'ACTIVE' : 'BLOCKED'}
                           </span>
                           <span className="px-3 py-1 text-xs font-bold rounded-full bg-muted text-muted-foreground border border-border">
                                ID: {user.telegram_id}
                           </span>
                        </div>

                        <div className="space-y-3">
                            <button onClick={() => setShowBonusModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-xl font-medium hover:bg-yellow-500/20 transition-colors">
                                <Gift size={18} /> {t('admin.users.addBonus')}
                            </button>
                            <button onClick={() => setShowSubscriptionModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-xl font-medium hover:bg-blue-500/20 transition-colors">
                                <CreditCard size={18} /> {t('admin.users.giveSubscription')}
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleToggleAdmin} className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors ${user.is_admin ? 'bg-muted text-muted-foreground hover:text-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                                    <Shield size={16} /> {user.is_admin ? t('admin.users.revokeAdmin') : t('admin.users.makeAdmin')}
                                </button>
                                <button onClick={handleToggleActive} className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors ${user.is_active ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'}`}>
                                    {user.is_active ? <Ban size={16} /> : <Unlock size={16} />} {user.is_active ? t('admin.users.block') : t('admin.users.unblock')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Права колонка: Інформація та Списки */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Деталі */}
                    <div className="card-minimal p-6">
                        <h4 className="font-bold text-foreground mb-5 flex items-center gap-2">
                            <User size={20} className="text-primary" />
                            {t('admin.users.details')}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                           <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('admin.users.email')}</span>
                               <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                   <Mail size={16} className="text-muted-foreground" />
                                   {user.email || <span className="text-muted-foreground italic">{t('admin.users.notSpecified')}</span>}
                               </div>
                           </div>
                           <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('admin.users.phone')}</span>
                               <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                   <Phone size={16} className="text-muted-foreground" />
                                   {user.phone || <span className="text-muted-foreground italic">{t('admin.users.notSpecified')}</span>}
                               </div>
                           </div>
                           <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('admin.users.bonuses')}</span>
                               <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                                   <Gift size={18} className="text-yellow-500" />
                                   {user.bonus_balance} 💎
                               </div>
                           </div>
                           <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('admin.users.registration')}</span>
                               <div className="flex items-center gap-2 text-sm text-foreground">
                                   <Calendar size={16} className="text-muted-foreground" />
                                   {new Date(user.created_at).toLocaleString()}
                               </div>
                           </div>
                           <div className="flex flex-col sm:col-span-2 border-t border-border/50 pt-4 mt-2">
                               <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t('admin.users.lastVisit')}</span>
                               <div className="flex items-center gap-2 text-sm text-foreground">
                                   <Clock size={16} className="text-muted-foreground" />
                                   {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : t('admin.users.wasNot')}
                               </div>
                           </div>
                        </div>
                    </div>

                    {/* Підписки */}
                    <div className="card-minimal p-6">
                       <div className="flex items-center justify-between mb-4">
                           <h4 className="font-bold text-foreground flex items-center gap-2">
                               <CreditCard size={20} className="text-blue-500" />
                               {t('admin.users.subscriptions', {count: user.subscriptions.length})}
                           </h4>
                       </div>

                       {user.subscriptions.length > 0 ? (
                           <div className="space-y-2">
                               {user.subscriptions.map(s => (
                                   <div key={s.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${
                                                s.status === 'active' ? 'bg-green-500' :
                                                s.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                                            }`}></div>
                                            <span className="text-sm font-medium capitalize">{s.status}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {s.status === 'active' ? (
                                                <>
                                                    {t('subscription.activeUntil')} <span className="font-medium text-foreground">{new Date(s.end_date).toLocaleDateString()}</span>
                                                </>
                                            ) : s.status === 'pending' ? (
                                                <span className="text-yellow-600">Очікує оплати</span>
                                            ) : (
                                                <span>Неактивна</span>
                                            )}
                                        </div>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <p className="text-sm text-muted-foreground italic py-2">{t('admin.users.noSubscriptions')}</p>
                       )}
                    </div>

                    {/* Замовлення */}
                    <div className="card-minimal p-6">
                       <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                           <ShoppingCart size={20} className="text-purple-500" />
                           {t('admin.users.orders', {count: user.orders.length})}
                       </h4>
                       {user.orders.length > 0 ? (
                           <div className="overflow-x-auto">
                               <table className="w-full text-sm text-left">
                                   <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                       <tr>
                                           <th className="px-3 py-2 rounded-l-lg">ID</th>
                                           <th className="px-3 py-2">Сума</th>
                                           <th className="px-3 py-2">Статус</th>
                                           <th className="px-3 py-2 rounded-r-lg text-right">Дата</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-border/50">
                                       {user.orders.map(o => (
                                           <tr key={o.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push(`/admin/orders/${o.id}`)}>
                                               <td className="px-3 py-3 font-medium">#{o.id}</td>
                                               <td className="px-3 py-3 font-bold">${o.final_total.toFixed(2)}</td>
                                               <td className="px-3 py-3">
                                                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                       o.status === 'paid' ? 'bg-green-500/10 text-green-600' :
                                                       o.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                                                       'bg-red-500/10 text-red-600'
                                                   }`}>
                                                       {o.status}
                                                   </span>
                                               </td>
                                               <td className="px-3 py-3 text-right text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       ) : <p className="text-sm text-muted-foreground italic py-2">{t('admin.users.noOrders')}</p>}
                    </div>

                    {/* Реферали */}
                    <div className="card-minimal p-6">
                       <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                           <UserPlus size={20} className="text-orange-500" />
                           {t('admin.users.referrals', {count: user.referrals.length})}
                       </h4>
                       {user.referrals.length > 0 ? (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                               {user.referrals.map(r => (
                                   <div key={r.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                                       <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                                           <User size={14} />
                                       </div>
                                       <div className="min-w-0">
                                           <p className="text-sm font-medium truncate">{r.first_name} {r.last_name}</p>
                                           <p className="text-xs text-muted-foreground">@{r.username || 'N/A'}</p>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       ) : <p className="text-sm text-muted-foreground italic py-2">{t('admin.users.noReferrals')}</p>}
                    </div>
                </div>
            </div>

            {/* Модальні вікна */}
            <AnimatePresence>
                {showBonusModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowBonusModal(false)}
                    >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        className="bg-card rounded-[24px] p-6 w-full max-w-xs shadow-2xl border border-border"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-yellow-500">
                                <Gift size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{t('admin.users.modals.addBonusTitle', {name: user?.first_name})}</h3>
                        </div>
                        <div className="space-y-4 mb-6">
                            <input type="number" placeholder={t('admin.users.modals.bonusAmount')} value={bonusAmount} onChange={(e) => setBonusAmount(Number(e.target.value))} className={inputClass} />
                            <input type="text" placeholder={t('admin.users.modals.bonusReason')} value={bonusReason} onChange={(e) => setBonusReason(e.target.value)} className={inputClass} />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowBonusModal(false)} className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors">{t('common.cancel')}</button>
                            <button onClick={handleAddBonus} className="flex-1 btn-primary py-2.5 text-sm">{t('admin.users.modals.add')}</button>
                        </div>
                    </motion.div>
                    </motion.div>
                )}
                {showSubscriptionModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowSubscriptionModal(false)}
                    >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        className="bg-card rounded-[24px] p-6 w-full max-w-xs shadow-2xl border border-border"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
                                <CreditCard size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{t('admin.users.modals.giveSubscriptionTitle', {name: user?.first_name})}</h3>
                        </div>
                        <div className="mb-6 relative">
                            <select value={subscriptionDays} onChange={(e) => setSubscriptionDays(Number(e.target.value))} className={`${inputClass} appearance-none cursor-pointer`}>
                                <option value={7}>{t('admin.users.modals.days.7')}</option>
                                <option value={30}>{t('admin.users.modals.days.30')}</option>
                                <option value={90}>{t('admin.users.modals.days.90')}</option>
                                <option value={365}>{t('admin.users.modals.days.365')}</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground rotate-90 pointer-events-none" size={16} />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowSubscriptionModal(false)} className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors">{t('common.cancel')}</button>
                            <button onClick={handleGiveSubscription} className="flex-1 btn-primary py-2.5 text-sm">{t('admin.users.modals.give')}</button>
                        </div>
                    </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}