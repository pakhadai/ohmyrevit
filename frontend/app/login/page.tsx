'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Mail, Lock, Loader } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data;

      // FIX: Використовуємо CamelCase ключі, які тепер повертає бекенд
      setToken(data.accessToken);
      setUser(data.user);

      toast.success('Вхід успішний');
      router.push('/');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Невірний логін або пароль';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">З поверненням! 👋</h1>
          <p className="text-sm text-muted-foreground mt-2">Увійдіть у свій акаунт</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-muted/50 border border-transparent rounded-xl text-foreground focus:bg-background focus:border-primary/30 focus:ring-0 outline-none transition-all"
                required
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-muted/50 border border-transparent rounded-xl text-foreground focus:bg-background focus:border-primary/30 focus:ring-0 outline-none transition-all"
                required
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Забули пароль?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader className="animate-spin w-5 h-5" />}
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Немає акаунту?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Зареєструватися
          </Link>
        </div>
      </div>
    </div>
  );
}