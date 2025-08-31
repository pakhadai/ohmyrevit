'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Gem, Download, Heart, LogOut, ChevronRight } from 'lucide-react';
import Image from 'next/image';

// Компонент для елементів меню
const ProfileMenuItem = ({ icon: Icon, text, onClick }: { icon: React.ElementType, text: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full p-4 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
        <div className="flex items-center gap-4">
            <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            <span className="font-semibold">{text}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
);

export default function ProfilePage() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // Якщо користувач не автентифікований, повертаємо його на головну
        if (!isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (!user) {
        // Показуємо завантажувач, поки дані користувача не завантажились
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Завантаження профілю...</p>
            </div>
        );
    }

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Інформація про користувача */}
            <div className="flex flex-col items-center mb-8">
                <div className="relative w-24 h-24 mb-4">
                    <Image
                        src={user.photo_url || '/default-avatar.png'} // Потрібно додати default-avatar.png в public
                        alt="User Avatar"
                        width={96}
                        height={96}
                        className="rounded-full object-cover"
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/96x96/E2E8F0/A0AEC0?text=User'; }} // Заглушка, якщо фото не завантажилось
                    />
                </div>
                <h1 className="text-2xl font-bold">{fullName}</h1>
                {user.username && <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>}
            </div>

            {/* Баланс бонусів */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Gem size={20} />
                    <span className="font-semibold">Баланс бонусів</span>
                </div>
                <span className="text-xl font-bold">{user.bonus_balance}</span>
            </div>

            {/* Меню профілю */}
            <div className="space-y-3">
                <ProfileMenuItem icon={Download} text="Мої завантаження" onClick={() => router.push('/profile/downloads')} />
                <ProfileMenuItem icon={Heart} text="Обрані товари" onClick={() => router.push('/profile/favorites')} />
                <ProfileMenuItem icon={LogOut} text="Вийти" onClick={handleLogout} />
            </div>
        </div>
    );
}
