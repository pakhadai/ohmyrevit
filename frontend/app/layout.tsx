import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import SwipeNavigation from '@/components/SwipeNavigation';
import { Toaster } from 'react-hot-toast';
import AppProvider from '@/components/AppProvider';
import TelegramProvider from '@/components/TelegramProvider';
import ThemeProvider from '@/components/ThemeProvider';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'OhMyRevit - Revit Content Marketplace',
  description: 'Premium content for Autodesk Revit',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDFCFA' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0D0D' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={inter.className}>
        <TelegramProvider>
          <ThemeProvider>
            <AppProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 pb-0">
                  <SwipeNavigation>
                    {children}
                  </SwipeNavigation>
                </main>
                <BottomNav />
                <Toaster
                  position="top-center"
                  containerStyle={{ top: 80 }}
                  toastOptions={{
                    duration: 3000,
                    style: {
                      borderRadius: '16px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                    },
                  }}
                />
              </div>
            </AppProvider>
          </ThemeProvider>
        </TelegramProvider>

        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}