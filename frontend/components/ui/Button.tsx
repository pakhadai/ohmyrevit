'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader } from 'lucide-react';
import { useTheme } from '@/lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      children,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();

    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: theme.colors.primary,
            color: '#FFF',
          };
        case 'secondary':
          return {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
          };
        case 'outline':
          return {
            backgroundColor: 'transparent',
            color: theme.colors.primary,
            border: `1.5px solid ${theme.colors.primary}`,
          };
        case 'ghost':
          return {
            backgroundColor: 'transparent',
            color: theme.colors.textSecondary,
          };
        case 'danger':
          return {
            backgroundColor: theme.colors.error,
            color: '#FFF',
          };
        case 'success':
          return {
            backgroundColor: theme.colors.success,
            color: '#FFF',
          };
        default:
          return {};
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return {
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            borderRadius: theme.radius.lg,
          };
        case 'md':
          return {
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            borderRadius: theme.radius.xl,
          };
        case 'lg':
          return {
            padding: '1rem 1.5rem',
            fontSize: '1rem',
            borderRadius: theme.radius.xl,
          };
        default:
          return {};
      }
    };

    const combinedStyles = {
      ...getVariantStyles(),
      ...getSizeStyles(),
      width: fullWidth ? '100%' : 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontWeight: 600,
      transition: 'all 0.2s',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.5 : 1,
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={combinedStyles}
        className={`active:scale-95 ${className}`}
        {...props}
      >
        {loading ? (
          <Loader size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;