'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Check, Clock } from 'lucide-react'
import api from '@/lib/api'
import { useUserStore } from '@/store/userStore'

interface SubscriptionStatus {
  has_active_subscription: boolean
  subscription?: {
    start_date: string
    end_date: string
    days_remaining: number
  }
}

export default function SubscriptionBanner() {
  const { user } = useUserStore()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus()
    }
  }, [user])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/subscriptions/status')
      setStatus(response.data)
    } catch (error) {
      console.error('Error fetching subscription status:', error)
    }
  }

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      const response = await api.post('/subscriptions/checkout')
      window.location.href = response.data.payment_url
    } catch (error) {
      console.error('Error creating subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Якщо є активна підписка
  if (status?.has_active_subscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown size={32} />
            <div>
              <h3 className="text-xl font-bold">Premium активний</h3>
              <p className="text-sm opacity-90">
                Залишилось днів: {status.subscription?.days_remaining}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={20} />
            <span className="text-sm">
              До {new Date(status.subscription?.end_date || '').toLocaleDateString()}
            </span>
          </div>
        </div>
      </motion.div>
    )
  }

  // Промо банер для підписки
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8"
    >
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Crown size={40} />
            <h2 className="text-3xl font-bold">Premium Підписка</h2>
          </div>

          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <Check size={20} />
              <span>Доступ до всіх преміум товарів</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size={20} />
              <span>Нові товари щотижня</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size={20} />
              <span>Товари залишаються назавжди</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size={20} />
              <span>Пріоритетна підтримка</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <div className="mb-4">
            <span className="text-5xl font-bold">$5</span>
            <span className="text-xl">/місяць</span>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {isLoading ? 'Обробка...' : 'Оформити підписку'}
          </button>

          <p className="text-sm mt-3 opacity-80">
            Скасування в будь-який час
          </p>
        </div>
      </div>
    </motion.div>
  )
}