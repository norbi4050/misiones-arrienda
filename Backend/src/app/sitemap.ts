import { MetadataRoute } from 'next'
import { getProperties } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://misionesarrienda.com.ar'
  
  // Páginas estáticas principales (solo core, excluir desarrollo/debug)
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/roommates`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/comunidad`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    // Páginas de ciudades
    {
      url: `${baseUrl}/posadas`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/obera`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/puerto-iguazu`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/eldorado`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    // Páginas de autenticación
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    // Páginas legales
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ]

  // Obtener todas las propiedades para generar URLs dinámicas
  let propertyPages: MetadataRoute.Sitemap = []
  
  try {
    const response = await getProperties({ limit: 1000 }) // Obtener todas las propiedades
    
    propertyPages = response.properties.map((property) => ({
      url: `${baseUrl}/properties/${property.id}`,
      lastModified: new Date(property.updatedAt || property.createdAt || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Error generating sitemap for properties:', error)
  }

  // EXCLUIR rutas de desarrollo/debug (alineado con robots.ts)
  // NO incluir en sitemap:
  // - /api/* (todas las APIs)
  // - /dashboard/* (páginas privadas)
  // - /admin/* (páginas de administración)
  // - /test-simple*, /page-debug*, /page-simple*, /page-temp-fix*
  // - /layout-debug*, /layout-minimal*, /layout-temp*
  // - /comunidad/page-simple*, /comunidad/page-new*, /comunidad/page-enterprise*
  // - /docs/evidencias/*, /__tests__/*, /scripts/*

  return [...staticPages, ...propertyPages]
}
