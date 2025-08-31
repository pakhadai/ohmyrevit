'use client';

import { SDKProvider } from '@telegram-apps/sdk-react';
import React from 'react';

// Цей компонент є клієнтською обгорткою для SDKProvider.
// Він гарантує, що бібліотека Telegram буде виконуватися тільки в браузері.
export default function TelegramProvider({ children }: { children: React.ReactNode }) {
    return (
        <SDKProvider>
            {children}
        </SDKProvider>
    );
}
