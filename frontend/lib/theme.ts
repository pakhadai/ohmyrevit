export type ThemeName = 'light' | 'dark';

export interface Theme {
  colors: {
    bg: string;
    bgGradient: string;
    card: string;
    surface: string;
    surfaceHover: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryLight: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    success: string;
    successLight: string;
    error: string;
    errorLight: string;
    warning: string;
    warningLight: string;
    info: string;
    infoLight: string;
    blue: string;
    blueLight: string;
    green: string;
    greenLight: string;
    purple: string;
    purpleLight: string;
    orange: string;
    orangeLight: string;
    pink: string;
    pinkLight: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  light: {
    colors: {
      bg: '#FDFCFA',
      bgGradient: 'linear-gradient(180deg, #FDFCFA 0%, #F5F3F0 100%)',
      card: '#FFFFFF',
      surface: '#F5F3F0',
      surfaceHover: '#EBE7E0',
      border: '#E8E4DF',
      text: '#1A1A1A',
      textSecondary: '#6B6B6B',
      textMuted: '#9B9B9B',
      primary: '#8B7355',
      primaryLight: 'rgba(139, 115, 85, 0.12)',
      accent: '#D4AF37',
      accentLight: 'rgba(212, 175, 55, 0.12)',
      accentDark: '#B8941F',
      success: '#2D8A4E',
      successLight: 'rgba(45, 138, 78, 0.12)',
      error: '#C94B4B',
      errorLight: 'rgba(201, 75, 75, 0.12)',
      warning: '#E5A000',
      warningLight: 'rgba(229, 160, 0, 0.12)',
      info: '#3B82F6',
      infoLight: 'rgba(59, 130, 246, 0.12)',
      blue: '#3B82F6',
      blueLight: 'rgba(59, 130, 246, 0.12)',
      green: '#22C55E',
      greenLight: 'rgba(34, 197, 94, 0.12)',
      purple: '#8B5CF6',
      purpleLight: 'rgba(139, 92, 246, 0.12)',
      orange: '#F97316',
      orangeLight: 'rgba(249, 115, 22, 0.12)',
      pink: '#EC4899',
      pinkLight: 'rgba(236, 72, 153, 0.12)',
    },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
      md: '0 2px 4px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.06)',
      lg: '0 4px 6px rgba(0,0,0,0.04), 0 10px 15px rgba(0,0,0,0.08)',
      xl: '0 10px 25px rgba(0,0,0,0.1), 0 20px 40px rgba(0,0,0,0.08)',
    },
    radius: {
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '32px',
      '3xl': '40px',
      full: '9999px',
    },
  },
  dark: {
    colors: {
      bg: '#0D0D0D',
      bgGradient: 'linear-gradient(180deg, #0D0D0D 0%, #1A1A1A 100%)',
      card: '#1A1A1A',
      surface: '#2A2A2A',
      surfaceHover: '#353535',
      border: '#3A3A3A',
      text: '#F5F5F5',
      textSecondary: '#A0A0A0',
      textMuted: '#6B6B6B',
      primary: '#A68B5B',
      primaryLight: 'rgba(166, 139, 91, 0.15)',
      accent: '#D4AF37',
      accentLight: 'rgba(212, 175, 55, 0.15)',
      accentDark: '#A68911',
      success: '#34A853',
      successLight: 'rgba(52, 168, 83, 0.15)',
      error: '#EA4335',
      errorLight: 'rgba(234, 67, 53, 0.15)',
      warning: '#FBBC04',
      warningLight: 'rgba(251, 188, 4, 0.15)',
      info: '#60A5FA',
      infoLight: 'rgba(96, 165, 250, 0.15)',
      blue: '#60A5FA',
      blueLight: 'rgba(96, 165, 250, 0.15)',
      green: '#4ADE80',
      greenLight: 'rgba(74, 222, 128, 0.15)',
      purple: '#A78BFA',
      purpleLight: 'rgba(167, 139, 250, 0.15)',
      orange: '#FB923C',
      orangeLight: 'rgba(251, 146, 60, 0.15)',
      pink: '#F472B6',
      pinkLight: 'rgba(244, 114, 182, 0.15)',
    },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.3)',
      md: '0 2px 4px rgba(0,0,0,0.2), 0 4px 6px rgba(0,0,0,0.3)',
      lg: '0 4px 6px rgba(0,0,0,0.2), 0 10px 15px rgba(0,0,0,0.4)',
      xl: '0 10px 25px rgba(0,0,0,0.3), 0 20px 40px rgba(0,0,0,0.4)',
    },
    radius: {
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '32px',
      '3xl': '40px',
      full: '9999px',
    },
  },
};

import { useThemeContext } from '@/components/ThemeProvider';

export function useTheme() {
  return useThemeContext();
}