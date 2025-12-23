'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Sun, Moon, Globe, Bell, Shield, Trash2, ChevronRight, Loader
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme, ThemeName } from '@/lib/theme';

export default function SettingsPage() {
  const { theme, themeName, setThemeName } = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [notifications, setNotifications] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleThemeChange = (newTheme: ThemeName) => {
    setThemeName(newTheme);
    toast.success(t('settings.themeChanged'));
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    toast.success(t('settings.languageChanged'));
  };

  const handleDeleteAccount = async () => {
    toast.error(t('settings.deleteNotAvailable'));
    setShowDeleteConfirm(false);
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-2xl mx-auto px-5 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2.5 transition-colors"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMuted,
              borderRadius: theme.radius.lg,
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: theme.colors.text }}>
            {t('settings.title')}
          </h1>
        </div>

        <div className="space-y-4">
          <div
            className="p-5"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              {themeName === 'dark' ? (
                <Moon size={20} style={{ color: theme.colors.primary }} />
              ) : (
                <Sun size={20} style={{ color: theme.colors.accent }} />
              )}
              <h2 className="font-semibold" style={{ color: theme.colors.text }}>
                {t('settings.appearance')}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className="py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: themeName === 'light' ? theme.colors.primaryLight : theme.colors.surface,
                  border: themeName === 'light' ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                  color: themeName === 'light' ? theme.colors.primary : theme.colors.textSecondary,
                  borderRadius: theme.radius.lg,
                }}
              >
                <Sun size={16} />
                {t('settings.lightTheme')}
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className="py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: themeName === 'dark' ? theme.colors.primaryLight : theme.colors.surface,
                  border: themeName === 'dark' ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                  color: themeName === 'dark' ? theme.colors.primary : theme.colors.textSecondary,
                  borderRadius: theme.radius.lg,
                }}
              >
                <Moon size={16} />
                {t('settings.darkTheme')}
              </button>
            </div>
          </div>

          <div
            className="p-5"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Globe size={20} style={{ color: theme.colors.blue }} />
              <h2 className="font-semibold" style={{ color: theme.colors.text }}>
                {t('settings.language')}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLanguageChange('uk')}
                className="py-3 px-4 font-medium text-sm transition-all"
                style={{
                  backgroundColor: i18n.language === 'uk' ? theme.colors.blueLight : theme.colors.surface,
                  border: i18n.language === 'uk' ? `2px solid ${theme.colors.blue}` : `1px solid ${theme.colors.border}`,
                  color: i18n.language === 'uk' ? theme.colors.blue : theme.colors.textSecondary,
                  borderRadius: theme.radius.lg,
                }}
              >
                🇺🇦 Українська
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className="py-3 px-4 font-medium text-sm transition-all"
                style={{
                  backgroundColor: i18n.language === 'en' ? theme.colors.blueLight : theme.colors.surface,
                  border: i18n.language === 'en' ? `2px solid ${theme.colors.blue}` : `1px solid ${theme.colors.border}`,
                  color: i18n.language === 'en' ? theme.colors.blue : theme.colors.textSecondary,
                  borderRadius: theme.radius.lg,
                }}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          <div
            className="p-5"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={20} style={{ color: theme.colors.green }} />
                <div>
                  <h2 className="font-semibold" style={{ color: theme.colors.text }}>
                    {t('settings.notifications')}
                  </h2>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                    {t('settings.notificationsDesc')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNotifications(!notifications);
                  toast.success(notifications ? t('settings.notificationsOff') : t('settings.notificationsOn'));
                }}
                className="relative w-12 h-7 transition-colors"
                style={{
                  backgroundColor: notifications ? theme.colors.success : theme.colors.surface,
                  borderRadius: theme.radius.full,
                }}
              >
                <motion.div
                  className="absolute top-1 w-5 h-5"
                  animate={{ left: notifications ? 'calc(100% - 24px)' : '4px' }}
                  style={{
                    backgroundColor: '#FFF',
                    borderRadius: theme.radius.full,
                    boxShadow: theme.shadows.sm,
                  }}
                />
              </button>
            </div>
          </div>

          <button
            onClick={() => router.push('/profile/support')}
            className="w-full p-5 flex items-center justify-between"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          >
            <div className="flex items-center gap-3">
              <Shield size={20} style={{ color: theme.colors.purple }} />
              <span className="font-semibold" style={{ color: theme.colors.text }}>
                {t('settings.privacyPolicy')}
              </span>
            </div>
            <ChevronRight size={18} style={{ color: theme.colors.textMuted }} />
          </button>

          <div
            className="p-5"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Trash2 size={20} style={{ color: theme.colors.error }} />
              <h2 className="font-semibold" style={{ color: theme.colors.text }}>
                {t('settings.dangerZone')}
              </h2>
            </div>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {t('settings.deleteWarning')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 font-medium text-sm"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderRadius: theme.radius.lg,
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2.5 font-medium text-sm"
                    style={{
                      backgroundColor: theme.colors.error,
                      color: '#FFF',
                      borderRadius: theme.radius.lg,
                    }}
                  >
                    {t('settings.confirmDelete')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 font-medium text-sm transition-all"
                style={{
                  backgroundColor: theme.colors.errorLight,
                  color: theme.colors.error,
                  borderRadius: theme.radius.lg,
                }}
              >
                {t('settings.deleteAccount')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}