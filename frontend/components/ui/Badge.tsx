'use client';

import { ReactNode } from 'react';
import { useTheme } from '@/lib/theme';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'premium';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
}: BadgeProps) {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: theme.colors.surface,
          color: theme.colors.textSecondary,
        };
      case 'primary':
        return {
          backgroundColor: theme.colors.primaryLight,
          color: theme.colors.primary,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.successLight,
          color: theme.colors.success,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warningLight,
          color: theme.colors.warning,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.errorLight,
          color: theme.colors.error,
        };
      case 'info':
        return {
          backgroundColor: theme.colors.blueLight,
          color: theme.colors.blue,
        };
      case 'premium':
        return {
          background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
          color: '#FFF',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.125rem 0.5rem',
          fontSize: '0.625rem',
          borderRadius: theme.radius.md,
        };
      case 'md':
        return {
          padding: '0.25rem 0.625rem',
          fontSize: '0.75rem',
          borderRadius: theme.radius.lg,
        };
      case 'lg':
        return {
          padding: '0.375rem 0.875rem',
          fontSize: '0.875rem',
          borderRadius: theme.radius.lg,
        };
      default:
        return {};
    }
  };

  const combinedStyles = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  };

  return (
    <span style={combinedStyles}>
      {dot && (
        <span
          style={{
            width: size === 'sm' ? 4 : 6,
            height: size === 'sm' ? 4 : 6,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
          }}
        />
      )}
      {icon}
      {children}
    </span>
  );
}