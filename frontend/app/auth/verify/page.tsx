'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        // Викликаємо бекенд
        const res = await api.post('/auth/verify', { token });

        // Зберігаємо дані (Backend тепер повертає CamelCase)
        const data = res.data;
        setToken(data.accessToken);
        setUser(data.user);

        setStatus('success');
        // Автоматичний редірект
        setTimeout(() => router.push('/'), 3000);
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
    };

    verify();
  }, [token, setToken, setUser, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {status === 'loading' && (
        <div className="space-y-4">
          <Loader className="w-12 h-12 text-primary animate-spin mx-auto" />
          <h1 className="text-xl font-bold">Перевірка пошти...</h1>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 animate-in fade-in zoom-in">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Пошту підтверджено!</h1>
          <p className="text-muted-foreground">Зараз вас буде перенаправлено...</p>
          <Link href="/" className="btn-primary inline-block px-6 py-2 rounded-xl mt-4">
            На головну
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 animate-in fade-in zoom-in">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Помилка підтвердження</h1>
          <p className="text-muted-foreground">Посилання недійсне або застаріло.</p>
          <Link href="/login" className="btn-primary inline-block px-6 py-2 rounded-xl mt-4">
            Спробувати увійти
          </Link>
        </div>
      )}
    </div>
  );
}