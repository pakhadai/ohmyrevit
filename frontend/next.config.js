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
        destination: 'http://backend:8000/api/:path*', // Перенаправлення на бекенд-контейнер
      },
    ];
  },
}

module.exports = nextConfig