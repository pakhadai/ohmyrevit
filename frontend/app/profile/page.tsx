// frontend/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Heart, Users, HelpCircle,
  FileText, Gift, Mail, Save
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');

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
        <div className="flex items-center gap-4">
            <img
              src={user?.photo_url || `https://avatar.vercel.sh/${user?.username || user?.id}.png`}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-white/50 object-cover"
            />
          <div>
            <h1 className="text-2xl font-bold">{user?.first_name} {user?.last_name}</h1>
            <p className="opacity-90">@{user?.username || 'user'}</p>
          </div>
        </div>
      </div>

      {/* Редагування Email */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Контактна інформація</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Ваш email використовуватиметься для важливих сповіщень та відновлення доступу.
        </p>
        <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ваш Email"
                className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 rounded-lg bg-transparent"
              />
            </div>
            <button
                onClick={handleEmailSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0 flex items-center gap-2"
            >
                <Save size={18}/>
                <span>Зберегти</span>
            </button>
        </div>
      </div>

      {/* Меню профілю */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 rounded-lg p-5 flex items-center gap-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
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
    </div>
  );
}