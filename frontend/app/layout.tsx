import type { Metadata, Viewport } from 'next';
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

// ВАЖЛИВО: Це виправляє колір годинника/батареї на мобільних
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Встановлюємо колір статус-бару таким же, як фон хедера (#F7F7FA або #FFFFFF)
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F7FA' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1A23' },
  ],
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
            <div className={`${inter.className} min-h-screen grid grid-rows-[auto_1fr] bg-background text-foreground selection:bg-primary/20`}>
              {/* Header винесений в окремий потік, щоб не перекривати контент */}
              <Header />

              <main className="overflow-y-auto pb-28 pt-2">
                {children}
              </main>

              <BottomNav />
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
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