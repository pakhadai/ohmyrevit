import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { Toaster } from 'react-hot-toast';
import AppProvider from '@/components/AppProvider';
import TelegramProvider from '@/components/TelegramProvider';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'OhMyRevit',
  description: 'Revit Content Marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <TelegramProvider>
          <AppProvider>
            <div className="flex flex-col min-h-screen relative">
              {/* Хедер для відступу зверху (кнопки Telegram) */}
              <Header />

              {/* Основний контент з автоматичним відступом */}
              <main className="flex-1 w-full">
                {children}
              </main>

              {/* Навігація знизу */}
              <BottomNav />

              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </div>
          </AppProvider>
        </TelegramProvider>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}