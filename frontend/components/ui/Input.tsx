'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { useTheme } from '@/lib/theme';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconPosition = 'left',
      fullWidth = true,
      className = '',
      style,
      disabled,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();

    const inputStyles = {
      width: fullWidth ? '100%' : 'auto',
      padding: icon
        ? iconPosition === 'left'
          ? '0.75rem 1rem 0.75rem 2.75rem'
          : '0.75rem 2.75rem 0.75rem 1rem'
        : '0.75rem 1rem',
      fontSize: '0.875rem',
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      border: `1px solid ${error ? theme.colors.error : theme.colors.border}`,
      borderRadius: theme.radius.lg,
      outline: 'none',
      transition: 'all 0.2s',
      opacity: disabled ? 0.5 : 1,
      ...style,
    };

    return (
      <div style={{ width: fullWidth ? '100%' : 'auto' }}>
        {label && (
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: theme.colors.textSecondary }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: iconPosition === 'left' ? '0.875rem' : 'auto',
                right: iconPosition === 'right' ? '0.875rem' : 'auto',
                color: theme.colors.textMuted,
              }}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            style={inputStyles}
            className={`placeholder:text-gray-400 ${className}`}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary;
              if (props.onFocus) props.onFocus(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? theme.colors.error : theme.colors.border;
              if (props.onBlur) props.onBlur(e);
            }}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs" style={{ color: theme.colors.error }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs" style={{ color: theme.colors.textMuted }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;