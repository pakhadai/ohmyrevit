import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware для додатку.
 * Наразі не виконує жодних дій, але може бути розширений для:
 * - i18n роутингу (додавання /uk, /en до URL)
 * - Перевірки автентифікації на певних маршрутах
 * - A/B тестування
 */
export function middleware(request: NextRequest) {
  // Просто передаємо запит далі без змін
  return NextResponse.next();
}

// Конфігурація шляхів, на яких буде працювати middleware.
// Порожній matcher означає, що він не буде активним для жодного шляху,
// доки його не буде налаштовано.
export const config = {
  matcher: [
    /*
     * Приклад:
     * '/((?!api|_next/static|_next/image|favicon.ico).*)'
     */
  ],
};