/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qfeyhaaxyemmnohqdele.supabase.co',
        // cubre todos los objetos públicos (incluye property-images)
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Alternativa si preferís:
    // domains: ['qfeyhaaxyemmnohqdele.supabase.co'],
  },
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
  },
};

module.exports = nextConfig;
