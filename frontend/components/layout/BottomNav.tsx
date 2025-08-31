'use client';

import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const cartItemsCount = useCartStore((state) => state.items.length);

  // Логіка приховування при скролі
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Ховаємо при скролі вниз
      } else {
        setIsVisible(true); // Показуємо при скролі вгору
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { href: '/', icon: Home, label: 'Головна' },
    { href: '/marketplace', icon: ShoppingBag, label: 'Маркет' },
    { href: '/cart', icon: ShoppingCart, label: 'Кошик', badge: cartItemsCount },
    { href: '/profile', icon: User, label: 'Профіль' }
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 nav-blur rounded-t-3xl ${isVisible ? 'nav-show' : 'nav-hide'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}