'use client';

import { Star } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface StarRatingProps {
  rating: number; // Current rating (0-5)
  maxRating?: number; // Maximum rating (default 5)
  size?: number; // Star size in pixels
  onChange?: (rating: number) => void; // Callback when rating changes (interactive mode)
  readonly?: boolean; // Display only mode
  showNumber?: boolean; // Show numeric rating
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  onChange,
  readonly = false,
  showNumber = false,
}: StarRatingProps) {
  const { theme } = useTheme();
  const isInteractive = !readonly && !!onChange;

  const handleClick = (value: number) => {
    if (isInteractive && onChange) {
      onChange(value);
    }
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const isFilled = starValue <= Math.round(rating);

    return (
      <button
        key={index}
        type="button"
        onClick={() => handleClick(starValue)}
        disabled={!isInteractive}
        className={`transition-all ${
          isInteractive
            ? 'cursor-pointer hover:scale-110'
            : 'cursor-default'
        }`}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px',
        }}
      >
        <Star
          size={size}
          fill={isFilled ? theme.colors.primary : 'none'}
          stroke={isFilled ? theme.colors.primary : theme.colors.textMuted}
          strokeWidth={2}
        />
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
      </div>
      {showNumber && (
        <span
          className="text-sm font-medium ml-1"
          style={{ color: theme.colors.text }}
        >
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
