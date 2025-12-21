'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Mail, Loader, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { email });
      setSent(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Помилка реєстрації';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-background">
        <div className="max-w-md w-full space-y-6 animate-in fade-in zoom-in">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Перевірте пошту! 📧</h1>
          <p className="text-muted-foreground">
            Ми надіслали пароль для входу на <br/><span className="font-medium text-foreground">{email}</span>
          </p>
          <Link href="/login" className="btn-primary inline-block w-full py-3 rounded-xl">
            Перейти до входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Реєстрація 🚀</h1>
          <p className="text-sm text-muted-foreground mt-2">Створіть акаунт, щоб почати</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="email"
                placeholder="Ваш Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-muted/50 border border-transparent rounded-xl text-foreground focus:bg-background focus:border-primary/30 focus:ring-0 outline-none transition-all"
                required
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            </div>
            <p className="text-xs text-muted-foreground ml-1">
              Ми надішлемо пароль на цю адресу
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader className="animate-spin w-5 h-5" />}
            {loading ? 'Реєстрація...' : 'Продовжити'}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Вже є акаунт?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Увійти
          </Link>
        </div>
      </div>
    </div>
  );
}