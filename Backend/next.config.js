/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude dynamic pages from static generation
  experimental: {
    missingSuspenseWithCSRBailout: false,
    // PERF: Optimiza imports de paquetes pesados para reducir bundle size
    optimizePackageImports: ['lucide-react', 'date-fns', 'lodash', '@headlessui/react'],
  },
  // PERF: Compression
  compress: true,
  // PERF: Power by header removal
  poweredByHeader: false,
  // PERF: Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'qfeyhaaxyemmnohqdele.supabase.co',
        pathname: '/storage/v1/object/public/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'qfeyhaaxyemmnohqdele.supabase.co',
        pathname: '/storage/v1/object/public/property-images/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  }
}

module.exports = nextConfig
