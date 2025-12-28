'use client';
import { Loader, Inbox } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export const LoadingSpinner = () => {
  const { theme } = useTheme();

  return (
    <div className="flex items-center justify-center py-20">
      <Loader className="animate-spin h-10 w-10" style={{ color: theme.colors.primary }} />
    </div>
  );
};

export const EmptyState = ({ message, icon: Icon = Inbox }: { message: string; icon?: any }) => {
  const { theme } = useTheme();

  return (
    <div
      className="text-center py-20 rounded-3xl border border-dashed"
      style={{
        backgroundColor: `${theme.colors.surface}33`,
        borderColor: theme.colors.border
      }}
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.colors.surface }}>
        <Icon size={32} style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
      </div>
      <p className="font-medium" style={{ color: theme.colors.textSecondary }}>{message}</p>
    </div>
  );
};