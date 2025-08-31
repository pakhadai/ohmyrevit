'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Tag, Coins, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ordersAPI } from '@/lib/api' // ВИПРАВЛЕНО: імпортуємо ordersAPI
import toast from 'react-hot-toast'

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

  // Стан для відображення результатів розрахунку
  const [discountAmount, setDiscountAmount] = useState(0)
  const [finalTotal, setFinalTotal] = useState(getTotalPrice())
  const [discountMessage, setDiscountMessage] = useState<string | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  const subtotal = useMemo(() => getTotalPrice(), [items])

  // Функція для розрахунку знижки через API
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
        if (promo) toast.success('Промокод застосовано!');
        if (bonuses > 0) toast.success('Бонуси застосовано!');
      } else {
        setDiscountAmount(0);
        setFinalTotal(subtotal);
        setDiscountMessage(response.message || 'Не вдалося застосувати знижку');
        if (promo) setPromoCode(null);
        if (bonuses > 0) setBonusPoints(0);
      }
    } catch (err: any) {
      toast.error('Помилка при розрахунку знижки');
      setDiscountAmount(0);
      setFinalTotal(subtotal);
    } finally {
      setIsCalculating(false);
    }
  }

  // Перераховуємо знижку при зміні кошика
  useEffect(() => {
    calculateDiscount(promoCode, useBonusPoints);
  }, [items, promoCode, useBonusPoints]);

  // Встановлюємо початкову фінальну суму
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

      toast.success(response.message || 'Створюємо замовлення...');

      // Якщо є посилання на оплату - переходимо, інакше замовлення безкоштовне
      if (response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        // Замовлення було безкоштовним (наприклад, 100% знижка)
        clearCart();
        router.push('/profile'); // Перенаправляємо в профіль до завантажень
      }

    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Помилка при оформленні замовлення');
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
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Ваш кошик порожній</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Схоже, ви ще нічого не додали. Час це виправити!</p>
        <button
          onClick={() => router.push('/marketplace')}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          Перейти до маркетплейсу
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Мій кошик</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Список товарів */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center gap-4 shadow"
              >
                <img
                  // ВИПРАВЛЕНО: Використовуємо main_image_url з типу Product
                  src={item.main_image_url}
                  alt={item.title}
                  className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {item.sale_price ? (
                      <>
                        <span className="text-red-500 font-bold">
                          ${item.sale_price}
                        </span>
                        <span className="text-gray-400 line-through text-sm">
                          ${item.price}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold">${item.price}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Оформлення замовлення */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 h-fit shadow">
          <h2 className="text-xl font-bold mb-4">Ваше замовлення</h2>

          {/* Промокод */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              <Tag size={16} className="inline mr-1" />
              Промокод
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Введіть код"
                disabled={useBonusPoints > 0 || isCalculating}
                className="flex-1 px-3 py-2 border rounded-lg disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600"
              />
              <button
                onClick={applyPromoCode}
                disabled={useBonusPoints > 0 || isCalculating}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                OK
              </button>
            </div>
          </div>

          <div className="relative text-center my-4">
              <span className="absolute left-0 top-1/2 w-full h-px bg-gray-200 dark:bg-slate-700"></span>
              <span className="relative bg-white dark:bg-slate-800 px-2 text-xs text-gray-500">АБО</span>
          </div>

          {/* Бонуси */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              <Coins size={16} className="inline mr-1" />
              Використати бонуси (доступно: {user?.bonus_balance || 0})
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={bonusInput}
                onChange={(e) => setBonusInput(Number(e.target.value))}
                max={user?.bonus_balance || 0}
                disabled={!!promoCode || isCalculating}
                className="flex-1 px-3 py-2 border rounded-lg disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600"
              />
              <button
                onClick={applyBonusPoints}
                disabled={!!promoCode || isCalculating}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                OK
              </button>
            </div>
          </div>

          {/* Повідомлення про знижку/помилку */}
          {discountMessage && (
              <div className="flex items-center gap-2 p-3 mb-4 text-sm text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-500/20 rounded-lg">
                  <AlertCircle size={18} />
                  <span>{discountMessage}</span>
              </div>
          )}

          {/* Підсумок */}
          <div className="border-t dark:border-slate-700 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Разом:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-500">
                <span>Знижка:</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold">
              <span>До сплати:</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Кнопка оформлення */}
          <button
            onClick={handleCheckout}
            disabled={isProcessing || isCalculating || items.length === 0}
            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:shadow-lg transition"
          >
            {isProcessing ? 'Обробка...' : 'Оформити замовлення'}
          </button>

          {(promoCode || useBonusPoints > 0) && (
              <button
                onClick={clearDiscounts}
                className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Скасувати знижку
              </button>
          )}
        </div>
      </div>
    </div>
  )
}
