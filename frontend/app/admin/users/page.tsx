// ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
// frontend/app/admin/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Gift, X, CheckCircle, CreditCard
} from 'lucide-react';
// OLD: import { adminApi } from '@/lib/api/admin';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(100);
  const [bonusReason, setBonusReason] = useState('');
  const [subscriptionDays, setSubscriptionDays] = useState(30);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
// OLD:       const response = await adminApi.getUsers({ search: search, skip: 0, limit: 50 });
      const response = await adminAPI.getUsers({ search: search, skip: 0, limit: 50 });
      setUsers(response.users || []);
    } catch (error) {
      toast.error('Не вдалося завантажити користувачів');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdmin = async (userId: number) => {
    try {
// OLD:       await adminApi.toggleUserAdmin(userId);
      await adminAPI.toggleUserAdmin(userId);
      toast.success('Статус адміна оновлено');
      fetchUsers();
    } catch (error) {
      toast.error('Не вдалося оновити статус адміна');
    }
  };

  const toggleActive = async (userId: number) => {
    try {
// OLD:       await adminApi.toggleUserActive(userId);
      await adminAPI.toggleUserActive(userId);
      toast.success('Статус користувача оновлено');
      fetchUsers();
    } catch (error) {
      toast.error('Не вдалося оновити статус користувача');
    }
  };

    const handleAddBonus = async () => {
    if (!selectedUser) return;
    try {
// OLD:       await adminApi.addUserBonus(selectedUser.id, bonusAmount, bonusReason);
      await adminAPI.addUserBonus(selectedUser.id, bonusAmount, bonusReason);
      toast.success(`Додано ${bonusAmount} бонусів користувачеві`);
      setShowBonusModal(false);
      setBonusAmount(100);
      setBonusReason('');
      fetchUsers();
    } catch (error) {
      toast.error('Не вдалося додати бонус');
    }
  };

  const handleGiveSubscription = async () => {
    if (!selectedUser) return;
    try {
// OLD:       await adminApi.giveSubscription(selectedUser.id, subscriptionDays);
      await adminAPI.giveSubscription(selectedUser.id, subscriptionDays);
      toast.success(`Надано підписку на ${subscriptionDays} днів користувачеві`);
      setShowSubscriptionModal(false);
      setSubscriptionDays(30);
      fetchUsers();
    } catch (error) {
      toast.error('Не вдалося надати підписку');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Керування користувачами</h2>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Пошук користувачів..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>
      {users.length === 0 ? (
        <EmptyState message="Користувачів не знайдено" icon={Users} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Користувач</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Електронна пошта</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Бонуси</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-xs text-gray-500">@{user.username || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{user.email || 'N/A'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{user.bonus_balance}</span>
                        <button onClick={() => { setSelectedUser(user); setShowBonusModal(true); }} className="text-green-500 hover:text-green-600"><Gift size={16} /></button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {user.is_admin && (<span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded">Адмін</span>)}
                        {user.is_active ? (<span className="px-2 py-1 text-xs bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 rounded">Активний</span>) : (<span className="px-2 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded">Заблокований</span>)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => toggleAdmin(user.id)} className="p-1 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded" title="Змінити статус адміна">
                          <Users size={16} />
                        </button>
                        <button onClick={() => toggleActive(user.id)} className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded" title="Змінити статус активності">
                          {user.is_active ? <X size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button onClick={() => { setSelectedUser(user); setShowSubscriptionModal(true); }} className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded" title="Надати підписку">
                          <CreditCard size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Додати бонус для {selectedUser?.first_name}</h3>
            <input type="number" placeholder="Сума бонусу" value={bonusAmount} onChange={(e) => setBonusAmount(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-3" />
            <input type="text" placeholder="Причина (необов'язково)" value={bonusReason} onChange={(e) => setBonusReason(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-4" />
            <div className="flex gap-2">
              <button onClick={handleAddBonus} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Додати бонус</button>
              <button onClick={() => setShowBonusModal(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Скасувати</button>
            </div>
          </div>
        </div>
      )}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Надати підписку для {selectedUser?.first_name}</h3>
            <select value={subscriptionDays} onChange={(e) => setSubscriptionDays(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-4">
              <option value={7}>7 днів</option>
              <option value={30}>30 днів</option>
              <option value={90}>90 днів</option>
              <option value={180}>180 днів</option>
              <option value={365}>365 днів</option>
            </select>
            <div className="flex gap-2">
              <button onClick={handleGiveSubscription} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Надати підписку</button>
              <button onClick={() => setShowSubscriptionModal(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}