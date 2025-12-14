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
  title: 'OhMyRevit - Revit Content Marketplace',
  description: 'Premium content for Autodesk Revit',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
    <html lang="en" suppressHydrationWarning>
      <body>
        <TelegramProvider>
          <AppProvider>
            <div className={`${inter.className} min-h-screen grid grid-rows-[auto_1fr] bg-background text-foreground selection:bg-primary/20`}>
              <Header />

              <main className="overflow-y-auto pb-28 pt-2">
                {children}
              </main>

              <BottomNav />
              <Toaster
                position="top-center"
                containerStyle={{
                 top: 80,
                }}
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

        <Script id="console-cleanup" strategy="beforeInteractive">
          {`
            (function() {
              var originalLog = console.log;
              console.log = function(...args) {

                if (args[0] && typeof args[0] === 'string' && (
                    args[0].includes('[Telegram.WebView]') ||
                    args[0].includes('postEvent') ||
                    args[0].includes('receiveEvent')
                )) {
                  return;
                }

                originalLog.apply(console, args);
              };

              console.log(
                '%c OhMyREVIT ',
                'background: #667eea; color: white; font-weight: bold; font-size: 16px; padding: 4px 10px; border-radius: 4px;'
              );
            })();
          `}
        </Script>

        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}