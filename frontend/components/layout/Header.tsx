'use client';

export default function Header() {
  return (
    // Змінено bg-gray-100/90 на bg-gray-300/90 для більшого затемнення у світлій темі.
    // Ви можете спробувати bg-gray-400/90, якщо цього буде недостатньо.
    // У темній темі залишив dark:bg-slate-900/90 (або можна замінити на dark:bg-black/90).
    <header className="sticky top-0 left-0 right-0 z-50 bg-gray-300/90 dark:bg-slate-950/90 backdrop-blur-sm transition-colors duration-300">
      <div className="w-full h-14"></div>
    </header>
  );
}