'use client';

import { useTheme } from '@/lib/theme';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

export default function Skeleton({
  width = '100%',
  height = 16,
  variant = 'text',
  animation = 'pulse',
  className = '',
}: SkeletonProps) {
  const { theme } = useTheme();

  const getBorderRadius = () => {
    switch (variant) {
      case 'text':
        return theme.radius.md;
      case 'circular':
        return '50%';
      case 'rectangular':
        return 0;
      case 'rounded':
        return theme.radius.lg;
      default:
        return theme.radius.md;
    }
  };

  const getAnimationStyles = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'wave':
        return 'animate-shimmer';
      case 'none':
        return '';
      default:
        return 'animate-pulse';
    }
  };

  return (
    <div
      className={`${getAnimationStyles()} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: getBorderRadius(),
        backgroundColor: theme.colors.surface,
      }}
    />
  );
}

// Preset skeleton components
export function SkeletonText({ lines = 3, lastLineWidth = '60%' }: { lines?: number; lastLineWidth?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          height={14}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  const { theme } = useTheme();
  return (
    <div
      className="p-4 space-y-3"
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <Skeleton variant="rounded" height={160} />
      <Skeleton width="70%" height={18} />
      <Skeleton width="40%" height={14} />
      <div className="flex justify-between items-center pt-2">
        <Skeleton width={80} height={24} variant="rounded" />
        <Skeleton width={36} height={36} variant="circular" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonButton({ width = 120, height = 40 }: { width?: number; height?: number }) {
  return <Skeleton variant="rounded" width={width} height={height} />;
}