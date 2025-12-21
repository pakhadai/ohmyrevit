'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Loader } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Використовуємо ендпоінт, який ми створили в router.py
      await api.post('/auth/forgot-password', { email });
      toast.success('Якщо пошта існує, ми надіслали новий пароль');
      // Можна перенаправити на логін через кілька секунд
      setTimeout(() => router.push('/login'), 2000);
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Помилка запиту';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Відновлення пароля</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Введіть вашу пошту, щоб отримати новий пароль
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-transparent rounded-xl text-foreground focus:bg-background focus:border-primary/30 focus:ring-0 outline-none transition-all"
                required
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold disabled:opacity-70"
          >
            {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Відновити пароль'}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Повернутися на вхід
          </Link>
        </div>
      </div>
    </div>
  );
}