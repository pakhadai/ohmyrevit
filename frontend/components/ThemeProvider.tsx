'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { ThemeContext, getTheme, ThemeName, lightTheme } from '@/lib/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ui-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const savedTheme = parsed?.state?.theme as ThemeName;
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeName(savedTheme);
        }
      } catch (e) {}
    }

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.colorScheme) {
      const tgTheme = tg.colorScheme as ThemeName;
      if (!stored) {
        setThemeName(tgTheme);
      }
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeName);

    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      const theme = getTheme(themeName);
      try {
        tg.setHeaderColor(theme.colors.bg);
        tg.setBackgroundColor(theme.colors.bg);
      } catch (e) {}
    }
  }, [themeName, mounted]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    try {
      const stored = localStorage.getItem('ui-storage');
      const parsed = stored ? JSON.parse(stored) : { state: {} };
      parsed.state.theme = name;
      localStorage.setItem('ui-storage', JSON.stringify(parsed));
    } catch (e) {}
  }, []);

  const theme = getTheme(themeName);
  const isDark = themeName === 'dark';

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: lightTheme, themeName: 'light', setTheme, isDark: false }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}