'use client';

export default function Header() {
  return (
    // Хедер тепер зливається з фоном (bg-background), але має blur для контенту під ним
    <header className="sticky top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md h-14 flex items-center justify-center transition-colors duration-300">
        {/* Можна додати маленьке лого по центру, якщо потрібно, або залишити пустим для чистоти */}
        <div className="w-12 h-1 rounded-full bg-gray-200 dark:bg-gray-700 opacity-50"></div>
    </header>
  );
}