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
  title: 'OhMyRevit - Маркетплейс Revit контенту',
  description: 'Преміум контент для Autodesk Revit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body>
        <TelegramProvider>
          <AppProvider>
            <div className={`${inter.className} min-h-screen grid grid-rows-[auto_1fr] bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100`}>
              <Header />
              <main className="overflow-y-auto pb-20">
                {children}
              </main>
              <BottomNav />
              <Toaster position="top-center" />
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