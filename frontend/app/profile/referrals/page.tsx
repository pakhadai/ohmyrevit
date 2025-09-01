// frontend/app/profile/referrals/page.tsx
'use client';

import { Users } from 'lucide-react';
import Link from 'next/link';

export default function ReferralsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Реферальна програма</h1>
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-2xl">
        <Users size={48} className="mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Запрошуйте друзів — отримуйте бонуси!</h2>
        <p className="mb-4">Цей розділ наразі в розробці. Незабаром ви зможете ділитися посиланням та заробляти бонуси.</p>
        <Link href="/profile" className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Повернутися до профілю
        </Link>
      </div>
    </div>
  );
}