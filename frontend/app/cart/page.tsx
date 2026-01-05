'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2, Tag, AlertCircle, ShoppingBag, ArrowRight,
  Wallet, CheckCircle2, Loader
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ordersAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import EmailLinkModal from '@/components/auth/EmailLinkModal'
import EmailRequiredModal from '@/components/EmailRequiredModal'
import { useTheme } from '@/lib/theme'

// Константа: 100 монет = $1
const COINS_PER_USD = 100;

export default function CartPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const {
    items,
    promoCode,
    removeItem,
    setPromoCode,
    clearCart
  } = useCartStore()

  const { user, updateBalance, isAuthenticated } = useAuthStore()
  const [promoInput, setPromoInput] = useState(promoCode || '')

  const [subtotalCoins, setSubtotalCoins] = useState(0)
  const [discountCoins, setDiscountCoins] = useState(0)
  const [finalCoins, setFinalCoins] = useState(0)
  const [hasEnoughBalance, setHasEnoughBalance] = useState(false)
  const [discountMessage, setDiscountMessage] = useState<string | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showEmailRequiredModal, setShowEmailRequiredModal] = useState(false)

  const { t } = useTranslation()

  const userBalance = user?.balance || 0

  const usdToCoins = (usd: number) => Math.round(usd * COINS_PER_USD)

  const calculateDiscount = async (promo: string | null) => {
    if (items.length === 0) return

    setIsCalculating(true)
    setDiscountMessage(null)

    try {
      const response = await ordersAPI.applyDiscount({
        product_ids: items.map(item => item.id),
        promo_code: promo,
      })

      if (response.success) {
        setSubtotalCoins(response.subtotal_coins)
        setDiscountCoins(response.discount_coins)
        setFinalCoins(response.final_coins)
        setHasEnoughBalance(response.has_enough_balance)

        if (promo && response.discount_coins > 0) {
          toast.success(t('toasts.promoApplied'))
        }
      } else {
        const calculatedSubtotal = items.reduce((sum, item) => {
          const price = item.sale_price ?? item.actual_price ?? item.price
          return sum + usdToCoins(Number(price))
        }, 0)

        setSubtotalCoins(calculatedSubtotal)
        setDiscountCoins(0)
        setFinalCoins(calculatedSubtotal)
        setHasEnoughBalance(userBalance >= calculatedSubtotal)
        setDiscountMessage(response.message || t('cart.summary.discountApplyError'))

        if (promo) setPromoCode(null)
      }
    } catch (err: any) {
      const calculatedSubtotal = items.reduce((sum, item) => {
        const price = item.sale_price ?? item.actual_price ?? item.price
        return sum + usdToCoins(Number(price))
      }, 0)

      setSubtotalCoins(calculatedSubtotal)
      setDiscountCoins(0)
      setFinalCoins(calculatedSubtotal)
      setHasEnoughBalance(userBalance >= calculatedSubtotal)
    } finally {
      setIsCalculating(false)
    }
  }

  useEffect(() => {
    calculateDiscount(promoCode)
  }, [items, promoCode, userBalance])

  const handleCheckout = async () => {
    if (items.length === 0) return

    // 1. Перевірка авторизації
    if (!isAuthenticated) {
        router.push('/login')
        return
    }

    // 2. Перевірка наявності Email та його підтвердження
    if (!user?.email || !user?.isEmailVerified) {
        setShowEmailRequiredModal(true)
        return
    }

    // 3. Перевірка балансу
    if (!hasEnoughBalance) {
      router.push('/profile/wallet')
      return
    }

    setIsProcessing(true)
    try {
      const response = await ordersAPI.checkout({
        product_ids: items.map(item => item.id),
        promo_code: promoCode,
      })

      if (response.success) {
        updateBalance(response.new_balance)
        toast.success(
          t('checkout.success') + ` ${t('checkout.coinsSpent', { amount: response.coins_spent })}`,
          { duration: 4000 }
        )
        clearCart()
        router.push('/profile/downloads')
      }
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail
      if (errorDetail?.error === 'insufficient_funds') {
        toast.error(errorDetail.message || t('cart.insufficientFunds'))
        router.push('/profile/wallet')
      } else {
        toast.error(errorDetail || t('toasts.checkoutError'))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const applyPromoCode = () => {
    const code = promoInput.trim()
    if (code) setPromoCode(code)
  }

  const clearDiscounts = () => {
    setPromoCode(null)
    setPromoInput('')
    setDiscountMessage(null)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6" style={{ background: theme.colors.bgGradient }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: theme.colors.surface }}>
          <ShoppingBag size={40} style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>{t('cart.empty.title')}</h2>
        <p className="mb-8 max-w-xs mx-auto" style={{ color: theme.colors.textSecondary }}>{t('cart.empty.subtitle')}</p>
        <button
          onClick={() => router.push('/marketplace')}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
            color: '#FFFFFF',
            boxShadow: theme.shadows.md
          }}
        >
          {t('cart.empty.goToMarket')}
          <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  const shortfall = finalCoins - userBalance

  return (
    <div className="min-h-screen pb-24" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-6xl mx-auto px-5 pt-14">
        <AnimatePresence>
          {showEmailModal && (
              <EmailLinkModal
                  onClose={() => setShowEmailModal(false)}
                  onSuccess={() => setShowEmailModal(false)}
              />
          )}
          {showEmailRequiredModal && (
              <EmailRequiredModal
                  onClose={() => setShowEmailRequiredModal(false)}
              />
          )}
        </AnimatePresence>

        <h1 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>{t('cart.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => {
                const itemPrice = Number(item.price)
                const itemSalePrice = item.sale_price ? Number(item.sale_price) : null
                const actualPrice = item.actual_price ? Number(item.actual_price) : itemSalePrice || itemPrice
                const priceInCoins = usdToCoins(actualPrice)

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="p-4 flex gap-4 rounded-3xl"
                    style={{
                      backgroundColor: theme.colors.card,
                      border: `1px solid ${theme.colors.border}`,
                      boxShadow: theme.shadows.sm
                    }}
                  >
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0" style={{ backgroundColor: theme.colors.surface }}>
                      <Image
                        src={item.main_image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                      {item.is_on_sale && itemSalePrice && (
                        <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                          SALE
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate" style={{ color: theme.colors.text }}>{item.title}</h3>
                      <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                        {item.categories?.map(c => c.name || c).join(', ')}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Image src="/omr_coin.png" alt="OMR" width={16} height={16} />
                          <span className="font-bold" style={{ color: theme.colors.text }}>{priceInCoins.toLocaleString()}</span>
                        </div>
                        {itemSalePrice && itemSalePrice < itemPrice && (
                          <span className="text-xs line-through" style={{ color: theme.colors.textMuted }}>
                            {usdToCoins(itemPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 rounded-xl transition-all self-start active:scale-95"
                      style={{ color: theme.colors.textMuted }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.errorLight
                        e.currentTarget.style.color = theme.colors.error
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = theme.colors.textMuted
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="p-5 space-y-4 sticky top-20 rounded-3xl" style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm
            }}>
              <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('cart.summary.title')}</h2>

              <div className="space-y-2">
                <label className="text-sm flex items-center gap-1" style={{ color: theme.colors.textSecondary }}>
                  <Tag size={14} />
                  {t('cart.summary.promo')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder={t('cart.summary.promoPlaceholder')}
                    disabled={isCalculating}
                    className="flex-1 px-3 py-2 border border-transparent rounded-xl text-sm outline-none transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderColor: 'transparent'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={isCalculating || !promoInput.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 active:scale-95"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: '#FFFFFF'
                    }}
                    onMouseEnter={(e) => !isCalculating && !promoInput.trim() ? null : e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    {t('cart.summary.apply')}
                  </button>
                </div>
                {discountMessage && (
                  <p className="text-xs flex items-center gap-1" style={{ color: theme.colors.error }}>
                    <AlertCircle size={12} />
                    {discountMessage}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-2xl" style={{ backgroundColor: theme.colors.surface }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1" style={{ color: theme.colors.textSecondary }}>
                    <Wallet size={14} />
                    {t('cart.yourBalance') || 'Ваш баланс'}
                  </span>
                  <span className="font-bold flex items-center gap-1" style={{ color: theme.colors.text }}>
                    <Image src="/omr_coin.png" alt="OMR" width={16} height={16} />
                    {userBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 space-y-2" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: theme.colors.textSecondary }}>{t('cart.summary.subtotal')}</span>
                  <span className="flex items-center gap-1" style={{ color: theme.colors.text }}>
                    {isCalculating ? (
                      <Loader size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Image src="/omr_coin.png" alt="OMR" width={14} height={14} />
                        {subtotalCoins.toLocaleString()}
                      </>
                    )}
                  </span>
                </div>

                {discountCoins > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: theme.colors.success }}>{t('cart.summary.discount')}</span>
                    <span className="flex items-center gap-1" style={{ color: theme.colors.success }}>
                      -<Image src="/omr_coin.png" alt="OMR" width={14} height={14} />
                      {discountCoins.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-2" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                  <span style={{ color: theme.colors.text }}>{t('cart.total') || 'До сплати'}</span>
                  <span className="flex items-center gap-1" style={{ color: theme.colors.text }}>
                    <Image src="/omr_coin.png" alt="OMR" width={20} height={20} />
                    {finalCoins.toLocaleString()}
                  </span>
                </div>
              </div>

              {!hasEnoughBalance && finalCoins > 0 && (
                <div className="p-3 rounded-2xl" style={{
                  backgroundColor: theme.colors.errorLight,
                  border: `1px solid ${theme.colors.error}33`
                }}>
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: theme.colors.error }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: theme.colors.error }}>
                        {t('cart.insufficientFunds') || 'Недостатньо монет'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: theme.colors.error, opacity: 0.8 }}>
                        {t('cart.needMore', { amount: shortfall }) || `Потрібно ще ${shortfall.toLocaleString()} OMR`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={isProcessing || isCalculating || items.length === 0}
                className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
                style={{
                  background: hasEnoughBalance
                    ? `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`
                    : '#F59E0B',
                  color: '#FFFFFF',
                  boxShadow: theme.shadows.md
                }}
                onMouseEnter={(e) => !isProcessing && !isCalculating && items.length > 0 ? e.currentTarget.style.opacity = '0.9' : null}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {isProcessing ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    <span>{t('common.processing')}</span>
                  </>
                ) : hasEnoughBalance ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Оплатити {finalCoins.toLocaleString()} OMR</span>
                  </>
                ) : (
                  <>
                    <Wallet size={18} />
                    <span>{t('cart.topUpWallet') || 'Поповнити гаманець'}</span>
                  </>
                )}
              </button>

              {promoCode && (
                <button
                  onClick={clearDiscounts}
                  className="w-full text-xs transition-colors text-center py-2"
                  style={{ color: theme.colors.textMuted }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textMuted}
                >
                  {t('cart.summary.cancelDiscount')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}