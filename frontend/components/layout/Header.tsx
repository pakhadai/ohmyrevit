'use client';

import { useTheme } from '@/lib/theme';

export default function Header() {
  const { theme } = useTheme();

  return (
    <header
      className="sticky top-0 left-0 right-0 z-40 h-20 sm:hidden flex items-center justify-center"
      style={{
        background: theme.colors.bgGradient,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <div
        className="w-10 h-1 rounded-full"
        style={{ backgroundColor: theme.colors.primary, opacity: 0.3 }}
      />
    </header>
  );
}