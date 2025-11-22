'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, FileText, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Тимчасові дані
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
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 space-y-6">

      {/* Заголовок */}
      <div className="flex items-center gap-4 pt-2">
         <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
            <FileText size={24} />
         </div>
         <div>
            <h1 className="text-2xl font-bold text-foreground">{t('profilePages.faq.pageTitle')}</h1>
            <p className="text-sm text-muted-foreground font-medium">Відповіді на популярні питання</p>
         </div>
      </div>

      {/* Список питань */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`card-minimal overflow-hidden transition-all duration-300 ${openIndex === index ? 'ring-2 ring-primary/20' : ''}`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full p-5 flex items-center justify-between text-left focus:outline-none group"
            >
              <span className={`font-semibold pr-4 text-sm transition-colors ${openIndex === index ? 'text-primary' : 'text-foreground group-hover:text-primary/80'}`}>
                {faq.question}
              </span>
              <div className={`p-1 rounded-full transition-all duration-300 ${openIndex === index ? 'bg-primary text-primary-foreground rotate-180' : 'bg-muted text-muted-foreground group-hover:bg-muted/80'}`}>
                <ChevronDown size={16} />
              </div>
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <div className="px-5 pb-5 pt-0">
                    <div className="pt-4 border-t border-border/50">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {faq.answer}
                        </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Якщо список порожній */}
      {faqs.length === 0 && (
         <div className="text-center py-20 px-6 bg-muted/30 rounded-[24px] border border-dashed border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">{t('profilePages.faq.answersComingSoon')}</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t('profilePages.faq.description')}</p>
         </div>
      )}
    </div>
  );
}