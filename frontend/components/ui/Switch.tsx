'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
}

export default function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
}: SwitchProps) {
  const { theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { track: { width: 36, height: 20 }, thumb: 14, offset: 3 };
      case 'md':
        return { track: { width: 44, height: 24 }, thumb: 18, offset: 3 };
      case 'lg':
        return { track: { width: 52, height: 28 }, thumb: 22, offset: 3 };
      default:
        return { track: { width: 44, height: 24 }, thumb: 18, offset: 3 };
    }
  };

  const sizes = getSizeStyles();

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const switchElement = (
    <button
      role="switch"
      aria-checked={checked}
      onClick={handleToggle}
      disabled={disabled}
      className="relative flex-shrink-0 transition-colors"
      style={{
        width: sizes.track.width,
        height: sizes.track.height,
        borderRadius: theme.radius.full,
        backgroundColor: checked ? theme.colors.success : theme.colors.surface,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <motion.div
        animate={{
          x: checked ? sizes.track.width - sizes.thumb - sizes.offset * 2 : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute',
          top: sizes.offset,
          left: sizes.offset,
          width: sizes.thumb,
          height: sizes.thumb,
          borderRadius: '50%',
          backgroundColor: '#FFF',
          boxShadow: theme.shadows.sm,
        }}
      />
    </button>
  );

  if (!label) {
    return switchElement;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p
          className="font-medium text-sm"
          style={{ color: theme.colors.text }}
        >
          {label}
        </p>
        {description && (
          <p
            className="text-xs mt-0.5"
            style={{ color: theme.colors.textMuted }}
          >
            {description}
          </p>
        )}
      </div>
      {switchElement}
    </div>
  );
}