'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, Gift, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero секція */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 mb-8 text-white"
      >
        <h1 className="text-4xl font-bold mb-4">
          Ласкаво просимо до OhMyRevit
        </h1>
        <p className="text-xl mb-6 opacity-90">
          Найкращий маркетплейс Revit контенту
        </p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
        >
          <ShoppingBag size={20} />
          Перейти до маркету
        </Link>
      </motion.div>

      {/* Функції */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: ShoppingBag,
            title: 'Маркетплейс',
            description: 'Тисячі моделей для Revit',
            color: 'from-blue-500 to-cyan-500',
            link: '/marketplace'
          },
          {
            icon: Gift,
            title: 'Щоденні бонуси',
            description: 'Отримуйте бонуси кожен день',
            color: 'from-yellow-500 to-orange-500',
            link: '/profile'
          },
          {
            icon: TrendingUp,
            title: 'Підписка',
            description: 'Необмежений доступ за $5/міс',
            color: 'from-green-500 to-emerald-500',
            link: '/subscription'
          },
          {
            icon: Users,
            title: 'Спільнота',
            description: 'Приєднуйтесь до нашої спільноти',
            color: 'from-purple-500 to-pink-500',
            link: '/community'
          }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => router.push(item.link)}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-10 rounded-full -mr-16 -mt-16`} />
              <Icon className="w-10 h-10 mb-3 text-gray-700 dark:text-gray-300" />
              <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Новинки */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Останні новинки</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Тут будуть картки товарів */}
          <div className="text-center text-gray-500 col-span-full py-8">
            Завантаження новинок...
          </div>
        </div>
      </div>
    </div>
  );
}