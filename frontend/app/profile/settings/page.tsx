'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Mail, Key, User, Calendar, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import EmailLinkModal from '@/components/auth/EmailLinkModal';
import { AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    // FIX: camelCase props from store
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    birth_date: user?.birthDate || ''
  });

  const [passData, setPassData] = useState({ old: '', new: '' });
  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // API request uses snake_case, backend expects it
      const res = await api.patch('/auth/profile', formData);
      // res.data is from backend (snake_case). store expects camelCase.
      // But we can just use formData or wait for re-fetch.
      // Best to manually update store with camelCase values we just sent
      setUser({
        ...user!,
        firstName: formData.first_name,
        lastName: formData.last_name,
        birthDate: formData.birth_date
      });
      toast.success(t('profilePages.main.toasts.emailSaved'));
    } catch {
      toast.error(t('profilePages.main.toasts.emailError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', {
        old_password: passData.old,
        new_password: passData.new
      });
      toast.success('Пароль змінено');
      setPassData({ old: '', new: '' });
    } catch {
      toast.error('Невірний старий пароль');
    }
  };

  const hasEmail = !!user?.email;

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 space-y-8 max-w-xl">
      <h1 className="text-2xl font-bold">{t('profilePages.main.settings.title')}</h1>

      {/* --- Блок прив'язки Email (для TG користувачів) --- */}
      {!hasEmail && (
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-orange-800 dark:text-orange-200">Прив'яжіть Email</h3>
              <p className="text-sm text-orange-700/80 dark:text-orange-300/80 mt-1 mb-3">
                Це необхідно для відновлення доступу, покупок на сайті та отримання чеків.
              </p>
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Прив'язати Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Основна інформація --- */}
      <form onSubmit={handleUpdateProfile} className="space-y-5">
        <div className="flex items-center gap-2 text-lg font-semibold">
            <User size={20} className="text-primary" />
            <h2>Особисті дані</h2>
        </div>

        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1 mb-1 block">Ім'я</label>
                <input
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
                className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary/30 outline-none transition-all"
                />
            </div>
            <div>
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1 mb-1 block">Прізвище</label>
                <input
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
                className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary/30 outline-none transition-all"
                />
            </div>
            <div>
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1 mb-1 block">Дата народження</label>
                <div className="relative">
                    <input
                        type="date"
                        value={formData.birth_date}
                        onChange={e => setFormData({...formData, birth_date: e.target.value})}
                        className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary/30 outline-none transition-all"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                </div>
            </div>
        </div>

        <button disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <Save size={18} />
            {t('common.save')}
        </button>
      </form>

      {/* --- Email (Readonly якщо є) --- */}
      {hasEmail && (
          <div className="pt-6 border-t border-border/50 space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
                <Mail size={20} className="text-primary" />
                <h2>Email</h2>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl">
                <span className="font-medium text-green-900 dark:text-green-100">{user?.email}</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg">
                    <CheckCircle2 size={14} />
                    Підтверджено
                </div>
            </div>
          </div>
      )}

      {/* --- Зміна пароля (тільки якщо є Email) --- */}
      {hasEmail && (
        <form onSubmit={handleChangePassword} className="space-y-5 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2 text-lg font-semibold">
                <Key size={20} className="text-primary" />
                <h2>Зміна пароля</h2>
            </div>

            <div className="space-y-4">
                <input
                type="password"
                placeholder="Старий пароль"
                value={passData.old}
                onChange={e => setPassData({...passData, old: e.target.value})}
                className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary/30 outline-none transition-all"
                />
                <input
                type="password"
                placeholder="Новий пароль"
                value={passData.new}
                onChange={e => setPassData({...passData, new: e.target.value})}
                className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary/30 outline-none transition-all"
                />
            </div>
            <button className="btn-primary w-full">Змінити пароль</button>
        </form>
      )}

      <AnimatePresence>
        {showEmailModal && (
            <EmailLinkModal
                onClose={() => setShowEmailModal(false)}
                onSuccess={() => setShowEmailModal(false)}
            />
        )}
      </AnimatePresence>
    </div>
  );
}