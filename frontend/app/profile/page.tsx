// frontend/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Heart, Users, HelpCircle,
  FileText, Gift, Mail, Save, Settings,
  Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
  }, [user]);

  const handleEmailSave = async () => {
    try {
      const updatedUser = await profileAPI.updateProfile({ email });
      setUser(updatedUser);
      toast.success('Email успішно збережено!');
    } catch (error) {
      toast.error('Помилка при збереженні email.');
      console.error('Update email error:', error);
    }
  };

  const menuItems = [
    { href: '/profile/downloads', label: 'Завантаження', icon: Download },
    { href: '/profile/favorites', label: 'Вибрані', icon: Heart },
    { href: '/profile/bonuses', label: 'Бонуси', icon: Gift },
    { href: '/profile/referrals', label: 'Реферали', icon: Users },
    { href: '/profile/support', label: 'Підтримка', icon: HelpCircle },
    { href: '/profile/faq', label: 'FAQ', icon: FileText }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Шапка профілю */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={user?.photo_url || `https://avatar.vercel.sh/${user?.username || user?.id}.png`}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-white/50 object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">{user?.first_name} {user?.last_name}</h1>
              <p className="opacity-90">@{user?.username || 'user'}</p>
              {user?.is_admin && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                  <Shield size={12} />
                  Адміністратор
                </span>
              )}
            </div>
          </div>

          {/* Кнопка адмін-панелі для адміністраторів */}
          {user?.is_admin && (
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-all flex items-center gap-2"
            >
              <Shield size={18} />
              <span className="hidden sm:inline">Адмін-панель</span>
            </button>
          )}
        </div>
      </div>

      {/* Налаштування (згорнутий блок) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl mb-6 shadow-sm overflow-hidden">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="font-semibold">Налаштування</span>
          </div>
          {settingsOpen ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t dark:border-slate-700"
            >
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                  Контактна інформація
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Ваш email використовуватиметься для важливих сповіщень та відновлення доступу.
                </p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-grow">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ваш Email"
                      className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 rounded-lg bg-transparent text-sm"
                    />
                  </div>
                  <button
                    onClick={handleEmailSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0 flex items-center gap-2 text-sm"
                  >
                    <Save size={16}/>
                    <span>Зберегти</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Меню профілю */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-slate-800 rounded-lg p-5 flex items-center gap-4 cursor-pointer shadow-sm hover:shadow-md transition-all"
              >
                <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
                  <Icon size={22} className="text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Перейти до розділу</p>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Швидка статистика */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-purple-500">{user?.bonus_balance || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Бонусів</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-500">{user?.bonus_streak || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Днів стріку</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-500">0</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Завантажень</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-pink-500">0</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Рефералів</p>
        </div>
      </div>
    </div>
  );
}