'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { X, Loader2, CheckCircle, AlertCircle, Coins, Shield } from 'lucide-react';
import { walletAPI } from '@/lib/api';
import { CoinPack } from '@/types';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinPack: CoinPack | null;
  onSuccess: () => void;
}

// Stripe Promise - will be initialized with publishable key
let stripePromise: Promise<Stripe | null> | null = null;

const getStripePromise = async () => {
  if (!stripePromise) {
    try {
      const config = await walletAPI.getStripeConfig();
      stripePromise = loadStripe(config.publishable_key);
    } catch (error) {
      console.error('Failed to load Stripe config:', error);
      return null;
    }
  }
  return stripePromise;
};

// Payment form component
function PaymentForm({
  onSuccess,
  onClose,
  coinPack
}: {
  onSuccess: () => void;
  onClose: () => void;
  coinPack: CoinPack;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setPaymentStatus('processing');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile/wallet?payment=success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        setPaymentStatus('error');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setPaymentStatus('processing');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred');
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const bonusCoins = coinPack.total_coins - coinPack.coins_amount;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* Pack info */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <Coins size={24} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900">
                {coinPack.coins_amount.toLocaleString()} OMR
              </p>
              {coinPack.bonus_percent > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  +{coinPack.bonus_percent}% бонус (+{bonusCoins} OMR)
                </p>
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            ${coinPack.price_usd.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="mb-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
            paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
          }}
        />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-4">
          <AlertCircle size={18} />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Success message */}
      {paymentStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 mb-4">
          <CheckCircle size={18} />
          <span className="text-sm">{t('wallet.paymentSuccess', 'Оплата успішна!')}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {t('common.cancel', 'Скасувати')}
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing || paymentStatus === 'success'}
          className="flex-1 py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              {t('wallet.processing', 'Обробка...')}
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <CheckCircle size={18} />
              {t('wallet.paid', 'Оплачено!')}
            </>
          ) : (
            <>
              {t('wallet.pay', 'Оплатити')} ${coinPack.price_usd.toFixed(2)}
            </>
          )}
        </button>
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
        <Shield size={14} />
        <span>{t('wallet.securePayment', 'Захищено Stripe')}</span>
      </div>
    </form>
  );
}

// Main modal component - Always slides up from bottom
export default function StripePaymentModal({
  isOpen,
  onClose,
  coinPack,
  onSuccess,
}: StripePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Hide Telegram WebApp buttons if exists
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.MainButton?.hide();
        (window as any).Telegram.WebApp.BackButton?.hide();
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && coinPack) {
      initializePayment();
    } else {
      setClientSecret(null);
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, coinPack]);

  const initializePayment = async () => {
    if (!coinPack) return;

    setIsLoading(true);
    setError(null);

    try {
      const stripe = await getStripePromise();
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
      setStripeInstance(stripe);

      const response = await walletAPI.createPaymentIntent(coinPack.id);
      setClientSecret(response.client_secret);
    } catch (err: any) {
      console.error('Failed to initialize payment:', err);
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />

          {/* Modal container - centers content on desktop */}
          <div className="relative w-full flex justify-center pointer-events-none">
            {/* Modal - slides up from bottom, max-width matches page */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl pointer-events-auto"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  {t('wallet.buyCoins', 'Поповнення балансу')}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 py-4 max-h-[70vh] overflow-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="animate-spin text-amber-500 mb-4" size={36} />
                    <p className="text-gray-500">
                      {t('wallet.loadingPayment', 'Завантаження...')}
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <AlertCircle className="text-red-500 mb-4" size={36} />
                    <p className="text-red-600 mb-4 text-center">{error}</p>
                    <button
                      onClick={initializePayment}
                      className="px-6 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
                    >
                      {t('common.retry', 'Спробувати ще')}
                    </button>
                  </div>
                ) : clientSecret && stripeInstance && coinPack ? (
                  <Elements
                    stripe={stripeInstance}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#f59e0b',
                          colorBackground: '#ffffff',
                          colorText: '#1f2937',
                          colorDanger: '#ef4444',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          borderRadius: '12px',
                          spacingUnit: '4px',
                        },
                        rules: {
                          '.Tab': {
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
                            marginBottom: '8px',
                          },
                          '.Tab--selected': {
                            borderColor: '#f59e0b',
                            backgroundColor: '#fffbeb',
                          },
                          '.Input': {
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
                            padding: '12px',
                          },
                          '.Input:focus': {
                            borderColor: '#f59e0b',
                            boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.2)',
                          },
                          '.Label': {
                            fontWeight: '500',
                            marginBottom: '6px',
                          },
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      onSuccess={onSuccess}
                      onClose={onClose}
                      coinPack={coinPack}
                    />
                  </Elements>
                ) : null}
              </div>

              {/* Safe area for mobile */}
              <div className="h-safe-area-inset-bottom" />
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
