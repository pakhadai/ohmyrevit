'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Gift, X, CheckCircle, CreditCard, ChevronRight
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
      const response = await adminApi.getUsers({ search: search, skip: 0, limit: 100 });
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
      await adminApi.addUserBonus(selectedUser.id, bonusAmount, bonusReason);
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
      await adminApi.giveSubscription(selectedUser.id, subscriptionDays);
      toast.success(t('admin.users.toasts.subscriptionGiven', { days: subscriptionDays }));
      setShowSubscriptionModal(false);
      setSubscriptionDays(30);
      fetchUsers();
    } catch (error) {
      toast.error(t('admin.users.toasts.subscriptionError'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">{t('admin.users.pageTitle')}</h2>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('admin.users.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>
      {users.length === 0 ? (
        <EmptyState message={t('admin.users.empty')} icon={Users} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
           <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <li
                key={user.id}
                onClick={() => router.push(`/admin/users/${user.id}`)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={user.photo_url || `https://avatar.vercel.sh/${user.id}.png`}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">{user.first_name} {user.last_name}</div>
                    <div className="text-sm text-gray-500">
                      ID: {user.telegram_id}
                      {user.username && ` • @${user.username}`}
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" />
              </li>
            ))}
          </ul>
        </div>
      )}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">{t('admin.users.modals.addBonusTitle', { name: selectedUser?.first_name })}</h3>
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
            <h3 className="text-lg font-semibold mb-4">{t('admin.users.modals.giveSubscriptionTitle', { name: selectedUser?.first_name })}</h3>
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