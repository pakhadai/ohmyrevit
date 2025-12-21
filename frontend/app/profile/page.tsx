'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useLanguageStore } from '@/store/languageStore';
import { profileAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Settings, LogOut, Download, Heart, Gift, Users, HelpCircle, FileText,
  ChevronRight, Mail, Globe, Moon, Sun, Shield, Wallet, AlertTriangle, Coins
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const { language, setLanguage } = useLanguageStore();
  const [email, setEmail] = useState(user?.email || '');
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    setIsHydrated(true);
    if (user?.email) setEmail(user.email);
  }, [user]);

  const handleSaveEmail = async () => {
    try {
      // NOTE: Here the API likely still expects and returns snake_case because it's a direct API call wrapper.
      // But we update the store with camelCase.
      const updated = await profileAPI.updateProfile({ email });
      // updated comes from API (snake_case), setUser expects User (camelCase).
      // Ideally, the store/API layer should handle this mapping, but for now we manually update.
      // Assuming profileAPI.updateProfile returns { email: '...' }
      if (updated.email) {
          setUser({ ...user!, email: updated.email });
      }
      toast.success(t('profilePages.main.toasts.emailSaved'));
    } catch {
      toast.error(t('profilePages.main.toasts.emailError'));
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const languages = [
    { code: 'uk', label: '🇺🇦 Українська' },
    { code: 'en', label: '🇬🇧 English' },
    { code: 'ru', label: '🇷🇺 Русский' },
    { code: 'de', label: '🇩🇪 Deutsch' },
    { code: 'es', label: '🇪🇸 Español' },
  ];

  const menuItems = [
    { href: '/profile/wallet', label: t('profilePages.main.menu.wallet') || 'Гаманець', icon: Wallet, highlight: true },
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
          {/* FIX: isAdmin instead of is_admin */}
          {user?.isAdmin && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm border border-background">
              {t('profilePages.main.adminBadge')}
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          {/* FIX: firstName/lastName */}
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
          {/* FIX: bonusStreak */}
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
      {/* FIX: isAdmin */}
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
      <div className="card-minimal divide-y divide-border">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.href}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            onClick={() => router.push(item.href)}
            className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
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

      {/* Settings */}
      <div className="card-minimal p-5 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Settings size={18} className="text-muted-foreground" />
          {t('profilePages.main.settings.title')}
        </h3>

        {/* Email */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {t('profilePages.main.settings.contactInfo')}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('profilePages.main.settings.emailPlaceholder')}
                className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-transparent rounded-xl text-foreground text-sm focus:border-primary/30 focus:bg-background outline-none transition-all"
              />
            </div>
            <button
              onClick={handleSaveEmail}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
            <Globe size={14} />
            {t('profilePages.main.settings.language')}
          </label>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  language === lang.code
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {t('profilePages.main.settings.theme')}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all ${
                theme === 'light'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <Sun size={16} />
              {t('profilePages.main.settings.light')}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all ${
                theme === 'dark'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <Moon size={16} />
              {t('profilePages.main.settings.dark')}
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-colors"
      >
        <LogOut size={20} />
        <span className="font-medium">{t('profilePages.main.logout')}</span>
      </button>
    </div>
  );
}