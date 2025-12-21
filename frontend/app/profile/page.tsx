'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Settings, LogOut, Download, Heart, Gift, Users, HelpCircle, FileText,
  ChevronRight, Wallet, Shield, AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const menuItems = [
    { href: '/profile/wallet', label: t('profilePages.main.menu.wallet') || 'Гаманець', icon: Wallet, highlight: true },
    // ДОДАНО: Пункт налаштувань відразу після гаманця
    { href: '/profile/settings', label: t('profilePages.main.settings.title'), icon: Settings },
    { href: '/profile/downloads', label: t('profilePages.main.menu.downloads'), icon: Download },
    { href: '/profile/collections', label: t('profilePages.main.menu.collections'), icon: Heart },
    { href: '/profile/bonuses', label: t('profilePages.main.menu.bonuses'), icon: Gift },
    { href: '/profile/referrals', label: t('profilePages.main.menu.referrals'), icon: Users },
    { href: '/profile/support', label: t('profilePages.main.menu.support'), icon: HelpCircle },
    { href: '/profile/faq', label: t('profilePages.main.menu.faq'), icon: FileText }
  ];

  if (!isHydrated) return null;

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 space-y-6">

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center pt-2">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full p-1 bg-background border-2 border-primary/20 shadow-lg shadow-primary/10">
            <img
              src={user?.photoUrl || `https://avatar.vercel.sh/${user?.username || user?.id}.png`}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {user?.isAdmin && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm border border-background">
              {t('profilePages.main.adminBadge')}
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          {user?.firstName} {user?.lastName}
        </h1>
        <div className="flex flex-col items-center gap-1">
            {user?.username && (
            <p className="text-muted-foreground text-sm">@{user.username}</p>
            )}
            {!user?.email && (
                <button
                    onClick={() => router.push('/profile/settings')}
                    className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg mt-1"
                >
                    <AlertTriangle size={12} />
                    Прив'язати Email
                </button>
            )}
        </div>
      </div>

      {/* Balance Card */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => router.push('/profile/wallet')}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Image
              src="/omr_coin.png"
              alt="OMR"
              width={32}
              height={32}
            />
          </div>
          <div className="text-left">
            <p className="text-white/80 text-xs">{t('profilePages.main.stats.balance') || 'Баланс'}</p>
            <p className="text-2xl font-bold">{user?.balance?.toLocaleString() || 0} <span className="text-sm font-normal opacity-80">OMR</span></p>
          </div>
        </div>
        <ChevronRight size={24} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </motion.button>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-minimal p-4 text-center"
        >
          <Gift className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold text-foreground">{user?.bonusStreak || 0}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('profilePages.main.stats.streakDays')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-minimal p-4 text-center"
        >
          <Download className="w-5 h-5 mx-auto mb-1 text-green-500" />
          <p className="text-lg font-bold text-foreground">-</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('profilePages.main.stats.downloads')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-minimal p-4 text-center"
        >
          <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <p className="text-lg font-bold text-foreground">-</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('profilePages.main.stats.referrals')}</p>
        </motion.div>
      </div>

      {/* Admin Panel Button */}
      {user?.isAdmin && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push('/admin')}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Shield size={24} />
            <span className="font-bold">{t('profilePages.main.adminPanel')}</span>
          </div>
          <ChevronRight size={20} />
        </motion.button>
      )}

      {/* Menu Items */}
      <div className="card-minimal divide-y divide-border/50 overflow-hidden">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.href}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            onClick={() => router.push(item.href)}
            className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
              item.highlight ? 'bg-primary/5' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={item.highlight ? 'text-primary' : 'text-muted-foreground'} />
              <span className={`font-medium ${item.highlight ? 'text-primary' : 'text-foreground'}`}>
                {item.label}
              </span>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </motion.button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-colors font-medium text-sm"
      >
        <LogOut size={18} />
        <span>{t('profilePages.main.logout')}</span>
      </button>
    </div>
  );
}