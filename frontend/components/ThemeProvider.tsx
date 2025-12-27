'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { themes, ThemeName, Theme } from '@/lib/theme';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  isDark: boolean;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeNameState] = useState<ThemeName>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const detectTheme = (): ThemeName => {
      try {
        const WebApp = (window as any).Telegram?.WebApp;
        if (WebApp?.colorScheme) {
          return WebApp.colorScheme as ThemeName;
        }
      } catch (e) {}

      const saved = localStorage.getItem('theme') as ThemeName | null;
      if (saved && (saved === 'light' || saved === 'dark')) {
        return saved;
      }

      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      return 'light';
    };

    const initialTheme = detectTheme();
    setThemeNameState(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);

    try {
      const WebApp = (window as any).Telegram?.WebApp;
      if (WebApp) {
        const handleThemeChange = () => {
          const newTheme = WebApp.colorScheme as ThemeName;
          setThemeNameState(newTheme);
          applyTheme(newTheme);
        };
        WebApp.onEvent('themeChanged', handleThemeChange);
        return () => {
          WebApp.offEvent('themeChanged', handleThemeChange);
        };
      }
    } catch (e) {}

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('theme');
      if (!saved) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeNameState(newTheme);
        applyTheme(newTheme);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const applyTheme = (name: ThemeName) => {
    const theme = themes[name];
    const root = document.documentElement;

    root.classList.remove('light', 'dark');
    root.classList.add(name);

    root.style.setProperty('--color-bg', theme.colors.bg);
    root.style.setProperty('--color-card', theme.colors.card);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-text-muted', theme.colors.textMuted);
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-error', theme.colors.error);

    document.body.style.backgroundColor = theme.colors.bg;
    document.body.style.color = theme.colors.text;
  };

  const setThemeName = (name: ThemeName) => {
    setThemeNameState(name);
    localStorage.setItem('theme', name);
    applyTheme(name);
  };

  const theme = themes[themeName];

  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, themeName, isDark: themeName === 'dark', setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}