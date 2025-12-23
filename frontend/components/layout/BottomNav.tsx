'use client';

import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/store/cartStore';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const cartItemsCount = useCartStore((state) => state.items.length);
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    let lastTick = 0;
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastTick < 100) return;
      lastTick = now;
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', icon: Home, label: t('nav.home'), badge: 0 },
    { href: '/marketplace', icon: ShoppingBag, label: t('nav.market'), badge: 0 },
    { href: '/cart', icon: ShoppingCart, label: t('nav.cart'), badge: cartItemsCount },
    { href: '/profile', icon: User, label: t('nav.profile'), badge: 0 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-6">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{
          y: isVisible ? 0 : 100,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="pointer-events-auto relative flex items-center px-2 py-2 gap-1 min-w-[320px]"
        style={{
          backgroundColor: isDark ? 'rgba(31, 31, 31, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius['3xl'],
          boxShadow: theme.shadows.lg,
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center h-12 min-w-[60px] cursor-pointer select-none group"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0"
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.xl,
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={2.5}
                    style={{
                      color: isActive ? '#FFFFFF' : theme.colors.textMuted,
                      transition: 'color 0.2s',
                    }}
                  />

                  {item.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full"
                      style={{
                        backgroundColor: theme.colors.error,
                        border: `2px solid ${theme.colors.card}`,
                      }}
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}