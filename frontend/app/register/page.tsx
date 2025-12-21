'use client';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Mail, ArrowRight, Loader } from 'lucide-react';

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
      toast.error(err.response?.data?.detail || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-card p-8 rounded-3xl border border-border shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <Mail size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Перевірте пошту! 📧</h1>
            <p className="text-muted-foreground">
              Ми надіслали посилання для підтвердження на <b>{email}</b>.
              <br/>
              Перейдіть за ним, щоб отримати пароль для входу.
            </p>
          </div>
          <Link href="/login" className="btn-primary w-full block py-3 text-center">
            Повернутися до входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Реєстрація</h1>
            <p className="text-muted-foreground">Створіть акаунт для доступу до покупок</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium ml-1">Ваш Email</label>
            <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border bg-card focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-lg font-semibold"
          >
            {loading ? <Loader className="animate-spin" /> : (
                <>
                    Продовжити
                    <ArrowRight size={20} />
                </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Вже маєте акаунт? <Link href="/login" className="text-primary hover:underline font-medium">Увійти</Link>
        </p>
      </div>
    </div>
  );
}