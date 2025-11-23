'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { subscriptionsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Loader, Calendar, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface SubscriptionStatus {
  has_active_subscription: boolean;
  subscription?: {
    start_date: string;
    end_date: string;
    days_remaining: number;
  };
}

export default function SubscriptionPage() {
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const checkStatus = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const data = await subscriptionsAPI.getStatus();
        setStatus(data);
      } catch (error) {
        toast.error(t('toasts.dataLoadError'));
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [isAuthenticated, t]);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const response = await subscriptionsAPI.checkout();
      if (response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        toast.error(t('toasts.paymentLinkError'));
      }
    } catch (error) {
      toast.error(t('toasts.subscriptionCreateError'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 space-y-6">

      <h1 className="text-2xl font-bold text-foreground">{t('subscription.pageTitle')}</h1>

      {status?.has_active_subscription ? (
        /* --- ACTIVE SUBSCRIPTION STATE --- */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[24px] p-6 text-white shadow-lg shadow-emerald-500/20"
        >
          {/* Декор */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>

          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Crown size={32} className="text-white" fill="currentColor" />
            </div>

            <h2 className="text-2xl font-bold mb-2">{t('subscription.activeTitle')}</h2>
            <p className="opacity-90 mb-8 text-sm max-w-xs mx-auto">{t('subscription.activeSubtitle')}</p>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-center gap-2 text-white/80 text-xs font-medium mb-1">
                        <Calendar size={14} />
                        <span>{t('subscription.activeUntil')}</span>
                    </div>
                    <p className="text-lg font-bold">{new Date(status.subscription!.end_date).toLocaleDateString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-center gap-2 text-white/80 text-xs font-medium mb-1">
                        <Sparkles size={14} />
                        <span>{t('subscription.daysRemaining')}</span>
                    </div>
                    <p className="text-lg font-bold">{status.subscription!.days_remaining}</p>
                </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* --- OFFER STATE --- */
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            // Використовуємо той самий темний стиль (#1A1A23), що і на головній
            className="relative overflow-hidden bg-[#1A1A23] rounded-[24px] p-6 text-white shadow-xl shadow-slate-300/20 dark:shadow-none border border-white/5"
        >
            {/* Фоновий ефект */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-[40px] -ml-10 -mb-10 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Crown size={24} className="text-white" fill="currentColor" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold leading-tight">OhMyRevit Premium</h2>
                        <p className="text-sm text-gray-400">{t('subscription.pageSubtitle')}</p>
                    </div>
                </div>

                <div className="mb-8 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 size={14} className="text-green-400" />
                        </div>
                        <span className="text-sm text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('subscription.feature1') }} />
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 size={14} className="text-green-400" />
                        </div>
                        <span className="text-sm text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('subscription.feature2') }} />
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 size={14} className="text-green-400" />
                        </div>
                        <span className="text-sm text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('subscription.feature3') }} />
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ShieldCheck size={14} className="text-green-400" />
                        </div>
                        <span className="text-sm text-gray-200 leading-relaxed">{t('subscription.feature4')}</span>
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-gray-400 text-sm font-medium">{t('subscription.priceTitle')}</span>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-white">$5</span>
                            <span className="text-gray-400 text-sm ml-1">{t('subscription.perMonth')}</span>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center">{t('subscription.cancelAnytime')}</p>
                </div>

                <button
                    onClick={handleSubscribe}
                    disabled={isProcessing}
                    className="w-full py-4 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                >
                    {isProcessing ? (
                        <>
                            <Loader className="animate-spin" size={18} />
                            <span>{t('common.processing')}</span>
                        </>
                    ) : (
                        <>
                            <span>{t('subscription.checkoutButton')}</span>
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
      )}
    </div>
  );
}