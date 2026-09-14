/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['img.youtube.com', 'k.kakaocdn.net', 'images.unsplash.com'],
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase.replace(/\/$/, '')}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
