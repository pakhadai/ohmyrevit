'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = true,
}: ProgressBarProps) {
  const { theme } = useTheme();

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 4;
      case 'md':
        return 8;
      case 'lg':
        return 12;
      default:
        return 8;
    }
  };

  const getBarColor = () => {
    switch (variant) {
      case 'default':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      case 'gradient':
        return `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})`;
      default:
        return theme.colors.primary;
    }
  };

  const height = getHeight();
  const barColor = getBarColor();

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span
              className="text-sm font-medium"
              style={{ color: theme.colors.text }}
            >
              {label}
            </span>
          )}
          {showLabel && (
            <span
              className="text-sm font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full overflow-hidden"
        style={{
          height,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.full,
        }}
      >
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: barColor,
            borderRadius: theme.radius.full,
          }}
        />
      </div>
    </div>
  );
}

// Circular progress variant
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
}

export function CircularProgress({
  value,
  max = 100,
  size = 64,
  strokeWidth = 6,
  variant = 'default',
  showLabel = true,
}: CircularProgressProps) {
  const { theme } = useTheme();

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = () => {
    switch (variant) {
      case 'default':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.surface}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute text-sm font-bold"
          style={{ color: theme.colors.text }}
        >
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}