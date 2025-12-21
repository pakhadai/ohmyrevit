'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Відправляємо запит на бекенд
      await api.post('/auth/forgot-password', { email });

      // Показуємо успіх незалежно від того, чи існує email (для безпеки)
      toast.success('Якщо пошта зареєстрована, ми надіслали інструкції', {
        duration: 5000,
        icon: '📩'
      });

      // Даємо час прочитати повідомлення перед переходом
      setTimeout(() => router.push('/login'), 3000);
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Помилка з\'єднання';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Відновлення доступу 🔐</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Введіть вашу пошту, щоб отримати новий пароль
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-muted/50 border border-transparent rounded-xl text-foreground focus:bg-background focus:border-primary/30 focus:ring-0 outline-none transition-all"
                required
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
          >
            {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Відновити пароль'}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Повернутися на вхід
          </Link>
        </div>
      </div>
    </div>
  );
}