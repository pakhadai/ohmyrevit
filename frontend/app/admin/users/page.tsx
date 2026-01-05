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
import { useTheme } from '@/lib/theme';

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
  const { theme } = useTheme();

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
          {t('admin.users.pageTitle')}
        </h2>
      </div>

      {/* Пошук */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2"
          size={20}
          style={{ color: theme.colors.textMuted }}
        />
        <input
          type="text"
          placeholder={t('admin.users.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 outline-none transition-all shadow-sm"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}80`,
            borderRadius: theme.radius['2xl'],
            color: theme.colors.text,
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
            e.target.style.borderColor = `${theme.colors.primary}4d`;
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = theme.shadows.sm;
            e.target.style.borderColor = `${theme.colors.border}80`;
          }}
        />
      </div>

      {users.length === 0 ? (
        <EmptyState message={t('admin.users.empty')} icon={Users} />
      ) : (
        <div
          className="overflow-hidden"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.md,
          }}
        >
          <ul style={{ borderTop: `1px solid ${theme.colors.border}80` }}>
            {users.map((user, index) => (
              <li
                key={user.id}
                onClick={() => router.push(`/admin/users/${user.id}`)}
                className="p-4 flex items-center justify-between cursor-pointer transition-colors group"
                style={{
                  borderBottom: index < users.length - 1 ? `1px solid ${theme.colors.border}80` : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.colors.surface}4d`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={user.photo_url || `https://avatar.vercel.sh/${user.id}.png`}
                      alt="avatar"
                      className="w-12 h-12 rounded-full object-cover"
                      style={{ border: `1px solid ${theme.colors.border}` }}
                    />
                    {user.is_admin && (
                      <div
                        className="absolute -bottom-1 -right-1 p-0.5 rounded-full shadow-sm"
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: '#fff',
                          border: `2px solid ${theme.colors.card}`,
                        }}
                      >
                        <Shield size={10} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                      {user.first_name} {user.last_name}
                      {!user.is_active && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide"
                          style={{
                            backgroundColor: theme.colors.errorLight,
                            color: theme.colors.error,
                          }}
                        >
                          Blocked
                        </span>
                      )}
                    </div>
                    <div className="text-sm flex items-center gap-2" style={{ color: theme.colors.textMuted }}>
                      <span className="font-mono text-xs opacity-70">ID: {user.telegram_id}</span>
                      {user.username && (
                        <>
                          <span
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: `${theme.colors.textMuted}80` }}
                          ></span>
                          <span className="font-medium" style={{ color: theme.colors.primary }}>
                            @{user.username}
                          </span>
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
                      className="p-2 rounded-lg transition-colors"
                      title={t('admin.users.addBonus')}
                      style={{ color: theme.colors.textMuted }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.orangeLight;
                        e.currentTarget.style.color = theme.colors.orange;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textMuted;
                      }}
                    >
                      <Gift size={18} />
                    </button>
                    <button
                      onClick={(e) => openSubscriptionModal(e, user)}
                      className="p-2 rounded-lg transition-colors"
                      title={t('admin.users.giveSubscription')}
                      style={{ color: theme.colors.textMuted }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.blueLight;
                        e.currentTarget.style.color = theme.colors.blue;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textMuted;
                      }}
                    >
                      <CreditCard size={18} />
                    </button>
                  </div>

                  <div className="flex flex-col items-end mr-2">
                    <span className="text-sm font-bold" style={{ color: theme.colors.text }}>
                      {user.bonus_balance} 💎
                    </span>
                  </div>
                  <ChevronRight
                    className="group-hover:scale-110 transition-transform"
                    size={20}
                    style={{ color: `${theme.colors.textMuted}80` }}
                  />
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowBonusModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="p-6 w-full max-w-xs"
              style={{
                backgroundColor: theme.colors.card,
                borderRadius: '24px',
                boxShadow: theme.shadows.xl,
                border: `1px solid ${theme.colors.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    backgroundColor: theme.colors.orangeLight,
                    color: theme.colors.orange,
                  }}
                >
                  <Gift size={24} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
                  {t('admin.users.modals.addBonusTitle', { name: selectedUser?.first_name })}
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                <input
                  type="number"
                  placeholder={t('admin.users.modals.bonusAmount')}
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: `${theme.colors.surface}80`,
                    border: '1px solid transparent',
                    borderRadius: theme.radius.xl,
                    color: theme.colors.text,
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = theme.colors.bg;
                    e.target.style.borderColor = `${theme.colors.primary}4d`;
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = `${theme.colors.surface}80`;
                    e.target.style.borderColor = 'transparent';
                  }}
                />
                <input
                  type="text"
                  placeholder={t('admin.users.modals.bonusReason')}
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="w-full px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: `${theme.colors.surface}80`,
                    border: '1px solid transparent',
                    borderRadius: theme.radius.xl,
                    color: theme.colors.text,
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = theme.colors.bg;
                    e.target.style.borderColor = `${theme.colors.primary}4d`;
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = `${theme.colors.surface}80`;
                    e.target.style.borderColor = 'transparent';
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBonusModal(false)}
                  className="flex-1 px-4 py-2.5 font-medium transition-colors"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textMuted,
                    borderRadius: theme.radius.xl,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.colors.surface}cc`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.surface;
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddBonus}
                  className="flex-1 py-2.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#fff',
                    borderRadius: theme.radius.xl,
                    boxShadow: theme.shadows.md,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = theme.shadows.lg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = theme.shadows.md;
                  }}
                >
                  {t('admin.users.modals.add')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSubscriptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowSubscriptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="p-6 w-full max-w-xs"
              style={{
                backgroundColor: theme.colors.card,
                borderRadius: '24px',
                boxShadow: theme.shadows.xl,
                border: `1px solid ${theme.colors.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    backgroundColor: theme.colors.blueLight,
                    color: theme.colors.blue,
                  }}
                >
                  <CreditCard size={24} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
                  {t('admin.users.modals.giveSubscriptionTitle', { name: selectedUser?.first_name })}
                </h3>
              </div>

              <div className="mb-6 relative">
                <select
                  value={subscriptionDays}
                  onChange={(e) => setSubscriptionDays(Number(e.target.value))}
                  className="w-full px-4 py-3 text-sm appearance-none cursor-pointer outline-none transition-all"
                  style={{
                    backgroundColor: `${theme.colors.surface}80`,
                    border: '1px solid transparent',
                    borderRadius: theme.radius.xl,
                    color: theme.colors.text,
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = theme.colors.bg;
                    e.target.style.borderColor = `${theme.colors.primary}4d`;
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = `${theme.colors.surface}80`;
                    e.target.style.borderColor = 'transparent';
                  }}
                >
                  <option value={7}>{t('admin.users.modals.days.7')}</option>
                  <option value={30}>{t('admin.users.modals.days.30')}</option>
                  <option value={90}>{t('admin.users.modals.days.90')}</option>
                  <option value={365}>{t('admin.users.modals.days.365')}</option>
                </select>
                <ChevronRight
                  className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                  size={16}
                  style={{ color: theme.colors.textMuted }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="flex-1 px-4 py-2.5 font-medium transition-colors"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textMuted,
                    borderRadius: theme.radius.xl,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.colors.surface}cc`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.surface;
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleGiveSubscription}
                  className="flex-1 py-2.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#fff',
                    borderRadius: theme.radius.xl,
                    boxShadow: theme.shadows.md,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = theme.shadows.lg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = theme.shadows.md;
                  }}
                >
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
