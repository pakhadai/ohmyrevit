'use client';

import { useTheme } from '@/lib/theme';

export default function Header() {
  const { theme } = useTheme();

  return (
    <header
      className="sticky top-0 left-0 right-0 z-40 h-14 flex items-center justify-center"
      style={{ backgroundColor: theme.colors.bg }}
    >
      <div
        className="w-12 h-1 rounded-full opacity-30"
        style={{ backgroundColor: theme.colors.textMuted }}
      />
    </header>
  );
}