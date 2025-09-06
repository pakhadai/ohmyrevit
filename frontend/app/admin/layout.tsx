// ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
// frontend/app/admin/layout.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Users, Package, ShoppingCart, TrendingUp, Tag, Menu, ArrowLeft
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Панель', icon: TrendingUp, href: '/admin' },
  { id: 'users', label: 'Користувачі', icon: Users, href: '/admin/users' },
  { id: 'products', label: 'Товари', icon: Package, href: '/admin/products' },
  { id: 'orders', label: 'Замовлення', icon: ShoppingCart, href: '/admin/orders' },
  { id: 'promo-codes', label: 'Промокоди', icon: Tag, href: '/admin/promo-codes' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
// OLD: <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 pt-16">
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {/* OLD: <aside className={`fixed lg:relative inset-y-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}> */}
        <aside className={`fixed lg:sticky lg:top-16 inset-y-0 left-0 h-screen lg:h-auto w-64 bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} pt-16 lg:pt-0`}>
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                <h1 className="text-xl font-bold">Адмін-панель</h1>
                <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <ArrowLeft size={20} />
                </button>
            </div>
            <nav className="p-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                router.push(item.href);
                                setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${isActive(item.href) ? 'bg-purple-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>

        {sidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* OLD: <div className="flex-1 flex flex-col w-full overflow-hidden"> */}
        <div className="flex-1 flex flex-col w-full">
             {/* OLD: <header className="lg:hidden sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10"> */}
             <header className="lg:hidden sticky top-16 bg-white dark:bg-gray-800 shadow-sm z-10">
                <div className="flex items-center justify-between p-4">
                    <button onClick={() => setSidebarOpen(true)} className="p-2">
                        <Menu size={24} />
                    </button>
                     <h1 className="text-lg font-bold">
                        {menuItems.find(item => isActive(item.href))?.label || 'Адмін-панель'}
                    </h1>
                    <div className="w-8"></div>
                </div>
            </header>
            {/* OLD: <main className="flex-1 p-4 lg:p-6 overflow-y-auto"> */}
            <main className="flex-1 p-4 lg:p-6">
                {children}
            </main>
        </div>
    </div>
  );
}