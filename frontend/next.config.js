// frontend/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // <-- ДОДАЙТЕ ЦЕЙ РЯДОК
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dev.ohmyrevit.pp.ua',
        port: '',
        pathname: '/uploads/**',
      },
       {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
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