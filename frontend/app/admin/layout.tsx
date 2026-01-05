'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Users, Package, ShoppingCart, TrendingUp, Tag, Menu, ArrowLeft, Plus, LayoutList, Coins, Store,
  ChevronDown, ChevronUp, UserCheck, PackageCheck, BarChart3, DollarSign
} from 'lucide-react';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creatorsMenuOpen, setCreatorsMenuOpen] = useState(pathname.startsWith('/admin/creators'));
  const { t } = useTranslation();
  const { theme } = useTheme();

  const baseMenuItems = [
    { id: 'dashboard', label: t('admin.sidebar.dashboard'), icon: TrendingUp, href: '/admin' },
    { id: 'users', label: t('admin.sidebar.users'), icon: Users, href: '/admin/users' },
    { id: 'products', label: t('admin.sidebar.products'), icon: Package, href: '/admin/products' },
    { id: 'categories', label: t('admin.sidebar.categories'), icon: LayoutList, href: '/admin/categories' },
    { id: 'orders', label: t('admin.sidebar.orders'), icon: ShoppingCart, href: '/admin/orders' },
    { id: 'coin-packs', label: t('admin.sidebar.coinPacks', 'Пакети монет'), icon: Coins, href: '/admin/coin-packs' },
    { id: 'promo-codes', label: t('admin.sidebar.promoCodes'), icon: Tag, href: '/admin/promo-codes' },
  ];

  const creatorsSubMenu = MARKETPLACE_ENABLED ? [
    { id: 'creators-applications', label: 'Заявки креаторів', icon: UserCheck, href: '/admin/creators/applications' },
    { id: 'creators-products', label: 'Модерація товарів', icon: PackageCheck, href: '/admin/creators/products' },
    { id: 'creators-payouts', label: 'Виплати', icon: DollarSign, href: '/admin/creators/payouts' },
    { id: 'creators-stats', label: 'Статистика', icon: BarChart3, href: '/admin/creators/stats' },
  ] : [];

  const menuItems = baseMenuItems;

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  const getActionButton = () => {
    const buttonStyle = {
      backgroundColor: theme.colors.primary,
      color: '#fff',
      padding: '8px',
      borderRadius: theme.radius.xl,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: theme.shadows.md,
      transition: 'all 0.2s',
    };

    if (pathname === '/admin/products') {
      return (
        <button
          onClick={() => router.push('/admin/products/new')}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = theme.shadows.lg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = theme.shadows.md;
          }}
        >
          <Plus size={20} />
        </button>
      )
    }
    if (pathname === '/admin/promo-codes') {
      return (
        <button
          onClick={() => router.push('/admin/promo-codes/new')}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = theme.shadows.lg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = theme.shadows.md;
          }}
        >
          <Plus size={20} />
        </button>
      )
    }
    if (pathname === '/admin/coin-packs') {
      return (
        <button
          onClick={() => router.push('/admin/coin-packs/new')}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = theme.shadows.lg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = theme.shadows.md;
          }}
        >
          <Plus size={20} />
        </button>
      )
    }
    return <div className="w-8 h-8"></div>;
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor: theme.colors.bg,
        color: theme.colors.text
      }}
    >
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

        <aside
          className={`fixed lg:sticky top-0 inset-y-0 left-0 h-screen w-64 backdrop-blur-xl z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{
            backgroundColor: `${theme.colors.card}cc`,
            borderRight: `1px solid ${theme.colors.border}`,
          }}
        >
            <div
              className="p-6 flex items-center justify-between h-20"
              style={{ borderBottom: `1px solid ${theme.colors.border}80` }}
            >
                <h1
                  className="text-xl font-bold"
                  style={{
                    background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.pink})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                    Admin Panel
                </h1>
                <button
                  onClick={() => router.push('/')}
                  className="lg:hidden p-2 rounded-lg"
                  style={{
                    color: theme.colors.textMuted,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
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
                            className="w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 font-medium"
                            style={{
                                backgroundColor: active ? theme.colors.primary : 'transparent',
                                color: active ? '#fff' : theme.colors.textMuted,
                                borderRadius: theme.radius.xl,
                                boxShadow: active ? `${theme.shadows.lg}, 0 0 20px ${theme.colors.primary}33` : 'none',
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    e.currentTarget.style.backgroundColor = theme.colors.surface;
                                    e.currentTarget.style.color = theme.colors.text;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = theme.colors.textMuted;
                                }
                            }}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}

                {/* Creators Submenu */}
                {MARKETPLACE_ENABLED && creatorsSubMenu.length > 0 && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setCreatorsMenuOpen(!creatorsMenuOpen)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 transition-all duration-200 font-medium"
                            style={{
                                backgroundColor: pathname.startsWith('/admin/creators') ? theme.colors.primary : 'transparent',
                                color: pathname.startsWith('/admin/creators') ? '#fff' : theme.colors.textMuted,
                                borderRadius: theme.radius.xl,
                                boxShadow: pathname.startsWith('/admin/creators') ? `${theme.shadows.lg}, 0 0 20px ${theme.colors.primary}33` : 'none',
                            }}
                            onMouseEnter={(e) => {
                                if (!pathname.startsWith('/admin/creators')) {
                                    e.currentTarget.style.backgroundColor = theme.colors.surface;
                                    e.currentTarget.style.color = theme.colors.text;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!pathname.startsWith('/admin/creators')) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = theme.colors.textMuted;
                                }
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Store size={20} />
                                <span>Креатори</span>
                            </div>
                            {creatorsMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <AnimatePresence>
                            {creatorsMenuOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="ml-4 space-y-1 pt-1">
                                        {creatorsSubMenu.map((subItem) => {
                                            const SubIcon = subItem.icon;
                                            const subActive = isActive(subItem.href);
                                            return (
                                                <button
                                                    key={subItem.id}
                                                    onClick={() => {
                                                        router.push(subItem.href);
                                                        setSidebarOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-200 text-sm font-medium"
                                                    style={{
                                                        backgroundColor: subActive ? theme.colors.primaryLight : 'transparent',
                                                        color: subActive ? theme.colors.primary : theme.colors.textMuted,
                                                        borderRadius: theme.radius.lg,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!subActive) {
                                                            e.currentTarget.style.backgroundColor = theme.colors.surface;
                                                            e.currentTarget.style.color = theme.colors.text;
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!subActive) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.color = theme.colors.textMuted;
                                                        }
                                                    }}
                                                >
                                                    <SubIcon size={16} />
                                                    <span>{subItem.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </nav>

            <div
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{ borderTop: `1px solid ${theme.colors.border}80` }}
            >
                <button
                    onClick={() => router.push('/')}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{
                        color: theme.colors.textMuted,
                        borderRadius: theme.radius.xl,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.surface;
                        e.currentTarget.style.color = theme.colors.text;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textMuted;
                    }}
                >
                    <ArrowLeft size={20} />
                    <span>На головну</span>
                </button>
            </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
             <header
               className="lg:hidden sticky top-0 backdrop-blur-xl z-30 h-16 flex items-center justify-between px-4"
               style={{
                 backgroundColor: `${theme.colors.bg}cc`,
                 borderBottom: `1px solid ${theme.colors.border}`,
               }}
             >
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 -ml-2"
                  style={{ color: theme.colors.text }}
                >
                    <Menu size={24} />
                </button>
                <h1
                  className="text-lg font-bold truncate px-2"
                  style={{ color: theme.colors.text }}
                >
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