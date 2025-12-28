'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Lock, Eye, Database, Mail, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';
import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const sections = [
    {
      icon: Database,
      title: t('privacy.dataCollection.title') || 'Які дані ми збираємо',
      content: [
        t('privacy.dataCollection.telegram') || '• **Telegram дані**: ім\'я, прізвище, username, Telegram ID',
        t('privacy.dataCollection.email') || '• **Email адреса**: для підтвердження акаунту та важливих повідомлень',
        t('privacy.dataCollection.transactions') || '• **Транзакції**: історія покупок, баланс OMR Coins',
        t('privacy.dataCollection.usage') || '• **Дані використання**: завантажені продукти, активність на платформі',
      ]
    },
    {
      icon: Lock,
      title: t('privacy.dataUsage.title') || 'Як ми використовуємо ваші дані',
      content: [
        t('privacy.dataUsage.authentication') || '• **Автентифікація**: для входу через Telegram',
        t('privacy.dataUsage.orders') || '• **Обробка замовлень**: для виконання покупок та надання доступу до продуктів',
        t('privacy.dataUsage.communication') || '• **Комунікація**: для відправки підтверджень, квитанцій, важливих оновлень',
        t('privacy.dataUsage.analytics') || '• **Аналітика**: для покращення якості сервісу (анонімно)',
      ]
    },
    {
      icon: Shield,
      title: t('privacy.dataSecurity.title') || 'Як ми захищаємо ваші дані',
      content: [
        t('privacy.dataSecurity.encryption') || '• **Шифрування**: всі дані передаються через HTTPS',
        t('privacy.dataSecurity.hashing') || '• **Хешування**: паролі зберігаються у зашифрованому вигляді',
        t('privacy.dataSecurity.access') || '• **Обмежений доступ**: тільки авторизований персонал має доступ до даних',
        t('privacy.dataSecurity.backups') || '• **Резервні копії**: регулярне створення backup для збереження даних',
      ]
    },
    {
      icon: Eye,
      title: t('privacy.dataSharing.title') || 'Чи передаємо ми дані третім особам',
      content: [
        t('privacy.dataSharing.payment') || '• **Платіжні системи**: Gumroad для обробки платежів (згідно з їх політикою конфіденційності)',
        t('privacy.dataSharing.email') || '• **Email сервіси**: Resend для відправки транзакційних email',
        t('privacy.dataSharing.noSell') || '• **Ми НЕ продаємо** ваші особисті дані рекламодавцям або третім особам',
        t('privacy.dataSharing.telegram') || '• **Telegram**: використовується тільки для автентифікації',
      ]
    },
    {
      icon: Mail,
      title: t('privacy.userRights.title') || 'Ваші права',
      content: [
        t('privacy.userRights.access') || '• **Доступ**: ви можете переглядати всі ваші дані в профілі',
        t('privacy.userRights.correction') || '• **Виправлення**: ви можете оновити свій email в налаштуваннях',
        t('privacy.userRights.deletion') || '• **Видалення**: ви можете видалити акаунт, зв\'язавшись з підтримкою',
        t('privacy.userRights.export') || '• **Експорт**: запит на експорт ваших даних через підтримку',
      ]
    },
    {
      icon: FileText,
      title: t('privacy.cookies.title') || 'Cookies та LocalStorage',
      content: [
        t('privacy.cookies.authentication') || '• **JWT токени**: для підтримки сесії після входу',
        t('privacy.cookies.preferences') || '• **Налаштування**: тема, мова інтерфейсу',
        t('privacy.cookies.cart') || '• **Кошик**: збереження товарів в кошику',
        t('privacy.cookies.noTracking') || '• **Без стеження**: ми не використовуємо cookies для відстеження',
      ]
    },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.colors.bgGradient }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl" style={{ backgroundColor: `${theme.colors.background}CC`, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={24} style={{ color: theme.colors.text }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: theme.colors.text }}>
            {t('privacy.pageTitle') || 'Політика конфіденційності'}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {/* Intro Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}20` }}>
              <Shield size={24} style={{ color: theme.colors.primary }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                {t('privacy.intro.title') || 'Ваша конфіденційність важлива'}
              </h2>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                {t('privacy.intro.date') || 'Оновлено: 28 грудня 2024'}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: theme.colors.textSecondary }}>
            {t('privacy.intro.description') ||
              'OhMyRevit поважає вашу конфіденційність і зобов\'язується захищати ваші особисті дані. Ця політика пояснює, які дані ми збираємо, як їх використовуємо та які права ви маєте.'
            }
          </p>
        </motion.div>

        {/* Sections */}
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="p-6 rounded-3xl"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.colors.surface }}>
                <section.icon size={20} style={{ color: theme.colors.primary }} />
              </div>
              <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
                {section.title}
              </h3>
            </div>
            <div className="space-y-2">
              {section.content.map((item, itemIndex) => (
                <p
                  key={itemIndex}
                  className="text-sm leading-relaxed"
                  style={{ color: theme.colors.textSecondary }}
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              ))}
            </div>
          </motion.div>
        ))}

        {/* GDPR Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-3xl"
          style={{
            backgroundColor: `${theme.colors.primary}10`,
            border: `1px solid ${theme.colors.primary}33`,
          }}
        >
          <h3 className="text-base font-bold mb-3" style={{ color: theme.colors.text }}>
            {t('privacy.gdpr.title') || 'GDPR та відповідність'}
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: theme.colors.textSecondary }}>
            {t('privacy.gdpr.description') ||
              'Ми дотримуємось вимог GDPR (General Data Protection Regulation) для захисту персональних даних користувачів з Європейського Союзу.'
            }
          </p>
          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
            <p className="mb-2">
              <strong style={{ color: theme.colors.text }}>{t('privacy.gdpr.retention') || 'Період зберігання даних:'}</strong>
            </p>
            <ul className="space-y-1 ml-4">
              <li>{t('privacy.gdpr.activeAccount') || '• Активні акаунти: дані зберігаються до видалення акаунту'}</li>
              <li>{t('privacy.gdpr.transactions') || '• Транзакції: 7 років (податкове законодавство)'}</li>
              <li>{t('privacy.gdpr.inactiveAccount') || '• Неактивні акаунти: видаляються через 3 роки бездіяльності'}</li>
            </ul>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 rounded-3xl text-center"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <h3 className="text-base font-bold mb-2" style={{ color: theme.colors.text }}>
            {t('privacy.contact.title') || 'Є питання?'}
          </h3>
          <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
            {t('privacy.contact.description') ||
              'Якщо у вас є питання щодо нашої політики конфіденційності, зв\'яжіться з нами:'
            }
          </p>
          <button
            onClick={() => router.push('/profile/support')}
            className="px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#FFF',
            }}
          >
            {t('privacy.contact.button') || 'Зв\'язатися з підтримкою'}
          </button>
          <p className="text-xs mt-4" style={{ color: theme.colors.textMuted }}>
            Email: support@ohmyrevit.pp.ua
          </p>
        </motion.div>

        {/* Last Updated */}
        <p className="text-xs text-center" style={{ color: theme.colors.textMuted }}>
          {t('privacy.lastUpdated') || 'Остання редакція: 28 грудня 2024'}
        </p>
      </div>
    </div>
  );
}
