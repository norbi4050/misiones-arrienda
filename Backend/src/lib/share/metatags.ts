// =====================================================
// B5 - METATAGS HELPER
// Genera metatags optimizados para compartir en redes
// =====================================================

import type { Metadata } from 'next';
import { getPropertyCanonicalUrl, getAgencyCanonicalUrl } from './canonical';
import { sanitizeShareText, normalizeShareDescription } from './index';

/**
 * Genera metatags completos para una propiedad (B5 enhanced)
 */
export async function generatePropertyShareMetaTags(
  property: any,
  baseUrl: string,
  images: string[] = []
): Promise<Metadata> {
  // Obtener URL canónica con cache
  const canonicalUrl = await getPropertyCanonicalUrl(property.id);
  
  // OG Image desde endpoint B5
  const ogImageUrl = `${baseUrl}/api/og/property?id=${property.id}`;
  
  // Sanitizar textos
  const title = sanitizeShareText(property.title);
  const description = normalizeShareDescription(
    property.description || 
    `${property.price} ARS/mes • ${property.city}, Misiones. ${property.bedrooms} dorm, ${property.bathrooms} baños, ${property.area}m².`
  );

  // Determinar si debe indexarse
  const shouldIndex = property.status === 'PUBLISHED' || property.status === 'AVAILABLE';

  return {
    title: `${title} - ${property.city} | Misiones Arrienda`,
    description,
    
    // Open Graph
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Misiones Arrienda',
      locale: 'es_AR',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
        // Imágenes reales como fallback
        ...images.slice(0, 3).map(img => ({
          url: img,
          width: 1200,
          height: 800,
          alt: `${title} - Vista adicional`,
        })),
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      site: '@MisionesArrienda',
    },

    // Robots
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
      googleBot: {
        index: shouldIndex,
        follow: shouldIndex,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Canonical
    alternates: {
      canonical: canonicalUrl,
    },

    // Metadata adicional
    other: {
      'property:price': property.price?.toString(),
      'property:currency': property.currency || 'ARS',
      'property:bedrooms': property.bedrooms?.toString(),
      'property:bathrooms': property.bathrooms?.toString(),
      'property:area': property.area?.toString(),
      'property:type': property.property_type,
      'property:city': property.city,
    },
  };
}

/**
 * Genera metatags completos para una inmobiliaria (B5)
 */
export async function generateAgencyShareMetaTags(
  agency: any,
  baseUrl: string,
  propertiesCount: number = 0
): Promise<Metadata> {
  // Obtener URL canónica con cache
  const canonicalUrl = await getAgencyCanonicalUrl(agency.id);
  
  // OG Image desde endpoint B5
  const ogImageUrl = `${baseUrl}/api/og/agency?id=${agency.id}`;
  
  // Sanitizar textos
  const title = sanitizeShareText(agency.company_name);
  const description = normalizeShareDescription(
    agency.description || 
    `Inmobiliaria en ${agency.city}, ${agency.province}. ${propertiesCount} propiedades disponibles.`
  );

  return {
    title: `${title} - Inmobiliaria en ${agency.city} | Misiones Arrienda`,
    description,
    
    // Open Graph
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Misiones Arrienda',
      locale: 'es_AR',
      type: 'profile',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      site: '@MisionesArrienda',
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Canonical
    alternates: {
      canonical: canonicalUrl,
    },

    // Metadata adicional
    other: {
      'agency:name': agency.company_name,
      'agency:city': agency.city,
      'agency:province': agency.province,
      'agency:verified': agency.verified?.toString(),
      'agency:properties_count': propertiesCount.toString(),
    },
  };
}

/**
 * Wrapper para compatibilidad con código existente
 * Extiende generatePropertyMetaTags de structured-data.ts con B5
 */
export async function enhancePropertyMetaTags(
  property: any,
  baseUrl: string,
  images: string[] = []
): Promise<Metadata> {
  return generatePropertyShareMetaTags(property, baseUrl, images);
}

export default {
  generatePropertyShareMetaTags,
  generateAgencyShareMetaTags,
  enhancePropertyMetaTags,
};
