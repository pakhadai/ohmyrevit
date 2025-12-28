'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  Settings, LogOut, Download, Heart, Gift, Users, HelpCircle, FileText,
  ChevronRight, Wallet, Shield, User as UserIcon, Copy, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

// --- ТИПИ ---
interface MenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

// --- ТЕМА (з підтримкою Telegram) ---
// --- SKELETON КОМПОНЕНТИ ---
const SkeletonBox = ({ className, isDark }: { className: string; isDark: boolean }) => (
  <div
    className={`animate-pulse rounded-2xl ${className}`}
    style={{ backgroundColor: isDark ? '#333' : '#E5E5E5' }}
  />
);

const ProfileSkeleton = ({ theme, isDark }: { theme: any; isDark: boolean }) => {
  return (
    <div className="min-h-screen pb-2" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Ліва колонка */}
          <div className="lg:col-span-4 space-y-6">
            <div
              className="rounded-[32px] p-6"
              style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 }}
            >
              <div className="flex items-center gap-5">
                <SkeletonBox className="w-24 h-24 !rounded-[24px]" isDark={isDark} />
                <div className="flex-1 space-y-3">
                  <SkeletonBox className="h-6 w-32" isDark={isDark} />
                  <SkeletonBox className="h-4 w-24" isDark={isDark} />
                  <SkeletonBox className="h-8 w-28 !rounded-full" isDark={isDark} />
                </div>
              </div>
              <div className="mt-4">
                <SkeletonBox className="h-20 w-full !rounded-[24px]" isDark={isDark} />
              </div>
            </div>
          </div>

          {/* Права колонка */}
          <div className="lg:col-span-8 space-y-6">
            {[2, 2, 4].map((count, groupIndex) => (
              <div key={groupIndex}>
                <SkeletonBox className="h-4 w-20 mb-3 ml-4" isDark={isDark} />
                <div
                  className="rounded-[28px] p-2"
                  style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 }}
                >
                  {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <SkeletonBox className="w-11 h-11 !rounded-[16px]" isDark={isDark} />
                      <SkeletonBox className="h-5 w-32" isDark={isDark} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- МОДАЛЬНЕ ВІКНО ПІДТВЕРДЖЕННЯ ---
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  theme,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  theme: any;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-[28px] p-6 shadow-2xl"
        style={{ backgroundColor: theme.colors.card }}
      >
        <h3
          className="text-xl font-bold mb-2"
          style={{ color: theme.colors.text }}
        >
          {title}
        </h3>
        <p
          className="text-sm mb-6"
          style={{ color: theme.colors.textSecondary }}
        >
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl font-semibold text-sm transition-all active:scale-95"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-2xl font-semibold text-sm bg-red-500 text-white hover:bg-red-600 transition-all active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ГОЛОВНИЙ КОМПОНЕНТ ---
export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  // Ініціалізація теми Telegram
  useEffect(() => {
    setIsHydrated(true);

    // Перевіряємо Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      // Встановлюємо тему з Telegram
      const colorScheme = tg.colorScheme || 'light';
      setIsDarkMode(colorScheme === 'dark');

      // Слухаємо зміни теми
      tg.onEvent('themeChanged', () => {
        setIsDarkMode(tg.colorScheme === 'dark');
      });

      // Налаштовуємо кнопку "Назад"
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        router.back();
      });

      // Розширюємо на весь екран
      tg.expand();
    } else {
      // Fallback для браузера - перевіряємо системну тему
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);

      // Слухаємо зміни системної теми
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);

      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [router]);

  // Симуляція завантаження даних
  useEffect(() => {
    if (isHydrated) {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  // Приховуємо кнопку "Назад" при розмонтуванні
  useEffect(() => {
    return () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, []);

  const { theme, isDark } = useTheme();

  const handleLogout = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const confirmLogout = useCallback(() => {
    logout();
    setShowLogoutModal(false);

    // Закриваємо Mini App якщо в Telegram
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.close();
    } else {
      router.push('/');
    }
  }, [logout, router]);

  const copyId = useCallback(() => {
    if (user?.telegramId || user?.id) {
      const idToCopy = (user?.telegramId || user?.id).toString();
      navigator.clipboard.writeText(idToCopy);
      toast.success(t('profilePages.main.idCopied') || 'ID скопійовано', {
        style: {
          borderRadius: '12px',
          background: isDarkMode ? '#333' : '#333',
          color: '#fff',
        },
      });
    }
  }, [user, t, isDarkMode]);

  // --- МЕНЮ ГРУПИ (з консистентними стилями) ---

  const groupMain: MenuItem[] = [
    {
      href: '/profile/wallet',
      label: t('profilePages.main.menu.wallet') || 'Гаманець',
      icon: Wallet,
      iconColor: theme.colors.blue,
      iconBg: theme.colors.blueLight,
    },
    {
      href: '/profile/settings',
      label: t('profilePages.main.menu.settings') || 'Налаштування',
      icon: Settings,
      iconColor: theme.colors.textSecondary,
      iconBg: theme.colors.surface,
    },
  ];

  const groupContent: MenuItem[] = [
    {
      href: '/profile/downloads',
      label: t('profilePages.main.menu.downloads') || 'Завантаження',
      icon: Download,
      iconColor: theme.colors.green,
      iconBg: theme.colors.greenLight,
    },
    {
      href: '/profile/collections',
      label: t('profilePages.main.menu.collections') || 'Колекції',
      icon: Heart,
      iconColor: theme.colors.pink,
      iconBg: theme.colors.pinkLight,
    },
  ];

  const groupGeneral: MenuItem[] = [
    {
      href: '/profile/bonuses',
      label: t('profilePages.main.menu.bonuses') || 'Бонуси',
      icon: Gift,
      iconColor: theme.colors.purple,
      iconBg: theme.colors.purpleLight,
    },
    {
      href: '/profile/referrals',
      label: t('profilePages.main.menu.referrals') || 'Реферали',
      icon: Users,
      iconColor: theme.colors.orange,
      iconBg: theme.colors.orangeLight,
    },
    {
      href: '/profile/support',
      label: t('profilePages.main.menu.support') || 'Підтримка',
      icon: HelpCircle,
      iconColor: theme.colors.info,
      iconBg: theme.colors.infoLight,
    },
    {
      href: '/profile/faq',
      label: t('profilePages.main.menu.faq') || 'FAQ',
      icon: FileText,
      iconColor: theme.colors.warning,
      iconBg: theme.colors.warningLight,
    },
  ];

  // --- КОМПОНЕНТ ПУНКТУ МЕНЮ ---
  const MenuItemComponent = ({ item, isLast }: { item: MenuItem; isLast: boolean }) => (
    <Link href={item.href}>
      <div
        className={`group flex items-center justify-between p-4 transition-colors cursor-pointer rounded-2xl`}
        style={{
          borderBottom: !isLast ? `1px solid ${theme.colors.border}` : 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.surfaceHover)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-[16px] flex items-center justify-center transition-colors"
            style={{ backgroundColor: item.iconBg }}
          >
            <item.icon size={22} strokeWidth={1.8} style={{ color: item.iconColor }} />
          </div>
          <span
            className="text-[15px] font-medium"
            style={{ color: theme.colors.text }}
          >
            {item.label}
          </span>
        </div>
        <ChevronRight
          size={18}
          className="transition-colors"
          style={{ color: theme.colors.textMuted }}
        />
      </div>
    </Link>
  );

  // --- РЕНДЕР ---

  if (!isHydrated) return null;

  if (isLoading) {
    return <ProfileSkeleton theme={theme} isDark={isDark} />;
  }

  return (
    <>
      <div
        className="min-h-screen pb-2 overflow-x-hidden"
        style={{ background: theme.colors.bgGradient }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

            {/* --- ЛІВА КОЛОНКА (Профіль) --- */}
            <div className="lg:col-span-4 space-y-6">

              {/* КАРТКА ПРОФІЛЮ */}
              <div
                className="rounded-[32px] overflow-hidden shadow-sm"
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div className="p-6 pb-2">
                  <div className="flex items-center gap-5">
                    {/* Аватар */}
                    <div className="relative shrink-0">
                      <div
                        className="w-24 h-24 rounded-[24px] overflow-hidden flex items-center justify-center shadow-inner"
                        style={{
                          backgroundColor: theme.colors.surface,
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        {user?.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon size={36} style={{ color: theme.colors.textMuted }} />
                        )}
                      </div>
                      {user?.isAdmin && (
                        <div
                          className="absolute -bottom-2 -right-2 bg-black text-white p-1.5 rounded-xl shadow-lg"
                          style={{ borderWidth: 4, borderColor: theme.colors.card }}
                          title={t('profilePages.main.admin.badge') || 'Адміністратор'}
                        >
                          <Shield size={14} fill="currentColor" />
                        </div>
                      )}
                    </div>

                    {/* Інфо */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                      <div>
                        <h1
                          className="text-xl font-bold leading-tight tracking-tight truncate"
                          style={{ color: theme.colors.text }}
                        >
                          {user?.firstName} {user?.lastName}
                        </h1>
                        {user?.username && (
                          <p
                            className="text-sm font-medium"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            @{user.username}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={copyId}
                        className="group flex items-center gap-2 w-fit px-3 py-1.5 rounded-full transition-all active:scale-95"
                        style={{
                          backgroundColor: theme.colors.surface,
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: theme.colors.textMuted }}
                        >
                          ID
                        </span>
                        <span
                          className="text-xs font-mono font-medium"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          {user?.telegramId || user?.id}
                        </span>
                        <Copy size={12} style={{ color: theme.colors.textMuted }} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Баланс */}
                <div className="p-2">
                  <Link href="/profile/wallet">
                    <div
                      className="p-4 rounded-[24px] transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                      style={{ backgroundColor: theme.colors.surface }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.surface)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: theme.colors.card }}
                        >
                          <Image src="/omr_coin.png" alt="OMR" width={28} height={28} />
                        </div>
                        <div className="flex flex-col">
                          <span
                            className="text-xs font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: theme.colors.textMuted }}
                          >
                            {t('profilePages.main.balance') || 'Баланс'}
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className="text-2xl font-bold"
                              style={{ color: theme.colors.text }}
                            >
                              {user?.balance?.toLocaleString() || '0'}
                            </span>
                            <span
                              className="text-sm font-semibold"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              OMR
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ backgroundColor: theme.colors.card, color: theme.colors.textMuted }}
                      >
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* --- ПРАВА КОЛОНКА (Меню) --- */}
            <div className="lg:col-span-8 space-y-6">

              {/* КНОПКА АДМІНА */}
              {user?.isAdmin && (
                <Link href="/admin" className="block">
                  <div className="w-full p-5 rounded-[28px] bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                        <Sparkles size={24} className="text-yellow-300" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {t('profilePages.main.admin.title') || 'Панель адміністратора'}
                        </h3>
                        <p className="text-sm text-white/60">
                          {t('profilePages.main.admin.description') || 'Керування користувачами та контентом'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-white/50" />
                  </div>
                </Link>
              )}

              {/* ОСНОВНЕ */}
              <div>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-3 ml-4"
                  style={{ color: theme.colors.textMuted }}
                >
                  {t('profilePages.main.sections.main') || 'Головне'}
                </h3>
                <div
                  className="rounded-[28px] p-2 shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {groupMain.map((item, index) => (
                    <MenuItemComponent
                      key={item.href}
                      item={item}
                      isLast={index === groupMain.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* КОНТЕНТ */}
              <div>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-3 ml-4"
                  style={{ color: theme.colors.textMuted }}
                >
                  {t('profilePages.main.sections.content') || 'Мій контент'}
                </h3>
                <div
                  className="rounded-[28px] p-2 shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {groupContent.map((item, index) => (
                    <MenuItemComponent
                      key={item.href}
                      item={item}
                      isLast={index === groupContent.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* ІНШЕ */}
              <div>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-3 ml-4"
                  style={{ color: theme.colors.textMuted }}
                >
                  {t('profilePages.main.sections.other') || 'Інше'}
                </h3>
                <div
                  className="rounded-[28px] p-2 shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {groupGeneral.map((item, index) => (
                    <MenuItemComponent
                      key={item.href}
                      item={item}
                      isLast={index === groupGeneral.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* ВИХІД - переміщено вниз */}
              <div>
                <div
                  className="rounded-[28px] p-2 shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <button
                    onClick={handleLogout}
                    className="group flex items-center justify-between p-4 transition-colors cursor-pointer rounded-2xl w-full"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.surfaceHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-11 h-11 rounded-[16px] flex items-center justify-center transition-colors"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                      >
                        <LogOut size={22} strokeWidth={1.8} style={{ color: '#EF4444' }} />
                      </div>
                      <span
                        className="text-[15px] font-medium"
                        style={{ color: '#EF4444' }}
                      >
                        {t('profilePages.main.logout') || 'Вийти'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* МОДАЛЬНЕ ВІКНО ПІДТВЕРДЖЕННЯ ВИХОДУ */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title={t('profilePages.main.logoutModal.title') || 'Вийти з акаунту?'}
        message={t('profilePages.main.logoutModal.message') || 'Ви впевнені, що хочете вийти? Вам потрібно буде увійти знову.'}
        confirmText={t('profilePages.main.logoutModal.confirm') || 'Вийти'}
        cancelText={t('profilePages.main.logoutModal.cancel') || 'Скасувати'}
        theme={theme}
      />
    </>
  );
}