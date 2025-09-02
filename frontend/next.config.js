/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'dev.ohmyrevit.pp.ua', 'avatar.vercel.sh'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://dev.ohmyrevit.pp.ua/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig