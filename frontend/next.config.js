/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
  // ОПТИМІЗАЦІЯ: Видалено headers з no-cache.
  // Next.js сам чудово керує кешуванням статики.
  devIndicators: {
    allowedDevOrigins: [
      'https://dev.ohmyrevit.pp.ua',
    ],
  },
}

module.exports = nextConfig