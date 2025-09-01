// frontend/app/profile/bonuses/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Clock } from 'lucide-react';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function BonusesPage() {
  const [bonusInfo, setBonusInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBonusInfo();
  }, []);

  const fetchBonusInfo = async () => {
    setLoading(true);
    try {
      const bonusData = await profileAPI.getBonusInfo();
      setBonusInfo(bonusData);
    } catch (error) {
      console.error('Error fetching bonus info:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimBonus = async () => {
    try {
      const result = await profileAPI.claimDailyBonus();
      if (result.success) {
        toast.success(result.message);
        fetchBonusInfo(); // Оновлюємо інформацію після отримання
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Помилка при отриманні бонусу');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!bonusInfo) {
    return <div className="text-center py-12">Не вдалося завантажити інформацію про бонуси.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Бонусна система</h1>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-4">Щоденний бонус</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{bonusInfo.streak} днів</p>
              <p className="opacity-90">Поточний стрік</p>
            </div>
            <button
              onClick={claimBonus}
              disabled={!bonusInfo.can_claim_today}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                bonusInfo.can_claim_today
                  ? 'bg-white text-orange-500 hover:bg-gray-100 transform hover:scale-105'
                  : 'bg-white/30 text-white cursor-not-allowed'
              }`}
            >
              {bonusInfo.can_claim_today ? 'Отримати бонус' : 'Вже отримано'}
            </button>
          </div>
          {!bonusInfo.can_claim_today && bonusInfo.next_claim_time && (
            <p className="mt-4 flex items-center gap-2 text-sm">
              <Clock size={16} />
              Наступний бонус буде доступний завтра.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Поточний баланс</p>
            <p className="text-3xl font-bold mt-1">{bonusInfo.balance} 💎</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Це еквівалентно ≈ ${(bonusInfo.balance / 100).toFixed(2)} знижки
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
             <h3 className="font-semibold mb-2">Як це працює?</h3>
             <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>- Заходьте щодня, щоб отримати бонуси.</li>
                <li>- Чим довше ваш стрік, тим більший бонус.</li>
                <li>- Використовуйте бонуси для оплати до 50% вартості замовлень.</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}