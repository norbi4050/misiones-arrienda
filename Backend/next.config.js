/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Static export configuration for Netlify
  output: 'export',
  trailingSlash: true,
  
  // Optimized for production - disable problematic CSS optimization
  experimental: {
    optimizeCss: false,
  },
  
  // Image optimization for static export
  images: {
    unoptimized: true,
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Remove problematic env validation
  // env: {
  //   CUSTOM_KEY: process.env.CUSTOM_KEY,
  // },
  
  // Headers for security (disabled for static export)
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'X-Frame-Options',
  //           value: 'DENY',
  //         },
  //         {
  //           key: 'X-Content-Type-Options',
  //           value: 'nosniff',
  //         },
  //         {
  //           key: 'Referrer-Policy',
  //           value: 'origin-when-cross-origin',
  //         },
  //       ],
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
