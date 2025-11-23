'use client';

export default function Header() {
  return (
    // ОПТИМІЗАЦІЯ: Видалено backdrop-blur-md. Замінено на більш непрозорий фон для продуктивності.
    <header className="sticky top-0 left-0 right-0 z-40 bg-background/95 h-14 flex items-center justify-center border-b border-transparent">
        {/* Можна додати маленьке лого по центру, якщо потрібно, або залишити пустим для чистоти */}
        <div className="w-12 h-1 rounded-full bg-gray-200 dark:bg-gray-700 opacity-50"></div>
    </header>
  );
}