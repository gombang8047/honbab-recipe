/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['img.youtube.com', 'k.kakaocdn.net', 'images.unsplash.com'],
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    const defaultUrl = isDev
      ? 'http://localhost:8080'
      : 'https://port-0-honbab-recipe-mu0tt8j1c0c836b2.sel3.cloudtype.app';
    const apiBase = process.env.NEXT_PUBLIC_API_URL || defaultUrl;

    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase.replace(/\/$/, '')}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
