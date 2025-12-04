'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { subscriptionsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Crown, Loader, Calendar, Sparkles, ArrowRight,
  AlertTriangle, CreditCard, XCircle, Settings, ChevronRight,
  CheckCircle2, ShieldCheck, UserX
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

interface SubscriptionStatus {
  has_active_subscription: boolean;
  subscription?: {
    start_date: string;
    end_date: string;
    days_remaining: number;
    is_auto_renewal: boolean; // 👇 Додано тип
  };
}

export default function SubscriptionPage() {
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    fetchStatus();
  }, [isAuthenticated, t]);

  const fetchStatus = async () => {
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

  const handleCancelSubscription = async () => {
    if (!confirm(t('subscription.management.cancelConfirm') || "Ви впевнені, що хочете скасувати автопродовження?")) {
      return;
    }

    setIsCancelling(true);
    try {
      await subscriptionsAPI.cancel();
      toast.success("Автопродовження скасовано");
      await fetchStatus(); // Оновлюємо UI
    } catch (error) {
      toast.error(t('toasts.genericError'));
    } finally {
      setIsCancelling(false);
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
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden bg-card text-card-foreground rounded-[24px] p-6 shadow-xl border border-emerald-500/30"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 pointer-events-none blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/5 rounded-full -ml-10 -mb-10 pointer-events-none blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-500/20">
                            <Crown size={32} className="text-emerald-500 fill-emerald-500/20 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{t('subscription.activeTitle')}</h2>
                            <p className="text-sm text-muted-foreground">{t('subscription.activeSubtitle')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
                                <Calendar size={14} />
                                <span>{t('subscription.activeUntil')}</span>
                            </div>
                            <p className="text-lg font-bold font-mono text-foreground">{new Date(status.subscription!.end_date).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
                                <Sparkles size={14} />
                                <span>{t('subscription.daysRemaining')}</span>
                            </div>
                            <p className="text-lg font-bold font-mono text-foreground">{status.subscription!.days_remaining}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="card-minimal p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-foreground">
                    <Settings size={20} className="text-primary" />
                    {t('subscription.management.title')}
                </h3>

                <div className="space-y-3">
                    <button
                        onClick={handleSubscribe}
                        disabled={isProcessing || isCancelling}
                        className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 border border-border rounded-xl transition-all group hover:border-primary/30 disabled:opacity-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                <CreditCard size={20} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm text-foreground">{t('subscription.management.extend')}</p>
                                <p className="text-xs text-muted-foreground">{t('subscription.management.extendDesc')}</p>
                            </div>
                        </div>
                        {isProcessing ? <Loader className="animate-spin text-primary" size={20}/> : <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />}
                    </button>

                    {status.subscription?.is_auto_renewal ? (
                        <button
                            onClick={handleCancelSubscription}
                            disabled={isProcessing || isCancelling}
                            className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 border border-border rounded-xl transition-all group hover:border-destructive/30 disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-destructive/10 rounded-xl text-destructive">
                                    <XCircle size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm text-foreground group-hover:text-destructive transition-colors">{t('subscription.management.cancel')}</p>
                                    <p className="text-xs text-muted-foreground">{t('subscription.management.cancelDesc')}</p>
                                </div>
                            </div>
                            {isCancelling ? <Loader className="animate-spin text-destructive" size={20}/> : <ChevronRight size={20} className="text-muted-foreground group-hover:text-destructive transition-colors" />}
                        </button>
                    ) : (
                        <div className="w-full flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
                             <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-muted rounded-xl text-muted-foreground">
                                    <UserX size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm text-muted-foreground">Автопродовження вимкнено</p>
                                    <p className="text-xs text-muted-foreground/70">Підписка завершиться автоматично</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 p-3 bg-muted/30 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                        <AlertTriangle size={14} className="text-yellow-500" />
                        {t('subscription.management.cancelWarning')}
                    </p>
                </div>
            </div>
        </div>
      ) : (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-[#1A1A23] rounded-[24px] p-6 text-white shadow-xl border border-white/5"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/5 rounded-full -ml-10 -mb-10 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
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