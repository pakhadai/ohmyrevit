'use client';

import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const cartItemsCount = useCartStore((state) => state.items.length);
  const { t } = useTranslation();

  // Логіка приховування при скролі
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { href: '/', icon: Home, label: t('nav.home'), badge: 0 },
    { href: '/marketplace', icon: ShoppingBag, label: t('nav.market'), badge: 0 },
    { href: '/cart', icon: ShoppingCart, label: t('nav.cart'), badge: cartItemsCount },
    { href: '/profile', icon: User, label: t('nav.profile'), badge: 0 },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="container mx-auto px-4 py-3">
        {/* ОНОВЛЕНО: Використовуємо bg-gray-300/90 та dark:bg-slate-950/90,
            щоб відповідати стилю Header.
        */}
        <div className="relative bg-gray-300/90 dark:bg-slate-950/90 backdrop-blur-lg rounded-full shadow-lg">
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center w-full h-16 text-center transition-colors duration-300 z-10"
                >
                  {/* Індикатор активної вкладки з анімацією */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      // Трохи підлаштував колір індикатора для кращого контрасту на темнішому фоні
                      className="absolute inset-0 bg-white/40 dark:bg-slate-700/80 rounded-full"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}

                  <div className={`relative z-10 flex flex-col items-center transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    <div className="relative">
                      <Icon className="w-6 h-6" />
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center border-2 border-transparent">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs mt-1 font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}