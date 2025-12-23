'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { useTheme } from '@/lib/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  badge?: 'online' | 'offline' | 'premium';
  onClick?: () => void;
}

export default function Avatar({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  badge,
  onClick,
}: AvatarProps) {
  const { theme } = useTheme();
  const [hasError, setHasError] = useState(false);

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return { width: 24, height: 24, fontSize: '0.625rem' };
      case 'sm':
        return { width: 32, height: 32, fontSize: '0.75rem' };
      case 'md':
        return { width: 40, height: 40, fontSize: '0.875rem' };
      case 'lg':
        return { width: 56, height: 56, fontSize: '1.125rem' };
      case 'xl':
        return { width: 80, height: 80, fontSize: '1.5rem' };
      default:
        return { width: 40, height: 40, fontSize: '0.875rem' };
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'xs':
      case 'sm':
        return 8;
      case 'md':
        return 10;
      case 'lg':
        return 12;
      case 'xl':
        return 16;
      default:
        return 10;
    }
  };

  const getBadgeColor = () => {
    switch (badge) {
      case 'online':
        return theme.colors.success;
      case 'offline':
        return theme.colors.textMuted;
      case 'premium':
        return theme.colors.accent;
      default:
        return 'transparent';
    }
  };

  const getInitials = () => {
    if (!name) return null;
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const sizeStyles = getSizeStyles();
  const badgeSize = getBadgeSize();

  const containerStyles = {
    position: 'relative' as const,
    width: sizeStyles.width,
    height: sizeStyles.height,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    backgroundColor: theme.colors.primaryLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onClick ? 'pointer' : 'default',
    flexShrink: 0,
  };

  const showFallback = !src || hasError;

  return (
    <div style={containerStyles} onClick={onClick}>
      {!showFallback ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : name ? (
        <span
          style={{
            fontSize: sizeStyles.fontSize,
            fontWeight: 700,
            color: theme.colors.primary,
          }}
        >
          {getInitials()}
        </span>
      ) : (
        <User
          size={sizeStyles.width * 0.5}
          style={{ color: theme.colors.primary }}
        />
      )}
      {badge && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: badgeSize,
            height: badgeSize,
            borderRadius: '50%',
            backgroundColor: getBadgeColor(),
            border: `2px solid ${theme.colors.card}`,
          }}
        />
      )}
    </div>
  );
}