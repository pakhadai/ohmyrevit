'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Tag, Coins } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

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
  const [promoInput, setPromoInput] = useState('')
  const [bonusInput, setBonusInput] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = getTotalPrice()
  const maxBonusPoints = Math.min(
    user?.bonus_balance || 0,
    Math.floor(subtotal * 50) // Максимум 50% від суми (в бонусах)
  )

  // Розрахунок знижки (локальний попередній розрахунок)
  const calculateDiscount = () => {
    if (promoCode) {
      // Тут можна додати запит до API для перевірки промокоду
      setDiscount(subtotal * 0.1) // Приклад: 10% знижка
    } else if (useBonusPoints > 0) {
      const bonusValue = useBonusPoints / 100 // 100 бонусів = $1
      const maxDiscount = subtotal * 0.5 // Максимум 50%
      setDiscount(Math.min(bonusValue, maxDiscount))
    } else {
      setDiscount(0)
    }
  }

  const handleCheckout = async () => {
    if (items.length === 0) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await api.post('/orders/checkout', {
        product_ids: items.map(item => item.id),
        promo_code: promoCode,
        use_bonus_points: useBonusPoints > 0 ? useBonusPoints : null
      })

      // Очищаємо кошик
      clearCart()

      // Перенаправляємо на сторінку оплати
      window.location.href = response.data.payment_url

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка при оформленні замовлення')
    } finally {
      setIsProcessing(false)
    }
  }

  const applyPromoCode = () => {
    if (promoInput.trim()) {
      setPromoCode(promoInput)
      setBonusPoints(0) // Скидаємо бонуси
      calculateDiscount()
    }
  }

  const applyBonusPoints = () => {
    const points = Math.min(bonusInput, maxBonusPoints)
    setBonusPoints(points)
    setPromoCode(null) // Скидаємо промокод
    calculateDiscount()
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Кошик порожній</h2>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg"
          >
            Перейти до маркетплейсу
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Кошик</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Список товарів */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-4"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-20 h-20 object-cover rounded"
                />

                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {item.salePrice ? (
                      <>
                        <span className="text-red-500 font-bold">
                          ${item.salePrice}
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
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Оформлення замовлення */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Оформлення замовлення</h2>

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
                disabled={useBonusPoints > 0}
                className="flex-1 px-3 py-2 border rounded-lg disabled:opacity-50"
              />
              <button
                onClick={applyPromoCode}
                disabled={useBonusPoints > 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                Застосувати
              </button>
            </div>
            {promoCode && (
              <p className="text-green-500 text-sm mt-1">
                Промокод {promoCode} застосовано
              </p>
            )}
          </div>

          {/* АБО */}
          <div className="text-center text-gray-500 my-4">АБО</div>

          {/* Бонуси */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              <Coins size={16} className="inline mr-1" />
              Бонуси (доступно: {user?.bonus_balance || 0})
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={bonusInput}
                onChange={(e) => setBonusInput(Number(e.target.value))}
                max={maxBonusPoints}
                disabled={!!promoCode}
                className="flex-1 px-3 py-2 border rounded-lg disabled:opacity-50"
              />
              <button
                onClick={applyBonusPoints}
                disabled={!!promoCode}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                Застосувати
              </button>
            </div>
            {useBonusPoints > 0 && (
              <p className="text-green-500 text-sm mt-1">
                Використано {useBonusPoints} бонусів (-${(useBonusPoints/100).toFixed(2)})
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Максимум 50% від суми замовлення
            </p>
          </div>

          {/* Підсумок */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Підсумок:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-500">
                <span>Знижка:</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold">
              <span>До сплати:</span>
              <span>${(subtotal - discount).toFixed(2)}</span>
            </div>
          </div>

          {/* Помилка */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Кнопка оформлення */}
          <button
            onClick={handleCheckout}
            disabled={isProcessing || items.length === 0}
            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:shadow-lg transition"
          >
            {isProcessing ? 'Обробка...' : 'Оформити замовлення'}
          </button>
        </div>
      </div>
    </div>
  )
}