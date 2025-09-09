// frontend/app/admin/layout.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Users, Package, ShoppingCart, TrendingUp, Tag, Menu, ArrowLeft, Plus, LayoutList
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: t('admin.sidebar.dashboard'), icon: TrendingUp, href: '/admin' },
    { id: 'users', label: t('admin.sidebar.users'), icon: Users, href: '/admin/users' },
    { id: 'products', label: t('admin.sidebar.products'), icon: Package, href: '/admin/products' },
    // ДОДАНО: Новий пункт меню для категорій
    { id: 'categories', label: t('admin.sidebar.categories'), icon: LayoutList, href: '/admin/categories' },
    { id: 'orders', label: t('admin.sidebar.orders'), icon: ShoppingCart, href: '/admin/orders' },
    { id: 'promo-codes', label: t('admin.sidebar.promoCodes'), icon: Tag, href: '/admin/promo-codes' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  const getActionButtton = () => {
    if (pathname === '/admin/products') {
      return (
        <button onClick={() => router.push('/admin/products/new')} className="p-2 bg-green-500 text-white rounded-lg">
          <Plus size={20} />
        </button>
      )
    }
    if (pathname === '/admin/promo-codes') {
      return (
        <button onClick={() => router.push('/admin/promo-codes/new')} className="p-2 bg-green-500 text-white rounded-lg">
          <Plus size={20} />
        </button>
      )
    }
    return <div className="w-8 h-8"></div>; // Пустий спейсер
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <aside className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 h-screen lg:h-auto w-64 bg-white dark:bg-gray-800 shadow-lg z-20 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                <h1 className="text-xl font-bold">{t('admin.sidebar.title')}</h1>
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
            <div className="fixed inset-0 bg-black/50 z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div className="flex-1 flex flex-col w-full">
             <header className="lg:hidden sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                <div className="flex items-center justify-between p-4">
                    <button onClick={() => setSidebarOpen(true)} className="p-2">
                        <Menu size={24} />
                    </button>
                     <h1 className="text-lg font-bold">
                        {menuItems.find(item => isActive(item.href))?.label || t('admin.sidebar.title')}
                    </h1>
                    {getActionButtton()}
                </div>
            </header>
            <main className="flex-1 p-4 lg:p-6">
                {children}
            </main>
        </div>
    </div>
  );
}