'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Gift, CheckCircle, CreditCard, ChevronRight, Shield, X
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(100);
  const [bonusReason, setBonusReason] = useState('');
  const [subscriptionDays, setSubscriptionDays] = useState(30);
  const { t } = useTranslation();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers({ search: search, skip: 0, limit: 100 });
      setUsers(response.users || []);
    } catch (error) {
      toast.error(t('toasts.dataLoadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddBonus = async () => {
    if (!selectedUser) return;
    try {
      await adminAPI.addUserBonus(selectedUser.id, bonusAmount, bonusReason);
      toast.success(t('admin.users.toasts.bonusAdded', { amount: bonusAmount }));
      setShowBonusModal(false);
      setBonusAmount(100);
      setBonusReason('');
      fetchUsers();
    } catch (error) {
      toast.error(t('admin.users.toasts.bonusError'));
    }
  };

  const handleGiveSubscription = async () => {
    if (!selectedUser) return;
    try {
      await adminAPI.giveSubscription(selectedUser.id, subscriptionDays);
      toast.success(t('admin.users.toasts.subscriptionGiven', { days: subscriptionDays }));
      setShowSubscriptionModal(false);
      setSubscriptionDays(30);
      fetchUsers();
    } catch (error) {
      toast.error(t('admin.users.toasts.subscriptionError'));
    }
  };

  const openBonusModal = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    setSelectedUser(user);
    setShowBonusModal(true);
  };

  const openSubscriptionModal = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    setSelectedUser(user);
    setShowSubscriptionModal(true);
  };

  // Стиль інпутів
  const inputClass = "w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:bg-background focus:border-primary/30 focus:ring-0 outline-none transition-all";

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">{t('admin.users.pageTitle')}</h2>
      </div>

      {/* Пошук */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder={t('admin.users.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-card border border-border/50 rounded-2xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all shadow-sm placeholder:text-muted-foreground"
        />
      </div>

      {users.length === 0 ? (
        <EmptyState message={t('admin.users.empty')} icon={Users} />
      ) : (
        <div className="card-minimal overflow-hidden">
           <ul className="divide-y divide-border/50">
            {users.map((user) => (
              <li
                key={user.id}
                onClick={() => router.push(`/admin/users/${user.id}`)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={user.photo_url || `https://avatar.vercel.sh/${user.id}.png`}
                      alt="avatar"
                      className="w-12 h-12 rounded-full object-cover border border-border"
                    />
                    {user.is_admin && (
                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-0.5 rounded-full border-2 border-card shadow-sm">
                        <Shield size={10} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-foreground flex items-center gap-2">
                      {user.first_name} {user.last_name}
                      {!user.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] uppercase font-bold tracking-wide">Blocked</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-mono text-xs opacity-70">ID: {user.telegram_id}</span>
                      {user.username && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                          <span className="text-primary font-medium">@{user.username}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Швидкі дії (при наведенні на десктопі) */}
                    <div className="hidden md:flex items-center gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={(e) => openBonusModal(e, user)}
                            className="p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-muted-foreground hover:text-yellow-500 transition-colors"
                            title={t('admin.users.addBonus')}
                        >
                            <Gift size={18} />
                        </button>
                        <button
                            onClick={(e) => openSubscriptionModal(e, user)}
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-muted-foreground hover:text-blue-500 transition-colors"
                            title={t('admin.users.giveSubscription')}
                        >
                            <CreditCard size={18} />
                        </button>
                    </div>

                    <div className="flex flex-col items-end mr-2">
                        <span className="text-sm font-bold text-foreground">{user.bonus_balance} 💎</span>
                    </div>
                    <ChevronRight className="text-muted-foreground/50 group-hover:text-primary transition-colors" size={20} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-3 text-yellow-500">
                        <Gift size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{t('admin.users.modals.addBonusTitle', { name: selectedUser?.first_name })}</h3>
                </div>

                <div className="space-y-4 mb-6">
                    <input
                        type="number"
                        placeholder={t('admin.users.modals.bonusAmount')}
                        value={bonusAmount}
                        onChange={(e) => setBonusAmount(Number(e.target.value))}
                        className={inputClass}
                    />
                    <input
                        type="text"
                        placeholder={t('admin.users.modals.bonusReason')}
                        value={bonusReason}
                        onChange={(e) => setBonusReason(e.target.value)}
                        className={inputClass}
                    />
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setShowBonusModal(false)} className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors">
                        {t('common.cancel')}
                    </button>
                    <button onClick={handleAddBonus} className="flex-1 btn-primary py-2.5 text-sm">
                        {t('admin.users.modals.add')}
                    </button>
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
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
                        <CreditCard size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{t('admin.users.modals.giveSubscriptionTitle', { name: selectedUser?.first_name })}</h3>
                </div>

                <div className="mb-6 relative">
                    <select
                        value={subscriptionDays}
                        onChange={(e) => setSubscriptionDays(Number(e.target.value))}
                        className={`${inputClass} appearance-none cursor-pointer`}
                    >
                        <option value={7}>{t('admin.users.modals.days.7')}</option>
                        <option value={30}>{t('admin.users.modals.days.30')}</option>
                        <option value={90}>{t('admin.users.modals.days.90')}</option>
                        <option value={365}>{t('admin.users.modals.days.365')}</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground rotate-90 pointer-events-none" size={16} />
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setShowSubscriptionModal(false)} className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors">
                        {t('common.cancel')}
                    </button>
                    <button onClick={handleGiveSubscription} className="flex-1 btn-primary py-2.5 text-sm">
                        {t('admin.users.modals.give')}
                    </button>
                </div>
            </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}