/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurar el directorio raíz para evitar warning de múltiples lockfiles
  outputFileTracingRoot: __dirname,
  
  // Deshabilitar file tracing para evitar problemas de readlink en Windows
  output: 'standalone',
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qfeyhaaxyemmnohqdele.supabase.co',
        // cubre todos los objetos públicos (incluye property-images)
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        // permite imágenes de Unsplash para datos de prueba
        pathname: '/**',
      },
    ],
    // Alternativa si preferís:
    // domains: ['qfeyhaaxyemmnohqdele.supabase.co', 'images.unsplash.com'],
  },
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
  },
  
  // Configuración específica para Windows y problemas de enlaces simbólicos
  webpack: (config, { isServer }) => {
    // Evitar problemas con enlaces simbólicos en Windows
    config.resolve.symlinks = false;
    
    return config;
  },
};

module.exports = nextConfig;
