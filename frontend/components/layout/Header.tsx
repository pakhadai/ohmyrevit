'use client';

import { Search, Globe, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { useUIStore } from '@/store/uiStore';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const { setLanguage } = useLanguageStore();
  const { theme, toggleTheme } = useUIStore();
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'uk', label: '🇺🇦 УКР' },
    { code: 'en', label: '🇬🇧 ENG' },
    { code: 'ru', label: '🇷🇺 РУС' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 nav-blur">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              OhMyRevit
            </span>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={i18n.language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm focus:outline-none"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}