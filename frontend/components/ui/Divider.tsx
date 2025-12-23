'use client';

import { ReactNode } from 'react';
import { useTheme } from '@/lib/theme';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  children?: ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}

export default function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  children,
  spacing = 'md',
}: DividerProps) {
  const { theme } = useTheme();

  const getSpacing = () => {
    switch (spacing) {
      case 'sm':
        return '0.5rem';
      case 'md':
        return '1rem';
      case 'lg':
        return '1.5rem';
      default:
        return '1rem';
    }
  };

  const getBorderStyle = () => {
    switch (variant) {
      case 'solid':
        return 'solid';
      case 'dashed':
        return 'dashed';
      case 'dotted':
        return 'dotted';
      default:
        return 'solid';
    }
  };

  if (orientation === 'vertical') {
    return (
      <div
        style={{
          width: '1px',
          height: '100%',
          backgroundColor: theme.colors.border,
          margin: `0 ${getSpacing()}`,
        }}
      />
    );
  }

  if (children) {
    return (
      <div
        className="flex items-center gap-3"
        style={{ margin: `${getSpacing()} 0` }}
      >
        <div
          className="flex-1"
          style={{
            height: '1px',
            backgroundColor: theme.colors.border,
            borderStyle: getBorderStyle(),
          }}
        />
        <span
          className="text-xs font-medium px-2"
          style={{ color: theme.colors.textMuted }}
        >
          {children}
        </span>
        <div
          className="flex-1"
          style={{
            height: '1px',
            backgroundColor: theme.colors.border,
            borderStyle: getBorderStyle(),
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '1px',
        width: '100%',
        backgroundColor: theme.colors.border,
        margin: `${getSpacing()} 0`,
        borderStyle: getBorderStyle(),
      }}
    />
  );
}