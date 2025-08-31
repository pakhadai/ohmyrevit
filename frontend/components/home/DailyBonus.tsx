'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, TrendingUp, Clock } from 'lucide-react';
import { profileAPI } from '@/lib/api/profile';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function DailyBonus() {
  const { user, isAuthenticated } = useAuthStore();
  const [bonusInfo, setBonusInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchBonusInfo();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setInterval(() => {
      updateTimeLeft();
    }, 1000);
    return () => clearInterval(timer);
  }, [bonusInfo]);

  const fetchBonusInfo = async () => {
    try {
      const data = await profileAPI.getBonusInfo();
      setBonusInfo(data);
    } catch (error) {
      console.error('Error fetching bonus info:', error);
    }
  };

  const updateTimeLeft = () => {
    if (!bonusInfo || bonusInfo.can_claim_today) return;

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  const claimBonus = async () => {
    try {
      const result = await profileAPI.claimDailyBonus();
      if (result.success) {
        toast.success(`🎉 ${result.message}`);
        fetchBonusInfo();
      }
    } catch (error) {
      toast.error('Помилка при отриманні бонусу');
    }
  };

  if (!isAuthenticated || !bonusInfo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Gift size={24} />
          Щоденний бонус
        </h3>
        <div className="text-right">
          <p className="text-2xl font-bold">{bonusInfo.streak}</p>
          <p className="text-xs opacity-90">днів поспіль</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Прогрес стріку */}
        <div className="bg-white/20 rounded-lg p-3">
          <div className="flex justify-between text-sm mb-2">
            <span>Стрік-прогрес</span>
            <span>{bonusInfo.streak}/7</span>
          </div>
          <div className="bg-white/30 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(bonusInfo.streak % 7) * 14.28}%` }}
              className="bg-white h-full"
            />
          </div>
          <p className="text-xs mt-1 opacity-90">
            Ще {7 - (bonusInfo.streak % 7)} днів до бонусу x7
          </p>
        </div>

        {/* Кнопка отримання */}
        {bonusInfo.can_claim_today ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={claimBonus}
            className="w-full bg-white text-orange-500 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            Отримати бонус! 🎁
          </motion.button>
        ) : (
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <p className="flex items-center justify-center gap-2">
              <Clock size={16} />
              Наступний бонус через
            </p>
            <p className="text-xl font-bold mt-1">{timeLeft}</p>
          </div>
        )}

        {/* Поточний баланс */}
        <div className="flex justify-between items-center pt-3 border-t border-white/20">
          <span className="opacity-90">Ваш баланс:</span>
          <span className="font-bold text-xl">{bonusInfo.balance} 💎</span>
        </div>
      </div>
    </motion.div>
  );
}