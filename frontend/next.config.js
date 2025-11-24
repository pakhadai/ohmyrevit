
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
let backendHostname = 'localhost';
let backendProtocol = 'http';

try {
  const url = new URL(backendUrl);
  backendHostname = url.hostname;
  backendProtocol = url.protocol.replace(':', '');
} catch (e) {
  console.error('Failed to parse NEXT_PUBLIC_BACKEND_URL');
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: backendProtocol,
        hostname: backendHostname,
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
  devIndicators: {
    buildActivity: false,
  }
}

module.exports = nextConfig