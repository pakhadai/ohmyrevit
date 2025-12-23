'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Wallet, Plus, History, ArrowUpRight, ArrowDownLeft,
  CreditCard, Loader, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { walletAPI } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

interface Transaction {
  id: number;
  type: 'deposit' | 'purchase' | 'bonus' | 'refund';
  amount: number;
  description: string;
  created_at: string;
}

interface Package {
  id: number;
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

const PACKAGES: Package[] = [
  { id: 1, coins: 500, price: 4.99 },
  { id: 2, coins: 1000, price: 8.99, bonus: 50 },
  { id: 3, coins: 2500, price: 19.99, bonus: 250, popular: true },
  { id: 4, coins: 5000, price: 34.99, bonus: 750 },
  { id: 5, coins: 10000, price: 59.99, bonus: 2000 },
];

export default function WalletPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await walletAPI.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsPurchasing(true);
    try {
      const response = await walletAPI.createPayment({
        package_id: pkg.id,
        amount: pkg.price,
      });
      if (response.payment_url) {
        window.location.href = response.payment_url;
      }
    } catch (error) {
      toast.error(t('wallet.purchaseError'));
    } finally {
      setIsPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft size={16} style={{ color: theme.colors.success }} />;
      case 'purchase':
        return <ArrowUpRight size={16} style={{ color: theme.colors.error }} />;
      case 'bonus':
        return <Sparkles size={16} style={{ color: theme.colors.accent }} />;
      case 'refund':
        return <ArrowDownLeft size={16} style={{ color: theme.colors.blue }} />;
      default:
        return <History size={16} style={{ color: theme.colors.textMuted }} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'bonus':
      case 'refund':
        return theme.colors.success;
      case 'purchase':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-2xl mx-auto px-5 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2.5 transition-colors"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMuted,
              borderRadius: theme.radius.lg,
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: theme.colors.text }}>
            {t('wallet.title')}
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 mb-6"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
            borderRadius: theme.radius['2xl'],
            boxShadow: theme.shadows.lg,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: theme.radius.lg }}
            >
              <Wallet size={24} color="#FFF" />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {t('wallet.balance')}
              </p>
              <div className="flex items-center gap-2">
                <Image src="/omr_coin.png" alt="OMR" width={24} height={24} />
                <span className="text-3xl font-bold text-white">
                  {(user?.balance || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>
            {t('wallet.topUp')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {PACKAGES.map((pkg) => (
              <motion.button
                key={pkg.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePurchase(pkg)}
                disabled={isPurchasing}
                className="relative p-4 text-left transition-all disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.card,
                  border: pkg.popular ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.xl,
                  boxShadow: theme.shadows.sm,
                }}
              >
                {pkg.popular && (
                  <div
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: '#FFF',
                      borderRadius: theme.radius.full,
                    }}
                  >
                    {t('wallet.popular')}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Image src="/omr_coin.png" alt="OMR" width={20} height={20} />
                  <span className="text-lg font-bold" style={{ color: theme.colors.text }}>
                    {pkg.coins.toLocaleString()}
                  </span>
                </div>
                {pkg.bonus && (
                  <p className="text-xs mb-2" style={{ color: theme.colors.success }}>
                    +{pkg.bonus} {t('wallet.bonus')}
                  </p>
                )}
                <p className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
                  ${pkg.price}
                </p>
                {selectedPackage?.id === pkg.id && isPurchasing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20" style={{ borderRadius: theme.radius.xl }}>
                    <Loader className="animate-spin" size={24} color="#FFF" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>
              {t('wallet.history')}
            </h2>
            {transactions.length > 5 && (
              <button
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: theme.colors.primary }}
              >
                {t('common.viewAll')}
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin" size={24} style={{ color: theme.colors.primary }} />
            </div>
          ) : transactions.length === 0 ? (
            <div
              className="text-center py-12"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
              }}
            >
              <History size={40} className="mx-auto mb-3" style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
              <p style={{ color: theme.colors.textMuted }}>{t('wallet.noTransactions')}</p>
            </div>
          ) : (
            <div
              className="divide-y"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
                overflow: 'hidden',
              }}
            >
              {transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4"
                  style={{ borderColor: theme.colors.border }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }}
                    >
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: theme.colors.text }}>
                        {tx.description}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: getTransactionColor(tx.type) }}>
                    <span className="font-bold">
                      {tx.type === 'purchase' ? '-' : '+'}
                      {Math.abs(tx.amount).toLocaleString()}
                    </span>
                    <Image src="/omr_coin.png" alt="OMR" width={16} height={16} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}