'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowLeft, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Тимчасові дані (сюди ви вставите свої реальні питання)
const faqs = [
  {
    question: 'Як встановити завантажені сімейства в Revit?',
    answer: 'Після завантаження файлу .rfa, відкрийте свій проект у Revit. Перейдіть на вкладку "Insert" -> "Load Family" та виберіть завантажений файл.'
  },
  {
    question: 'Чи можу я використовувати куплені товари в комерційних проектах?',
    answer: 'Так, всі придбані товари мають комерційну ліцензію на використання у ваших проектах. Однак, перепродаж самих файлів заборонено.'
  },
  {
    question: 'Як працює система бонусів?',
    answer: 'Ви отримуєте бонуси за щоденний вхід та за запрошення друзів. Бонусами можна оплачувати до 50% вартості покупок.'
  },
  {
    question: 'Що дає Premium підписка?',
    answer: 'Premium підписка відкриває доступ до всіх платних товарів без обмежень на час дії підписки. Також ви отримуєте пріоритетну підтримку.'
  },
  {
    question: 'Як повернути кошти?',
    answer: 'Якщо товар не відповідає опису або виникла технічна проблема, напишіть нам у підтримку, і ми розглянемо ваше звернення протягом 24 годин.'
  }
];

export default function FaqPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="container mx-auto px-4 py-2">
      {/* Заголовок з кнопкою назад */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{t('profilePages.faq.pageTitle')}</h1>
      </div>

      {/* Список питань */}
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors focus:outline-none"
            >
              <span className="font-semibold pr-4 text-gray-800 dark:text-gray-200">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="text-purple-500 flex-shrink-0 transition-transform" />
              ) : (
                <ChevronDown className="text-gray-400 flex-shrink-0 transition-transform" />
              )}
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="px-5 pb-5 pt-0 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-100 dark:border-slate-700 mt-2 pt-4">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Якщо список порожній */}
      {faqs.length === 0 && (
         <div className="text-center py-12 text-gray-500">
            <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t('profilePages.faq.answersComingSoon')}</p>
         </div>
      )}
    </div>
  );
}