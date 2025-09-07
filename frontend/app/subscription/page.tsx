// frontend/app/subscription/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { subscriptionsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { Crown, CheckCircle, Loader, ArrowLeft, Calendar, Sparkles, Server } from 'lucide-react';
import toast from 'react-hot-toast';

interface SubscriptionStatus {
  has_active_subscription: boolean;
  subscription?: {
    start_date: string;
    end_date: string;
    days_remaining: number;
  };
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        // Можливо, показати повідомлення або перенаправити на логін
        return;
      }
      try {
        const data = await subscriptionsAPI.getStatus();
        setStatus(data);
      } catch (error) {
        toast.error('Не вдалося завантажити статус підписки.');
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [isAuthenticated]);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const response = await subscriptionsAPI.checkout();
      if (response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        toast.error('Не вдалося отримати посилання на оплату.');
      }
    } catch (error) {
      toast.error('Помилка при створенні підписки.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
       <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 mb-6">
          <ArrowLeft size={20} />
          <span>Назад</span>
        </button>

      {status?.has_active_subscription ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center shadow-lg"
        >
          <Crown className="mx-auto w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Ваш Premium активний!</h1>
          <p className="opacity-90 mb-6">Насолоджуйтесь необмеженим доступом до нових сімейств.</p>
          <div className="bg-white/20 rounded-lg p-4 max-w-sm mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar size={20} />
                <span>Діє до:</span>
              </div>
              <span className="font-semibold">{new Date(status.subscription!.end_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <span>Залишилось днів:</span>
              </div>
              <span className="font-semibold">{status.subscription!.days_remaining}</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
        >
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white">
                <div className="flex items-center gap-4">
                    <Crown className="w-12 h-12" />
                    <div>
                        <h1 className="text-3xl font-bold">Premium Підписка</h1>
                        <p className="opacity-90">Отримайте максимум від OhMyRevit</p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <h2 className="text-xl font-semibold mb-4">Що ви отримуєте:</h2>
                <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><b>Доступ до всіх преміум-товарів</b>, що вийшли під час дії підписки.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><b>Пожиттєвий доступ:</b> Отримані товари залишаються з вами назавжди, навіть після закінчення підписки.</span>
                    </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><b>Регулярні оновлення:</b> Нові ексклюзивні сімейства та архіви щотижня.</span>
                    </li>
                </ul>

                <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-6 text-center">
                    <p className="text-lg">Вартість</p>
                    <p className="text-5xl font-bold my-2">$5<span className="text-xl font-normal text-gray-500">/місяць</span></p>
                    <button
                        onClick={handleSubscribe}
                        disabled={isProcessing}
                        className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:shadow-lg transition"
                    >
                        {isProcessing ? 'Обробка...' : 'Оформити підписку'}
                    </button>
                </div>
            </div>
        </motion.div>
      )}
    </div>
  );
}