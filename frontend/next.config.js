/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // === ВИРІШЕННЯ ПРОБЛЕМИ: Використовуємо новий формат remotePatterns ===
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dev.ohmyrevit.pp.ua',
        port: '',
        pathname: '/uploads/**', // Дозволяємо всі шляхи в папці uploads
      },
       {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000', // Вказуємо порт бекенду для локальної розробки
        pathname: '/uploads/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig