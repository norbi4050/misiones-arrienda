/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimized for production - disable problematic CSS optimization
  experimental: {
    optimizeCss: false,
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Remove problematic env validation
  // env: {
  //   CUSTOM_KEY: process.env.CUSTOM_KEY,
  // },
  
  // Force all API routes to be dynamic to prevent static generation issues
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        has: [
          {
            type: 'header',
            key: 'x-force-dynamic',
            value: 'true',
          },
        ],
      },
    ];
  },
  
  // Headers for security and force dynamic rendering
  async headers() {
    return [
      {
        // Force all API routes to be dynamic
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'x-force-dynamic',
            value: 'true',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
