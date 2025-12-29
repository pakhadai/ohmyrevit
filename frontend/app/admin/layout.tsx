'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Users, Package, ShoppingCart, TrendingUp, Tag, Menu, ArrowLeft, Plus, LayoutList, Coins, Store
} from 'lucide-react';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  const baseMenuItems = [
    { id: 'dashboard', label: t('admin.sidebar.dashboard'), icon: TrendingUp, href: '/admin' },
    { id: 'users', label: t('admin.sidebar.users'), icon: Users, href: '/admin/users' },
    { id: 'products', label: t('admin.sidebar.products'), icon: Package, href: '/admin/products' },
    { id: 'categories', label: t('admin.sidebar.categories'), icon: LayoutList, href: '/admin/categories' },
    { id: 'orders', label: t('admin.sidebar.orders'), icon: ShoppingCart, href: '/admin/orders' },
    { id: 'coin-packs', label: t('admin.sidebar.coinPacks', 'Пакети монет'), icon: Coins, href: '/admin/coin-packs' },
    { id: 'promo-codes', label: t('admin.sidebar.promoCodes'), icon: Tag, href: '/admin/promo-codes' },
  ];

  const creatorsMenuItem = MARKETPLACE_ENABLED ? [
    { id: 'creators', label: 'Креатори', icon: Store, href: '/admin/creators/stats' },
  ] : [];

  const menuItems = [...baseMenuItems, ...creatorsMenuItem];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  const getActionButton = () => {
    if (pathname === '/admin/products') {
      return (
        <button onClick={() => router.push('/admin/products/new')} className="btn-primary p-2 rounded-xl flex items-center justify-center">
          <Plus size={20} />
        </button>
      )
    }
    if (pathname === '/admin/promo-codes') {
      return (
        <button onClick={() => router.push('/admin/promo-codes/new')} className="btn-primary p-2 rounded-xl flex items-center justify-center">
          <Plus size={20} />
        </button>
      )
    }
    if (pathname === '/admin/coin-packs') {
      return (
        <button onClick={() => router.push('/admin/coin-packs/new')} className="btn-primary p-2 rounded-xl flex items-center justify-center">
          <Plus size={20} />
        </button>
      )
    }
    return <div className="w-8 h-8"></div>;
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
        <AnimatePresence>
            {sidebarOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </AnimatePresence>

        <aside className={`fixed lg:sticky top-0 inset-y-0 left-0 h-screen w-64 bg-card/80 backdrop-blur-xl border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 border-b border-border/50 flex items-center justify-between h-20">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-soft">
                    Admin Panel
                </h1>
                <button onClick={() => router.push('/')} className="lg:hidden p-2 hover:bg-muted rounded-lg text-muted-foreground">
                    <ArrowLeft size={20} />
                </button>
            </div>

            <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                router.push(item.href);
                                setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                                active
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
                <button
                    onClick={() => router.push('/')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>На головну</span>
                </button>
            </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
             <header className="lg:hidden sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-30 h-16 flex items-center justify-between px-4">
                <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-foreground">
                    <Menu size={24} />
                </button>
                <h1 className="text-lg font-bold text-foreground truncate px-2">
                    {menuItems.find(item => isActive(item.href))?.label || t('admin.sidebar.title')}
                </h1>
                {getActionButton()}
            </header>

            <main className="flex-1 p-5 lg:p-8 overflow-x-hidden">
                {children}
            </main>
        </div>
    </div>
  );
}