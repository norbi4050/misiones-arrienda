/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage / CDN (ajustá si usás otro dominio)
      { protocol: 'https', hostname: '**.supabase.co' },
      // Si usás bancos de imágenes externos, dejalos:
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  }
}

module.exports = nextConfig
