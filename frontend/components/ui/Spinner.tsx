'use client';

import { Loader } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  fullScreen?: boolean;
  label?: string;
}

export default function Spinner({
  size = 'md',
  color,
  fullScreen = false,
  label,
}: SpinnerProps) {
  const { theme } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'md':
        return 24;
      case 'lg':
        return 32;
      case 'xl':
        return 48;
      default:
        return 24;
    }
  };

  const spinnerColor = color || theme.colors.primary;
  const iconSize = getSize();

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <Loader
        size={iconSize}
        className="animate-spin"
        style={{ color: spinnerColor }}
      />
      {label && (
        <p
          className="text-sm"
          style={{ color: theme.colors.textSecondary }}
        >
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: theme.colors.bg }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Page loader variant
export function PageLoader({ label }: { label?: string }) {
  const { theme } = useTheme();
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: theme.colors.bgGradient }}
    >
      <Spinner size="lg" label={label} />
    </div>
  );
}

// Inline spinner for buttons etc
export function InlineSpinner({ size = 16 }: { size?: number }) {
  const { theme } = useTheme();
  return (
    <Loader
      size={size}
      className="animate-spin"
      style={{ color: 'currentColor' }}
    />
  );
}