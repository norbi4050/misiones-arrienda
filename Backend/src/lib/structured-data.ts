import type { Property } from '@/types/property'

/**
 * Generar JSON-LD structured data para propiedades (completo)
 */
export function generatePropertyJsonLd(property: any, baseUrl: string, images: string[] = []) {
  // Determinar tipo específico de propiedad
  const getSchemaType = (propertyType: string) => {
    switch (propertyType?.toUpperCase()) {
      case 'APARTMENT':
      case 'STUDIO':
        return 'Apartment'
      case 'HOUSE':
        return 'SingleFamilyResidence'
      case 'COMMERCIAL':
      case 'OFFICE':
        return 'CommercialProperty'
      default:
        return 'RealEstateProperty'
    }
  }

  // Parsear amenities si es string
  const amenities = typeof property.amenities === 'string' 
    ? JSON.parse(property.amenities || '[]') 
    : property.amenities || []

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": getSchemaType(property.property_type || property.propertyType),
    "name": property.title,
    "description": property.description,
    "url": `${baseUrl}/properties/${property.id}`,
    "identifier": property.id,
    
    // Dirección completa
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.address,
      "addressLocality": property.city,
      "addressRegion": "Misiones",
      "addressCountry": "AR",
      "postalCode": property.postal_code || undefined
    },
    
    // Coordenadas geográficas
    "geo": property.latitude && property.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": parseFloat(property.latitude),
      "longitude": parseFloat(property.longitude)
    } : undefined,
    
    // Características físicas
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": property.area,
      "unitCode": "MTK"
    },
    "numberOfRooms": property.bedrooms,
    "numberOfBathroomsTotal": property.bathrooms,
    "numberOfBedrooms": property.bedrooms,
    
    // Información de construcción
    "yearBuilt": property.year_built || property.yearBuilt || undefined,
    "floorLevel": property.floor || undefined,
    "numberOfFloors": property.total_floors || property.totalFloors || undefined,
    
    // Terreno (si aplica)
    "lotSize": property.lot_area || property.lotArea ? {
      "@type": "QuantitativeValue", 
      "value": property.lot_area || property.lotArea,
      "unitCode": "MTK"
    } : undefined,
    
    // Políticas
    "petsAllowed": amenities.includes('pets') || amenities.includes('mascotas'),
    "smokingAllowed": amenities.includes('smoking') || amenities.includes('fumadores'),
    
    // Oferta comercial
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": property.currency || "ARS",
      "availability": property.status === 'PUBLISHED' || property.status === 'AVAILABLE' ? "InStock" : "OutOfStock",
      "validFrom": property.created_at || property.createdAt,
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": property.price,
        "priceCurrency": property.currency || "ARS",
        "unitText": "MONTH"
      },
      "seller": {
        "@type": "Person",
        "name": property.agent?.full_name || property.agent?.name || "Propietario",
        "email": property.agent?.email || undefined,
        "telephone": property.agent?.phone || undefined,
        "image": property.agent?.photos?.[0] || property.agent?.avatar_url || undefined
      }
    },
    
    // Características y amenities
    "amenityFeature": amenities.map((amenity: string) => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity,
      "value": true
    })),
    
    // Imágenes (usar las reales del bucket)
    "image": images.length > 0 ? images.map((img, index) => ({
      "@type": "ImageObject",
      "url": img,
      "caption": `${property.title} - Imagen ${index + 1}`,
      "width": 1200,
      "height": 800
    })) : [{
      "@type": "ImageObject",
      "url": `${baseUrl}/placeholder-apartment-1.jpg`,
      "caption": property.title
    }],
    
    // Fechas
    "datePosted": property.created_at || property.createdAt,
    "dateModified": property.updated_at || property.updatedAt,
    
    // Propietario/Agente
    "landlord": {
      "@type": "Person",
      "name": property.agent?.full_name || property.agent?.name || "Propietario",
      "email": property.agent?.email || undefined,
      "telephone": property.agent?.phone || undefined,
      "image": property.agent?.photos?.[0] || property.agent?.avatar_url || undefined,
      "url": property.agent?.id ? `${baseUrl}/profile/${property.agent.id}` : undefined
    },
    
    // Información adicional
    "category": property.property_type || property.propertyType,
    "keywords": [
      property.city,
      "Misiones",
      "alquiler",
      property.property_type || property.propertyType,
      `${property.bedrooms} dormitorios`,
      `${property.bathrooms} baños`
    ].join(', ')
  }

  // Remover campos undefined
  return JSON.parse(JSON.stringify(jsonLd))
}

/**
 * Generar OpenGraph meta tags para propiedades (dinámico con bucket images)
 */
export function generatePropertyOpenGraph(property: any, baseUrl: string, images: string[] = []) {
  const coverImage = images[0] || `${baseUrl}/placeholder-apartment-1.jpg`
  const price = property.price ? `$${property.price.toLocaleString()} ARS` : ''
  const neighborhood = property.neighborhood || property.city
  
  // Descripción rica con precio y ubicación
  const richDescription = property.description?.substring(0, 120) || 
    `${price} • ${neighborhood}, ${property.city}. ${property.bedrooms} dormitorios, ${property.bathrooms} baños. ${property.area}m².`
  
  return {
    title: `${property.title} - ${property.city}`,
    description: richDescription,
    url: `${baseUrl}/properties/${property.id}`,
    siteName: 'Misiones Arrienda',
    images: [
      {
        url: coverImage,
        width: 1200,
        height: 630,
        alt: property.title,
        type: 'image/jpeg'
      },
      // Imágenes adicionales para carrusel en redes sociales
      ...images.slice(1, 4).map(img => ({
        url: img,
        width: 1200,
        height: 630,
        alt: `${property.title} - Vista adicional`,
        type: 'image/jpeg'
      }))
    ],
    locale: 'es_AR',
    type: 'website',
  }
}

/**
 * Generar Twitter Card meta tags (específico para propiedades)
 */
export function generatePropertyTwitterCard(property: any, baseUrl: string, images: string[] = []) {
  const coverImage = images[0] || `${baseUrl}/placeholder-apartment-1.jpg`
  const price = property.price ? `$${property.price.toLocaleString()}` : ''
  
  return {
    card: 'summary_large_image',
    title: `${property.title} - ${property.city}`,
    description: `${price} ARS/mes • ${property.city}, Misiones. ${property.bedrooms} dorm, ${property.bathrooms} baños, ${property.area}m².`,
    image: coverImage,
    site: '@MisionesArrienda',
    creator: property.agent?.full_name ? `@${property.agent.full_name.replace(/\s+/g, '')}` : '@MisionesArrienda'
  }
}

/**
 * Generar meta tags completos para una propiedad (con imágenes reales)
 */
export function generatePropertyMetaTags(property: any, baseUrl: string, images: string[] = []) {
  const openGraph = generatePropertyOpenGraph(property, baseUrl, images)
  const twitterCard = generatePropertyTwitterCard(property, baseUrl, images)
  
  return {
    title: openGraph.title,
    description: openGraph.description,
    keywords: [
      'alquiler',
      'propiedad',
      property.city,
      property.province || 'Misiones',
      property.property_type || property.propertyType,
      property.neighborhood,
      'Misiones',
      'Argentina',
      `${property.bedrooms} dormitorios`,
      `${property.bathrooms} baños`,
      `${property.area}m2`
    ].filter(Boolean).join(', '),
    openGraph,
    twitter: twitterCard,
    robots: {
      index: property.status === 'PUBLISHED' || property.status === 'AVAILABLE',
      follow: true,
      googleBot: {
        index: property.status === 'PUBLISHED' || property.status === 'AVAILABLE',
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `${baseUrl}/properties/${property.id}`,
    },
    other: {
      'property:price': property.price?.toString(),
      'property:currency': property.currency || 'ARS',
      'property:bedrooms': property.bedrooms?.toString(),
      'property:bathrooms': property.bathrooms?.toString(),
      'property:area': property.area?.toString(),
      'property:type': property.property_type || property.propertyType,
      'property:city': property.city,
      'property:province': property.province || 'Misiones'
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
