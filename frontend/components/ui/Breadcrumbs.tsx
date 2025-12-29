'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { theme } = useTheme();

  return (
    <nav className="flex items-center gap-2 mb-6 flex-wrap">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-sm font-medium hover:underline transition-colors"
                style={{ color: theme.colors.textMuted }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="text-sm font-medium"
                style={{ color: isLast ? theme.colors.text : theme.colors.textMuted }}
              >
                {item.label}
              </span>
            )}

            {!isLast && (
              <ChevronRight
                size={16}
                style={{ color: theme.colors.textMuted, opacity: 0.5 }}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
