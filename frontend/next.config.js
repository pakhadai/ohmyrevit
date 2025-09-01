/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'dev.ohmyrevit.pp.ua'],
  },
  // Додано для усунення попередження про Cross-origin
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  experimental: {
    // Дозволяємо доступ з вашого домену для розробки
    allowedDevOrigins: ["https://dev.ohmyrevit.pp.ua"],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig