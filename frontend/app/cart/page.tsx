'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Tag, Coins, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ordersAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next';

export default function CartPage() {
  const router = useRouter()
  const {
    items,
    promoCode,
    useBonusPoints,
    removeItem,
    setPromoCode,
    setBonusPoints,
    getTotalPrice,
    clearCart
  } = useCartStore()

  const { user } = useAuthStore()
  const [promoInput, setPromoInput] = useState(promoCode || '')
  const [bonusInput, setBonusInput] = useState(useBonusPoints || 0)

  const [discountAmount, setDiscountAmount] = useState(0)
  const [finalTotal, setFinalTotal] = useState(getTotalPrice())
  const [discountMessage, setDiscountMessage] = useState<string | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const { t } = useTranslation();

  const subtotal = useMemo(() => getTotalPrice(), [items])

  const calculateDiscount = async (promo: string | null, bonuses: number) => {
    if (items.length === 0) return;

    setIsCalculating(true);
    setDiscountMessage(null);
    try {
      const response = await ordersAPI.applyDiscount({
        product_ids: items.map(item => item.id),
        promo_code: promo,
        use_bonus_points: bonuses > 0 ? bonuses : undefined
      });

      if (response.success) {
        setDiscountAmount(response.discount_amount);
        setFinalTotal(response.final_total);
        if (promo) toast.success(t('toasts.promoApplied'));
        if (bonuses > 0) toast.success(t('toasts.bonusesApplied'));
      } else {
        setDiscountAmount(0);
        setFinalTotal(subtotal);
        setDiscountMessage(response.message || 'Не вдалося застосувати знижку');
        if (promo) setPromoCode(null);
        if (bonuses > 0) setBonusPoints(0);
      }
    } catch (err: any) {
      toast.error(t('toasts.discountCalculationError'));
      setDiscountAmount(0);
      setFinalTotal(subtotal);
    } finally {
      setIsCalculating(false);
    }
  }

  useEffect(() => {
    calculateDiscount(promoCode, useBonusPoints);
  }, [items, promoCode, useBonusPoints]);

  useEffect(() => {
    setFinalTotal(subtotal);
  }, [subtotal]);


  const handleCheckout = async () => {
    if (items.length === 0) return

    setIsProcessing(true)
    try {
      const response = await ordersAPI.createCheckout({
        product_ids: items.map(item => item.id),
        promo_code: promoCode,
        use_bonus_points: useBonusPoints > 0 ? useBonusPoints : null
      })

      if (response.payment_url) {
        toast.success(t('toasts.redirectingToPayment'));
        window.location.href = response.payment_url;
      } else {
        toast.success(t('toasts.orderSuccessNoPayment'));
        clearCart();
        router.push('/profile/downloads');
      }

    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('toasts.checkoutError'));
    } finally {
      setIsProcessing(false)
    }
  }

  const applyPromoCode = () => {
    const code = promoInput.trim();
    if (code) {
      setBonusPoints(0);
      setBonusInput(0);
      setPromoCode(code);
    }
  }

  const applyBonusPoints = () => {
    const points = bonusInput;
    if (points > 0) {
      setPromoCode(null);
      setPromoInput('');
      setBonusPoints(points);
    }
  }

  const clearDiscounts = () => {
      setPromoCode(null);
      setPromoInput('');
      setBonusPoints(0);
      setBonusInput(0);
      setDiscountMessage(null);
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag size={40} className="text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">{t('cart.empty.title')}</h2>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto">{t('cart.empty.subtitle')}</p>
        <button
          onClick={() => router.push('/marketplace')}
          className="btn-primary flex items-center gap-2"
        >
          {t('cart.empty.goToMarket')}
          <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-foreground">{t('cart.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="card-minimal p-4 flex gap-4 group"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    <img
                    src={item.main_image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                  <div>
                      <h3 className="font-semibold text-base text-foreground line-clamp-2 leading-tight">{item.title}</h3>
                      {/* <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p> */}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        {item.sale_price ? (
                        <>
                            <span className="text-primary font-bold text-lg">
                            ${item.sale_price}
                            </span>
                            <span className="text-muted-foreground line-through text-sm">
                            ${item.price}
                            </span>
                        </>
                        ) : (
                        <span className="font-bold text-lg text-foreground">${item.price}</span>
                        )}
                    </div>

                    <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary Block */}
        <div className="h-fit space-y-6">
            <div className="card-minimal p-6">
                <h2 className="text-lg font-bold mb-5 text-foreground">{t('cart.summary.title')}</h2>

                {/* Promo Code */}
                <div className="mb-4">
                    <label className="block text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1.5">
                    <Tag size={14} />
                    {t('cart.summary.promo')}
                    </label>
                    <div className="flex gap-2">
                    <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder={t('cart.summary.promoPlaceholder')}
                        disabled={useBonusPoints > 0 || isCalculating}
                        className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm disabled:opacity-50"
                    />
                    <button
                        onClick={applyPromoCode}
                        disabled={useBonusPoints > 0 || isCalculating}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl font-medium text-sm hover:brightness-95 disabled:opacity-50 transition-all"
                    >
                        {t('cart.summary.apply')}
                    </button>
                    </div>
                </div>

                <div className="relative text-center my-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <span className="relative bg-card px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('cart.summary.or')}</span>
                </div>

                {/* Bonuses */}
                <div className="mb-6">
                    <label className="block text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1.5">
                    <Coins size={14} />
                    {t('cart.summary.useBonuses', { count: user?.bonus_balance || 0 })}
                    </label>
                    <div className="flex gap-2">
                    <input
                        type="number"
                        value={bonusInput}
                        onChange={(e) => setBonusInput(Number(e.target.value))}
                        max={user?.bonus_balance || 0}
                        disabled={!!promoCode || isCalculating}
                        className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm disabled:opacity-50"
                    />
                    <button
                        onClick={applyBonusPoints}
                        disabled={!!promoCode || isCalculating}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl font-medium text-sm hover:brightness-95 disabled:opacity-50 transition-all"
                    >
                        {t('cart.summary.apply')}
                    </button>
                    </div>
                </div>

                {discountMessage && (
                    <div className="flex items-center gap-2 p-3 mb-4 text-xs font-medium text-yellow-700 bg-yellow-50 dark:text-yellow-200 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                        <AlertCircle size={16} />
                        <span>{discountMessage}</span>
                    </div>
                )}

                {/* Totals */}
                <div className="border-t border-border pt-5 space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('cart.summary.subtotal')}</span>
                    <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-500 font-medium">
                        <span>{t('cart.summary.discount')}</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-foreground pt-2">
                    <span>{t('cart.summary.total')}</span>
                    <span>${finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                <button
                    onClick={handleCheckout}
                    disabled={isProcessing || isCalculating || items.length === 0}
                    className="w-full mt-6 btn-primary flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none"
                >
                    {isProcessing ? (
                        <>
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                            <span>{t('common.processing')}</span>
                        </>
                    ) : (
                        <span>{t('cart.summary.checkout')}</span>
                    )}
                </button>

                {(promoCode || useBonusPoints > 0) && (
                    <button
                        onClick={clearDiscounts}
                        className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-2"
                    >
                        {t('cart.summary.cancelDiscount')}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}