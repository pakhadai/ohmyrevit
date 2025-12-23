'use client';

import { ReactNode, HTMLAttributes } from 'react';
import { useTheme } from '@/lib/theme';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
  className = '',
  style,
  ...props
}: CardProps) {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.sm,
        };
      case 'elevated':
        return {
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.lg,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          border: `1px solid ${theme.colors.border}`,
        };
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
          border: 'none',
        };
      default:
        return {};
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: '0.75rem' };
      case 'md':
        return { padding: '1rem' };
      case 'lg':
        return { padding: '1.5rem' };
      default:
        return {};
    }
  };

  const combinedStyles = {
    ...getVariantStyles(),
    ...getPaddingStyles(),
    borderRadius: theme.radius.xl,
    transition: 'all 0.2s',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  return (
    <div
      onClick={onClick}
      style={combinedStyles}
      className={`${hover ? 'hover:scale-[1.02] active:scale-[0.98]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}