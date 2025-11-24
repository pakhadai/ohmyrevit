'use client';

import { useState, useEffect } from 'react';
import {
  Download, Heart, Users, HelpCircle,
  FileText, Gift, Mail, Save, Settings,
  Shield, ChevronDown, ChevronUp, Globe, Moon, Sun, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/store/languageStore';
import { useUIStore } from '@/store/uiStore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [email, setEmail] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { t, i18n } = useTranslation();

  const { setLanguage } = useLanguageStore();
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
    setIsHydrated(true);
  }, [user]);

  const handleEmailSave = async () => {
    try {
      const updatedUser = await profileAPI.updateProfile({ email });
      setUser(updatedUser);
      toast.success(t('profilePages.main.toasts.emailSaved'));
    } catch (error) {
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
  ];

  const menuItems = [
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

      <div className="flex flex-col items-center text-center pt-2">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full p-1 bg-background border-2 border-primary/20 shadow-lg shadow-primary/10">
            <img
              src={user?.photo_url || `https://avatar.vercel.sh/${user?.username || user?.id}.png`}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {user?.is_admin && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm border border-background">
              {t('profilePages.main.adminBadge')}
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-foreground">{user?.first_name} {user?.last_name}</h1>
        <p className="text-sm text-muted-foreground font-medium">@{user?.username || 'user'}</p>

        <div className="flex items-center gap-3 mt-5">
          {user?.is_admin && (
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:border-primary/30 transition-colors shadow-sm"
            >
              <Shield size={16} className="text-primary" />
              <span>{t('profilePages.main.adminPanel')}</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors shadow-sm"
          >
            <LogOut size={16} />
            <span>{t('profilePages.main.logout')}</span>
          </button>
        </div>
      </div>

      <div className="card-minimal overflow-hidden">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg text-foreground">
              <Settings size={20} />
            </div>
            <span className="font-semibold text-foreground">{t('profilePages.main.settings.title')}</span>
          </div>
          {settingsOpen ? (
            <ChevronUp size={20} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={20} className="text-muted-foreground" />
          )}
        </button>

        {settingsOpen && (
          <div className="border-t border-border">
            <div className="p-5 space-y-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  {t('profilePages.main.settings.contactInfo')}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-grow">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('profilePages.main.settings.emailPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-transparent focus:bg-background focus:border-primary/30 rounded-xl text-sm outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleEmailSave}
                    className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                  >
                    <Save size={18} />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 ml-1">
                  {t('profilePages.main.settings.emailDescription')}
                </p>
              </div>

              <div className="h-px bg-border w-full"></div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe size={12} /> {t('profilePages.main.settings.language')}
                  </label>
                  <div className="relative">
                    <select
                      value={i18n.language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="w-full appearance-none px-4 py-2.5 bg-muted/50 border border-transparent rounded-xl text-sm focus:bg-background focus:border-primary/30 outline-none cursor-pointer"
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    {theme === 'light' ? <Sun size={12} /> : <Moon size={12} />}
                    {t('profilePages.main.settings.theme')}
                  </label>
                  <div className="flex bg-muted/50 p-1 rounded-xl">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Sun size={14} /> {t('profilePages.main.settings.light')}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Moon size={14} /> {t('profilePages.main.settings.dark')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          {t('profilePages.main.menu.goToSection')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className="card-minimal p-4 flex items-center gap-4 cursor-pointer group hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-secondary-foreground group-hover:scale-110 transition-transform duration-200">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm">{item.label}</h3>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    <ChevronDown size={16} className="-rotate-90" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}