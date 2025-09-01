// frontend/app/profile/favorites/page.tsx
'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function FavoritesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Вибрані товари</h1>
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-2xl">
        <Heart size={48} className="mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Розділ у розробці</h2>
        <p className="mb-4">Тут будуть відображатися товари, які ви додали до вибраного.</p>
        <Link href="/marketplace" className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Перейти до маркету
        </Link>
      </div>
    </div>
  );
}