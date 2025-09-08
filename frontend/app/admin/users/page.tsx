'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, ChevronRight } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers({ search, skip: 0, limit: 100 });
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
    </div>
  );
}