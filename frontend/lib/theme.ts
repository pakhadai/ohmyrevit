'use client';

import { createContext, useContext } from 'react';

export const lightTheme = {
  name: 'light' as const,
  colors: {
    bg: '#FDFCFA',
    bgGradient: 'linear-gradient(to bottom, #FDFCFA, #F5F3F0)',
    card: '#FFFFFF',
    cardHover: '#FAFAFA',
    surface: '#F5F5F7',
    surfaceHover: '#EEEEF0',
    border: '#EBE7E1',
    borderLight: '#F0F0F0',

    text: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',

    primary: '#6366F1',
    primaryHover: '#5558E3',
    primaryLight: '#EEF2FF',
    primaryMuted: 'rgba(99, 102, 241, 0.1)',

    accent: '#8F8B85',
    accentLight: '#F2F0EB',
    accentDark: '#3F3D3A',

    success: '#22C55E',
    successLight: '#DCFCE7',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',

    blue: '#3B82F6',
    blueLight: '#DBEAFE',
    green: '#22C55E',
    greenLight: '#DCFCE7',
    orange: '#F97316',
    orangeLight: '#FFEDD5',
    purple: '#A855F7',
    purpleLight: '#F3E8FF',
    pink: '#EC4899',
    pinkLight: '#FCE7F3',
    cyan: '#06B6D4',
    cyanLight: '#CFFAFE',
    amber: '#F59E0B',
    amberLight: '#FEF3C7',
    slate: '#64748B',
    slateLight: '#F1F5F9',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px rgba(0, 0, 0, 0.05)',
    lg: '0 8px 24px -4px rgba(150, 140, 130, 0.08), 0 2px 6px -2px rgba(150, 140, 130, 0.04)',
    xl: '0 14px 32px -6px rgba(150, 140, 130, 0.12), 0 4px 10px -2px rgba(150, 140, 130, 0.06)',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '28px',
    '3xl': '32px',
    full: '9999px',
  },
};

export const darkTheme = {
  name: 'dark' as const,
  colors: {
    bg: '#0D0D0D',
    bgGradient: 'linear-gradient(to bottom, #1A1A1A, #0D0D0D)',
    card: '#1F1F1F',
    cardHover: '#2A2A2A',
    surface: '#2A2A2A',
    surfaceHover: '#333333',
    border: '#2E2E2E',
    borderLight: '#3A3A3A',

    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#6B6B6B',
    textInverse: '#1A1A1A',

    primary: '#818CF8',
    primaryHover: '#6366F1',
    primaryLight: 'rgba(129, 140, 248, 0.15)',
    primaryMuted: 'rgba(129, 140, 248, 0.1)',

    accent: '#A8A29E',
    accentLight: 'rgba(168, 162, 158, 0.15)',
    accentDark: '#E7E5E4',

    success: '#4ADE80',
    successLight: 'rgba(74, 222, 128, 0.15)',
    warning: '#FBBF24',
    warningLight: 'rgba(251, 191, 36, 0.15)',
    error: '#F87171',
    errorLight: 'rgba(248, 113, 113, 0.15)',

    blue: '#60A5FA',
    blueLight: 'rgba(96, 165, 250, 0.15)',
    green: '#4ADE80',
    greenLight: 'rgba(74, 222, 128, 0.15)',
    orange: '#FB923C',
    orangeLight: 'rgba(251, 146, 60, 0.15)',
    purple: '#C084FC',
    purpleLight: 'rgba(192, 132, 252, 0.15)',
    pink: '#F472B6',
    pinkLight: 'rgba(244, 114, 182, 0.15)',
    cyan: '#22D3EE',
    cyanLight: 'rgba(34, 211, 238, 0.15)',
    amber: '#FBBF24',
    amberLight: 'rgba(251, 191, 36, 0.15)',
    slate: '#94A3B8',
    slateLight: 'rgba(148, 163, 184, 0.15)',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 12px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 24px -4px rgba(0, 0, 0, 0.4)',
    xl: '0 14px 32px -6px rgba(0, 0, 0, 0.5)',
  },
  radius: lightTheme.radius,
};

export type AppTheme = typeof lightTheme;
export type ThemeName = 'light' | 'dark';

export const ThemeContext = createContext<{
  theme: AppTheme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  isDark: boolean;
}>({
  theme: lightTheme,
  themeName: 'light',
  setTheme: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export const getTheme = (name: ThemeName): AppTheme => {
  return name === 'dark' ? darkTheme : lightTheme;
};