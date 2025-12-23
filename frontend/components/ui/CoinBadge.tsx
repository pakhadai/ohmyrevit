'use client';

import Image from 'next/image';
import { useTheme } from '@/lib/theme';

interface CoinBadgeProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'muted';
  showSign?: boolean;
  animated?: boolean;
}

export default function CoinBadge({
  amount,
  size = 'md',
  variant = 'default',
  showSign = false,
  animated = false,
}: CoinBadgeProps) {
  const { theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { iconSize: 14, fontSize: '0.75rem', gap: '0.25rem' };
      case 'md':
        return { iconSize: 18, fontSize: '0.875rem', gap: '0.375rem' };
      case 'lg':
        return { iconSize: 24, fontSize: '1.125rem', gap: '0.5rem' };
      default:
        return { iconSize: 18, fontSize: '0.875rem', gap: '0.375rem' };
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.success;
      case 'muted':
        return theme.colors.textMuted;
      default:
        return theme.colors.text;
    }
  };

  const sizes = getSizeStyles();
  const formattedAmount = amount.toLocaleString();
  const sign = showSign && amount > 0 ? '+' : '';

  return (
    <span
      className={`inline-flex items-center font-bold ${animated ? 'animate-pulse' : ''}`}
      style={{
        gap: sizes.gap,
        fontSize: sizes.fontSize,
        color: getVariantColor(),
      }}
    >
      <Image
        src="/omr_coin.png"
        alt="OMR"
        width={sizes.iconSize}
        height={sizes.iconSize}
        className="flex-shrink-0"
      />
      <span>
        {sign}
        {formattedAmount}
      </span>
    </span>
  );
}

// Inline variant for text
export function CoinInline({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Image src="/omr_coin.png" alt="OMR" width={14} height={14} />
      <span>{amount.toLocaleString()}</span>
    </span>
  );
}

// Price display with optional sale
interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceDisplay({ price, originalPrice, size = 'md' }: PriceDisplayProps) {
  const { theme } = useTheme();
  const hasSale = originalPrice && originalPrice > price;

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { iconSize: 14, mainSize: '0.875rem', oldSize: '0.75rem' };
      case 'md':
        return { iconSize: 18, mainSize: '1rem', oldSize: '0.875rem' };
      case 'lg':
        return { iconSize: 22, mainSize: '1.25rem', oldSize: '1rem' };
      default:
        return { iconSize: 18, mainSize: '1rem', oldSize: '0.875rem' };
    }
  };

  const sizes = getSizeStyles();

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1 font-bold"
        style={{
          fontSize: sizes.mainSize,
          color: hasSale ? theme.colors.error : theme.colors.text,
        }}
      >
        <Image src="/omr_coin.png" alt="OMR" width={sizes.iconSize} height={sizes.iconSize} />
        {price.toLocaleString()}
      </span>
      {hasSale && (
        <span
          className="line-through"
          style={{
            fontSize: sizes.oldSize,
            color: theme.colors.textMuted,
          }}
        >
          {originalPrice.toLocaleString()}
        </span>
      )}
    </div>
  );
}