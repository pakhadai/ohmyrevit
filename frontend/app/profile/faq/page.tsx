'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, HelpCircle, ChevronDown, Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: t('profilePages.faq.items.q1'),
      answer: t('profilePages.faq.items.a1'),
      category: 'general',
    },
    {
      id: 2,
      question: t('profilePages.faq.items.q2'),
      answer: t('profilePages.faq.items.a2'),
      category: 'payments',
    },
    {
      id: 3,
      question: t('profilePages.faq.items.q3'),
      answer: t('profilePages.faq.items.a3'),
      category: 'downloads',
    },
    {
      id: 4,
      question: t('profilePages.faq.items.q4'),
      answer: t('profilePages.faq.items.a4'),
      category: 'general',
    },
    {
      id: 5,
      question: t('profilePages.faq.items.q5'),
      answer: t('profilePages.faq.items.a5'),
      category: 'payments',
    },
    {
      id: 6,
      question: t('profilePages.faq.items.q6'),
      answer: t('profilePages.faq.items.a6'),
      category: 'downloads',
    },
    {
      id: 7,
      question: t('profilePages.faq.items.q7'),
      answer: t('profilePages.faq.items.a7'),
      category: 'subscription',
    },
    {
      id: 8,
      question: t('profilePages.faq.items.q8'),
      answer: t('profilePages.faq.items.a8'),
      category: 'subscription',
    },
  ];

  const categories = [
    { key: 'all', label: t('profilePages.faq.all') },
    { key: 'general', label: t('profilePages.faq.general') },
    { key: 'payments', label: t('profilePages.faq.payments') },
    { key: 'downloads', label: t('profilePages.faq.downloadsCategory') },
    { key: 'subscription', label: t('profilePages.faq.subscription') },
  ];

  const filteredItems = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-2" style={{ background: theme.colors.bgGradient }}>
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
            {t('profilePages.faq.title')}
          </h1>
        </div>

        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: theme.colors.textMuted }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('profilePages.faq.search')}
            className="w-full pl-11 pr-4 py-3 text-sm outline-none transition-all"
            style={{
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="px-4 py-2 text-sm font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeCategory === cat.key ? theme.colors.primary : theme.colors.surface,
                color: activeCategory === cat.key ? '#FFF' : theme.colors.textSecondary,
                borderRadius: theme.radius.full,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div
            className="text-center py-12"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          >
            <HelpCircle size={40} className="mx-auto mb-3" style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
            <p style={{ color: theme.colors.textMuted }}>{t('profilePages.faq.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.xl,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full p-4 flex items-start justify-between text-left"
                >
                  <span className="font-medium pr-4" style={{ color: theme.colors.text }}>
                    {item.question}
                  </span>
                  <motion.div
                    animate={{ rotate: expandedId === item.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 mt-0.5"
                  >
                    <ChevronDown size={18} style={{ color: theme.colors.textMuted }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="px-4 pb-2 text-sm leading-relaxed"
                        style={{
                          color: theme.colors.textSecondary,
                          borderTop: `1px solid ${theme.colors.border}`,
                          paddingTop: '1rem',
                        }}
                      >
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        <div
          className="mt-8 p-5 text-center"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
          }}
        >
          <p className="text-sm mb-3" style={{ color: theme.colors.textSecondary }}>
            {t('profilePages.faq.stillNeedHelp')}
          </p>
          <button
            onClick={() => router.push('/profile/support')}
            className="px-6 py-2.5 font-medium transition-all active:scale-95"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#FFF',
              borderRadius: theme.radius.xl,
            }}
          >
            {t('profilePages.faq.contactSupport')}
          </button>
        </div>
      </div>
    </div>
  );
}