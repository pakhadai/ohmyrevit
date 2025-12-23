'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import Button from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <div
      className="text-center py-12 px-6"
      style={{
        backgroundColor: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.xl,
      }}
    >
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : Icon ? (
        <div
          className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.full,
          }}
        >
          <Icon size={32} style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
        </div>
      ) : null}

      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: theme.colors.text }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="text-sm mb-6 max-w-sm mx-auto"
          style={{ color: theme.colors.textMuted }}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <Button
              variant="primary"
              onClick={action.onClick}
              icon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}