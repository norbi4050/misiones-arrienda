import type { Property } from '@/types/property'

/**
 * Generar JSON-LD structured data para propiedades
 */
export function generatePropertyJsonLd(property: Property, baseUrl: string) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateProperty",
    "name": property.title,
    "description": property.description,
    "url": `${baseUrl}/properties/${property.id}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.city,
      "addressRegion": property.province,
      "addressCountry": property.country
    },
    "geo": property.latitude && property.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": property.latitude,
      "longitude": property.longitude
    } : undefined,
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": property.area,
      "unitCode": "MTK"
    },
    "numberOfRooms": property.bedrooms,
    "numberOfBathroomsTotal": property.bathrooms,
    "petsAllowed": property.amenities.includes('pets'),
    "smokingAllowed": property.amenities.includes('smoking'),
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "ARS",
      "availability": property.status === 'AVAILABLE' ? "InStock" : "OutOfStock",
      "validFrom": property.createdAt.toISOString(),
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": property.price,
        "priceCurrency": "ARS",
        "unitText": "MONTH"
      }
    },
    "amenityFeature": property.amenities.map(amenity => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity
    })),
    "image": property.images?.map(img => ({
      "@type": "ImageObject",
      "url": img,
      "caption": property.title
    })) || [],
    "datePosted": property.createdAt.toISOString(),
    "dateModified": property.updatedAt.toISOString(),
    "landlord": {
      "@type": "Person",
      "name": property.agent?.name || "Propietario"
    }
  }

  // Remover campos undefined
  return JSON.parse(JSON.stringify(jsonLd))
}

/**
 * Generar OpenGraph meta tags para propiedades
 */
export function generatePropertyOpenGraph(property: Property, baseUrl: string) {
  const coverImage = property.images?.[0] || `${baseUrl}/placeholder-apartment-1.jpg`
  
  return {
    title: `${property.title} - ${property.city}`,
    description: property.description?.substring(0, 160) || `Propiedad en ${property.city}, ${property.province}. ${property.bedrooms} dormitorios, ${property.bathrooms} baños.`,
    url: `${baseUrl}/properties/${property.id}`,
    siteName: 'Misiones Arrienda',
    images: [
      {
        url: coverImage,
        width: 1200,
        height: 630,
        alt: property.title,
      }
    ],
    locale: 'es_AR',
    type: 'website',
  }
}

/**
 * Generar Twitter Card meta tags
 */
export function generatePropertyTwitterCard(property: Property, baseUrl: string) {
  const coverImage = property.images?.[0] || `${baseUrl}/placeholder-apartment-1.jpg`
  
  return {
    card: 'summary_large_image',
    title: `${property.title} - ${property.city}`,
    description: property.description?.substring(0, 200) || `Propiedad en ${property.city}. ${property.bedrooms} dormitorios, ${property.bathrooms} baños. $${property.price}/mes`,
    image: coverImage,
    site: '@MisionesArrienda'
  }
}

/**
 * Generar meta tags completos para una propiedad
 */
export function generatePropertyMetaTags(property: Property, baseUrl: string) {
  const openGraph = generatePropertyOpenGraph(property, baseUrl)
  const twitterCard = generatePropertyTwitterCard(property, baseUrl)
  
  return {
    title: openGraph.title,
    description: openGraph.description,
    keywords: [
      'alquiler',
      'propiedad',
      property.city,
      property.province,
      property.propertyType,
      'Misiones',
      'Argentina'
    ].join(', '),
    openGraph,
    twitter: twitterCard,
    robots: {
      index: property.status === 'AVAILABLE',
      follow: true,
      googleBot: {
        index: property.status === 'AVAILABLE',
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `${baseUrl}/properties/${property.id}`,
    }
  }
}

/**
 * Generar breadcrumb JSON-LD
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }
}

/**
 * Generar Organization JSON-LD para el sitio
 */
export function generateOrganizationJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Misiones Arrienda",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Plataforma de alquiler de propiedades en Misiones, Argentina",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Misiones",
      "addressCountry": "AR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "Spanish"
    },
    "sameAs": [
      "https://facebook.com/misionesarrienda",
      "https://instagram.com/misionesarrienda"
    ]
  }
}

/**
 * Utility para insertar JSON-LD en el head
 */
export function createJsonLdScript(data: object) {
  return {
    __html: JSON.stringify(data)
  }
}
