'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, History, ArrowUpRight, ArrowDownLeft, Sparkles, ChevronLeft, ChevronRight, Loader
} from 'lucide-react';
import { walletAPI } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useTheme } from '@/lib/theme';
import { Transaction } from '@/types';

export default function TransactionsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    fetchTransactions();
  }, [page, selectedType]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, size: pageSize };
      if (selectedType) {
        params.type = selectedType;
      }
      const data = await walletAPI.getTransactions(params);
      setTransactions(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft size={16} style={{ color: theme.colors.success }} />;
      case 'purchase':
      case 'subscription':
        return <ArrowUpRight size={16} style={{ color: theme.colors.error }} />;
      case 'bonus':
      case 'referral':
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
      case 'referral':
        return theme.colors.success;
      case 'purchase':
      case 'subscription':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  const filterTypes = [
    { value: null, label: t('wallet.allTransactions') || 'All' },
    { value: 'deposit', label: t('wallet.deposits') || 'Deposits' },
    { value: 'purchase', label: t('wallet.purchases') || 'Purchases' },
    { value: 'bonus', label: t('wallet.bonuses') || 'Bonuses' },
    { value: 'referral', label: t('wallet.referrals') || 'Referrals' },
  ];

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-2xl mx-auto px-5 py-6 pb-24">
        {/* Header */}
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
            {t('wallet.transactionHistory')}
          </h1>
        </div>

        {/* Filter Tabs */}
        <div
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {filterTypes.map((filter) => (
            <button
              key={filter.value || 'all'}
              onClick={() => {
                setSelectedType(filter.value);
                setPage(1);
              }}
              className="px-4 py-2 text-sm font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: selectedType === filter.value ? theme.colors.primary : theme.colors.surface,
                color: selectedType === filter.value ? '#FFF' : theme.colors.text,
                borderRadius: theme.radius.lg,
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin" size={32} style={{ color: theme.colors.primary }} />
          </div>
        ) : transactions.length === 0 ? (
          <div
            className="text-center py-20"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          >
            <History size={48} className="mx-auto mb-4" style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
            <p style={{ color: theme.colors.textMuted }}>
              {t('wallet.noTransactions')}
            </p>
          </div>
        ) : (
          <>
            <div
              className="divide-y mb-6"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
                overflow: 'hidden',
              }}
            >
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between p-4"
                  style={{ borderColor: theme.colors.border }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }}
                    >
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate" style={{ color: theme.colors.text }}>
                        {tx.description}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2" style={{ color: getTransactionColor(tx.type) }}>
                    <span className="font-bold text-sm">
                      {['purchase', 'subscription'].includes(tx.type) ? '-' : '+'}
                      {Math.abs(tx.amount).toLocaleString()}
                    </span>
                    <Image src="/omr_coin.png" alt="OMR" width={16} height={16} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.lg,
                  }}
                >
                  <ChevronLeft size={16} />
                  {t('common.previous')}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                    {t('common.page')} {page} {t('common.of')} {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.lg,
                  }}
                >
                  {t('common.next')}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
