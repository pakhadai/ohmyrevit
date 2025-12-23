'use client';

import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  size = 'md',
}: TabsProps) {
  const { theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '0.375rem 0.75rem', fontSize: '0.75rem' };
      case 'md':
        return { padding: '0.5rem 1rem', fontSize: '0.875rem' };
      case 'lg':
        return { padding: '0.75rem 1.25rem', fontSize: '1rem' };
      default:
        return { padding: '0.5rem 1rem', fontSize: '0.875rem' };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === 'underline') {
    return (
      <div
        className="flex overflow-x-auto scrollbar-hide"
        style={{
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex items-center gap-2 whitespace-nowrap transition-colors"
            style={{
              ...sizeStyles,
              flex: fullWidth ? 1 : 'none',
              color: activeTab === tab.id ? theme.colors.primary : theme.colors.textMuted,
              fontWeight: activeTab === tab.id ? 600 : 500,
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: theme.colors.errorLight,
                  color: theme.colors.error,
                  borderRadius: theme.radius.full,
                }}
              >
                {tab.badge}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: theme.colors.primary }}
              />
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide p-1"
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.xl,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex items-center gap-2 whitespace-nowrap transition-all"
            style={{
              ...sizeStyles,
              flex: fullWidth ? 1 : 'none',
              color: activeTab === tab.id ? '#FFF' : theme.colors.textSecondary,
              fontWeight: 500,
              borderRadius: theme.radius.lg,
              backgroundColor: activeTab === tab.id ? theme.colors.primary : 'transparent',
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : theme.colors.errorLight,
                  color: activeTab === tab.id ? '#FFF' : theme.colors.error,
                  borderRadius: theme.radius.full,
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="flex items-center gap-2 whitespace-nowrap transition-all"
          style={{
            ...sizeStyles,
            flex: fullWidth ? 1 : 'none',
            color: activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary,
            fontWeight: 500,
            borderRadius: theme.radius.lg,
            backgroundColor: activeTab === tab.id ? theme.colors.primaryLight : 'transparent',
          }}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: theme.colors.errorLight,
                color: theme.colors.error,
                borderRadius: theme.radius.full,
              }}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}