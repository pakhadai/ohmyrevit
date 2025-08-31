'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Heart, Users, HelpCircle,
  FileText, Gift, TrendingUp, Clock
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api/profile';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('downloads');
  const [downloads, setDownloads] = useState([]);
  const [bonusInfo, setBonusInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch(activeTab) {
        case 'downloads':
          const downloadsData = await profileAPI.getDownloads();
          setDownloads(downloadsData.products);
          break;
        case 'bonuses':
          const bonusData = await profileAPI.getBonusInfo();
          setBonusInfo(bonusData);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimBonus = async () => {
    try {
      const result = await profileAPI.claimDailyBonus();
      if (result.success) {
        toast.success(result.message);
        setBonusInfo({
          ...bonusInfo,
          balance: result.new_balance,
          streak: result.streak,
          can_claim_today: false
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Помилка при отриманні бонусу');
    }
  };

  const tabs = [
    { id: 'downloads', label: 'Завантаження', icon: Download },
    { id: 'favorites', label: 'Вибрані', icon: Heart },
    { id: 'bonuses', label: 'Бонуси', icon: Gift },
    { id: 'referrals', label: 'Реферали', icon: Users },
    { id: 'support', label: 'Підтримка', icon: HelpCircle },
    { id: 'faq', label: 'FAQ', icon: FileText }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Шапка профілю */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.first_name}</h1>
            <p className="opacity-90">@{user?.username || 'user'}</p>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Gift size={16} />
                {user?.bonus_balance || 0} бонусів
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp size={16} />
                Стрік: {user?.bonus_streak || 0} днів
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Таби */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Контент */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : (
          <>
            {/* Вкладка Завантаження */}
            {activeTab === 'downloads' && (
              <div className="grid gap-4">
                {downloads.length > 0 ? (
                  downloads.map((product: any) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={product.main_image_url}
                          alt={product.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">{product.title}</h3>
                          <p className="text-sm text-gray-500">
                            {product.file_size_mb} MB • {product.compatibility}
                          </p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                        <Download size={18} />
                        Завантажити
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Download size={48} className="mx-auto mb-4 opacity-50" />
                    <p>У вас поки немає доступних завантажень</p>
                  </div>
                )}
              </div>
            )}

            {/* Вкладка Бонуси */}
            {activeTab === 'bonuses' && bonusInfo && (
              <div className="space-y-6">
                {/* Щоденний бонус */}
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
                  <h2 className="text-xl font-bold mb-4">Щоденний бонус</h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">{bonusInfo.streak} днів</p>
                      <p className="opacity-90">Поточний стрік</p>
                    </div>
                    <button
                      onClick={claimBonus}
                      disabled={!bonusInfo.can_claim_today}
                      className={`px-6 py-3 rounded-lg font-semibold ${
                        bonusInfo.can_claim_today
                          ? 'bg-white text-orange-500 hover:bg-gray-100'
                          : 'bg-white/30 text-white cursor-not-allowed'
                      }`}
                    >
                      {bonusInfo.can_claim_today ? 'Отримати бонус' : 'Вже отримано'}
                    </button>
                  </div>
                  {!bonusInfo.can_claim_today && (
                    <p className="mt-4 flex items-center gap-2">
                      <Clock size={16} />
                      Наступний бонус через {bonusInfo.next_claim_time}
                    </p>
                  )}
                </div>

                {/* Статистика */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Поточний баланс</p>
                    <p className="text-2xl font-bold">{bonusInfo.balance}</p>
                    <p className="text-sm text-gray-500">≈ ${(bonusInfo.balance / 100).toFixed(2)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Максимальний стрік</p>
                    <p className="text-2xl font-bold">{bonusInfo.streak}</p>
                    <p className="text-sm text-gray-500">днів поспіль</p>
                  </div>
                </div>
              </div>
            )}

            {/* Інші вкладки - заглушки */}
            {['favorites', 'referrals', 'support', 'faq'].includes(activeTab) && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-xl mb-2">Скоро буде!</p>
                <p>Цей розділ в розробці</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}