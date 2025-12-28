'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sun, Moon, Globe, Bell, Shield, Trash2, ChevronRight,
  Loader, Mail, Lock, Check, X, Eye, EyeOff, User, Calendar
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme, ThemeName } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api';

const LANGUAGES = [
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export default function SettingsPage() {
  const { theme, themeName, setThemeName } = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuthStore();

  const [notifications, setNotifications] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setBirthDate(user?.birthDate || '');
  }, [user]);

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

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await profileAPI.updateProfile({
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate || undefined,
      });
      await refreshUser();
      toast.success(t('settings.profileUpdated') || 'Профіль оновлено');
      setShowProfileModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || t('settings.profileUpdateError') || 'Помилка оновлення профілю');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen pb-4" style={{ background: theme.colors.bgGradient }}>
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
              <Mail size={20} style={{ color: theme.colors.blue }} />
              <h2 className="font-semibold" style={{ color: theme.colors.text }}>
                {t('settings.email')}
              </h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {user?.email || t('settings.emailNotLinked')}
                </p>
              </div>
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor: theme.colors.primaryLight,
                  color: theme.colors.primary,
                  borderRadius: theme.radius.lg,
                }}
              >
                {user?.email ? t('settings.changeEmail') : t('settings.linkEmail')}
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
              <User size={20} style={{ color: theme.colors.green }} />
              <h2 className="font-semibold" style={{ color: theme.colors.text }}>
                {t('settings.profileInfo') || 'Профільна інформація'}
              </h2>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full py-3 text-sm font-medium transition-all"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
              }}
            >
              {t('settings.editProfile') || 'Редагувати профіль'}
            </button>
            <div className="mt-3 space-y-2 text-sm" style={{ color: theme.colors.textSecondary }}>
              <div className="flex justify-between">
                <span>{t('settings.firstName') || "Ім'я"}:</span>
                <span style={{ color: theme.colors.text }}>{firstName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.lastName') || 'Прізвище'}:</span>
                <span style={{ color: theme.colors.text }}>{lastName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.birthDate') || 'Дата народження'}:</span>
                <span style={{ color: theme.colors.text }}>
                  {birthDate ? new Date(birthDate).toLocaleDateString('uk-UA') : '—'}
                </span>
              </div>
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
              <Lock size={20} style={{ color: theme.colors.purple }} />
              <h2 className="font-semibold" style={{ color: theme.colors.text }}>
                {t('settings.password')}
              </h2>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-3 text-sm font-medium transition-all"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
              }}
            >
              {t('settings.changePassword')}
            </button>
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
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="py-3 px-4 font-medium text-sm transition-all text-left"
                  style={{
                    backgroundColor: i18n.language === lang.code ? theme.colors.blueLight : theme.colors.surface,
                    border: i18n.language === lang.code ? `2px solid ${theme.colors.blue}` : `1px solid ${theme.colors.border}`,
                    color: i18n.language === lang.code ? theme.colors.blue : theme.colors.textSecondary,
                    borderRadius: theme.radius.lg,
                  }}
                >
                  {lang.flag} {lang.name}
                </button>
              ))}
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
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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

      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal
            onClose={() => {
              setShowProfileModal(false);
              setFirstName(user?.firstName || '');
              setLastName(user?.lastName || '');
              setBirthDate(user?.birthDate || '');
            }}
            firstName={firstName}
            lastName={lastName}
            birthDate={birthDate}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setBirthDate={setBirthDate}
            onSave={handleSaveProfile}
            isSaving={isSavingProfile}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmailModal && (
          <EmailModal
            onClose={() => setShowEmailModal(false)}
            onSuccess={() => {
              setShowEmailModal(false);
              refreshUser();
            }}
            currentEmail={user?.email}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && (
          <PasswordModal
            onClose={() => setShowPasswordModal(false)}
            onSuccess={() => setShowPasswordModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileModal({
  onClose,
  firstName,
  lastName,
  birthDate,
  setFirstName,
  setLastName,
  setBirthDate,
  onSave,
  isSaving,
}: {
  onClose: () => void;
  firstName: string;
  lastName: string;
  birthDate: string;
  setFirstName: (val: string) => void;
  setLastName: (val: string) => void;
  setBirthDate: (val: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md p-6"
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius['2xl'],
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
            {t('settings.editProfile') || 'Редагувати профіль'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 transition-colors"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMuted,
              borderRadius: theme.radius.lg,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              {t('settings.firstName') || "Ім'я"}
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 text-base outline-none transition-colors"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                borderRadius: theme.radius.lg,
              }}
              placeholder={t('settings.firstNamePlaceholder') || "Введіть ім'я"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              {t('settings.lastName') || 'Прізвище'}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 text-base outline-none transition-colors"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                borderRadius: theme.radius.lg,
              }}
              placeholder={t('settings.lastNamePlaceholder') || 'Введіть прізвище'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              {t('settings.birthDate') || 'Дата народження'}
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 text-base outline-none transition-colors"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                borderRadius: theme.radius.lg,
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 font-medium transition-all"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 font-medium transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: isSaving ? theme.colors.surface : theme.colors.primary,
                color: isSaving ? theme.colors.textMuted : '#fff',
                borderRadius: theme.radius.lg,
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Check size={18} />
                  {t('common.save')}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function EmailModal({ onClose, onSuccess, currentEmail }: {
  onClose: () => void;
  onSuccess: () => void;
  currentEmail?: string;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState(currentEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(t('settings.enterEmail'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('settings.invalidEmail'));
      return;
    }

    setIsSubmitting(true);
    try {
      await profileAPI.updateProfile({ email });
      toast.success(t('settings.emailUpdated'));
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('settings.emailUpdateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
        style={{
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius['2xl'],
        }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: theme.colors.border }}>
          <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>
            {currentEmail ? t('settings.changeEmail') : t('settings.linkEmail')}
          </h2>
          <button onClick={onClose} className="p-2" style={{ color: theme.colors.textMuted }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textSecondary }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 font-semibold flex items-center justify-center gap-2"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#FFF',
              borderRadius: theme.radius.xl,
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            {isSubmitting ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
            {t('common.save')}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function PasswordModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('settings.fillAllFields'));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t('settings.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordsMismatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      await profileAPI.changePassword({ currentPassword, newPassword });
      toast.success(t('settings.passwordChanged'));
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('settings.passwordChangeError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
        style={{
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius['2xl'],
        }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: theme.colors.border }}>
          <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>
            {t('settings.changePassword')}
          </h2>
          <button onClick={onClose} className="p-2" style={{ color: theme.colors.textMuted }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textSecondary }}>
              {t('settings.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 text-sm outline-none"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.lg,
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: theme.colors.textMuted }}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textSecondary }}>
              {t('settings.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 text-sm outline-none"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.lg,
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: theme.colors.textMuted }}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textSecondary }}>
              {t('settings.confirmNewPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 font-semibold flex items-center justify-center gap-2"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#FFF',
              borderRadius: theme.radius.xl,
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            {isSubmitting ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
            {t('settings.changePassword')}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}