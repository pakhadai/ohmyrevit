'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useLanguageStore } from '@/store/languageStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
    Mail, Key, User, Calendar, Save, AlertCircle,
    CheckCircle2, ArrowLeft, Globe, Sun, Moon, Lock, Settings // <--- ДОДАНО ТУТ
} from 'lucide-react';
import EmailLinkModal from '@/components/auth/EmailLinkModal';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  // --- Стейт для редагування профілю ---
  const [formData, setFormData] = useState({
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    birth_date: user?.birthDate || ''
  });

  // --- Стейт для пароля (додано confirm) ---
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });

  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // --- Список мов ---
  const languages = [
    { code: 'uk', label: '🇺🇦 Українська' },
    { code: 'en', label: '🇬🇧 English' },
    { code: 'ru', label: '🇷🇺 Русский' },
    { code: 'de', label: '🇩🇪 Deutsch' },
    { code: 'es', label: '🇪🇸 Español' },
  ];

  // Збереження особистих даних
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/auth/profile', formData);

      setUser({
        ...user!,
        firstName: formData.first_name,
        lastName: formData.last_name,
        birthDate: formData.birth_date
      });
      toast.success(t('common.save') + ' успішно');
    } catch {
      toast.error(t('toasts.genericError'));
    } finally {
      setLoading(false);
    }
  };

  // Зміна пароля з перевіркою підтвердження
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passData.new !== passData.confirm) {
        toast.error('Нові паролі не співпадають');
        return;
    }

    if (passData.new.length < 8) {
        toast.error('Пароль має бути не менше 8 символів');
        return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        old_password: passData.old,
        new_password: passData.new
      });
      toast.success('Пароль успішно змінено');
      setPassData({ old: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Помилка зміни пароля');
    } finally {
      setLoading(false);
    }
  };

  const hasEmail = !!user?.email;

  const inputClass = "w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl text-foreground text-sm focus:bg-background focus:border-primary/30 focus:ring-0 outline-none transition-all";
  const labelClass = "text-xs font-bold uppercase text-muted-foreground ml-1 mb-1.5 block tracking-wider";

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">{t('profilePages.main.settings.title')}</h1>
      </div>

      {/* --- Блок прив'язки Email (якщо немає) --- */}
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
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-orange-500/20"
              >
                Прив'язати Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Налаштування інтерфейсу (Мова і Тема) --- */}
      <div className="card-minimal p-5 space-y-5">
        <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings size={20} className="text-primary" />
            Інтерфейс
        </h2>

        {/* Мова */}
        <div>
          <label className={labelClass}>
            <div className="flex items-center gap-1.5">
                <Globe size={14} />
                {t('profilePages.main.settings.language')}
            </div>
          </label>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                  language === lang.code
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Тема */}
        <div>
          <label className={labelClass}>
             {t('profilePages.main.settings.theme')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
                theme === 'light'
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10'
                  : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted'
              }`}
            >
              <Sun size={18} />
              {t('profilePages.main.settings.light')}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
                theme === 'dark'
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10'
                  : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted'
              }`}
            >
              <Moon size={18} />
              {t('profilePages.main.settings.dark')}
            </button>
          </div>
        </div>
      </div>

      {/* --- Особисті дані --- */}
      <form onSubmit={handleUpdateProfile} className="card-minimal p-5 space-y-5">
        <h2 className="text-lg font-bold flex items-center gap-2">
            <User size={20} className="text-blue-500" />
            Особисті дані
        </h2>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className={labelClass}>Ім'я</label>
                <input
                    value={formData.first_name}
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                    className={inputClass}
                />
            </div>
            <div>
                <label className={labelClass}>Прізвище</label>
                <input
                    value={formData.last_name}
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                    className={inputClass}
                />
            </div>
        </div>

        <div>
            <label className={labelClass}>Дата народження</label>
            <div className="relative">
                <input
                    type="date"
                    value={formData.birth_date}
                    onChange={e => setFormData({...formData, birth_date: e.target.value})}
                    className={inputClass}
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
            </div>
        </div>

        {/* Email Display / Change */}
        {hasEmail && (
            <div>
                <label className={labelClass}>Email</label>
                <div className="flex items-center gap-2">
                     <div className="flex-1 relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            value={user?.email}
                            disabled
                            className={`${inputClass} pl-11 bg-muted opacity-70`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                             <CheckCircle2 size={18} className="text-green-500" />
                        </div>
                     </div>
                     <button
                        type="button"
                        onClick={() => setShowEmailModal(true)}
                        className="px-4 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm font-medium transition-colors"
                     >
                        Змінити
                     </button>
                </div>
            </div>
        )}

        <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
        >
            <Save size={18} />
            {t('common.save')}
        </button>
      </form>

      {/* --- Зміна пароля --- */}
      {hasEmail && (
        <form onSubmit={handleChangePassword} className="card-minimal p-5 space-y-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <Key size={20} className="text-yellow-500" />
                Безпека
            </h2>

            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Старий пароль</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="password"
                            value={passData.old}
                            onChange={e => setPassData({...passData, old: e.target.value})}
                            className={`${inputClass} pl-11`}
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Новий пароль</label>
                        <input
                            type="password"
                            value={passData.new}
                            onChange={e => setPassData({...passData, new: e.target.value})}
                            className={inputClass}
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Повторіть новий пароль</label>
                        <input
                            type="password"
                            value={passData.confirm}
                            onChange={e => setPassData({...passData, confirm: e.target.value})}
                            className={`${inputClass} ${passData.confirm && passData.new !== passData.confirm ? 'border-red-500 focus:border-red-500' : ''}`}
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !passData.old || !passData.new || !passData.confirm}
                className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-medium transition-colors disabled:opacity-50"
            >
                Змінити пароль
            </button>
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