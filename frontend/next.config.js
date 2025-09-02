/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'dev.ohmyrevit.pp.ua'],
  },
  experimental: {
    // ВИПРАВЛЕНО: Додаємо дозвіл для вашого домену розробки
    allowedDevOrigins: ["https://dev.ohmyrevit.pp.ua"],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // ВИПРАВЛЕНО: Змінено на https та зовнішню адресу
        destination: 'https://dev.ohmyrevit.pp.ua/api/:path*', // Перенаправлення на бекенд
      },
    ];
  },
}

module.exports = nextConfig