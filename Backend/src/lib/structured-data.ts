import { Property } from '@/types/property'

export interface PropertySchema {
  "@context": string
  "@type": string
  name: string
  description: string
  address: {
    "@type": string
    streetAddress: string
    addressLocality: string
    addressRegion: string
    addressCountry: string
    postalCode?: string
  }
  geo?: {
    "@type": string
    latitude?: number
    longitude?: number
  }
  offers: {
    "@type": string
    price: number
    priceCurrency: string
    availability: string
    priceValidUntil?: string
  }
  image: string[]
  floorSize: {
    "@type": string
    value: number
    unitCode: string
  }
  numberOfRooms?: number
  numberOfBathroomsTotal?: number
  petsAllowed?: boolean
  smokingAllowed?: boolean
  amenityFeature?: Array<{
    "@type": string
    name: string
  }>
}

export function generatePropertySchema(property: any): PropertySchema {
  // Parse images if they're stored as JSON string
  let images: string[] = []
  try {
    images = typeof property.images === 'string' 
      ? JSON.parse(property.images) 
      : property.images || []
  } catch {
    images = ['/images/properties/default-1.jpg']
  }

  // Parse amenities if they're stored as JSON string
  let amenities: string[] = []
  try {
    amenities = typeof property.amenities === 'string' 
      ? JSON.parse(property.amenities) 
      : property.amenities || []
  } catch {
    amenities = []
  }

  const schema: PropertySchema = {
    "@context": "https://schema.org",
    "@type": "RealEstate",
    name: property.title,
    description: property.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.province || "Misiones",
      addressCountry: "AR",
      ...(property.postalCode && { postalCode: property.postalCode })
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "ARS",
      availability: property.status === 'AVAILABLE' 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    image: images.map(img => 
      img.startsWith('http') ? img : `https://www.misionesarrienda.com.ar${img}`
    ),
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.area || 0,
      unitCode: "MTK"
    }
  }

  // Add optional fields
  if (property.latitude && property.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: property.latitude,
      longitude: property.longitude
    }
  }

  if (property.bedrooms) {
    schema.numberOfRooms = property.bedrooms
  }

  if (property.bathrooms) {
    schema.numberOfBathroomsTotal = property.bathrooms
  }

  // Add amenities as features
  if (amenities.length > 0) {
    schema.amenityFeature = amenities.map(amenity => ({
      "@type": "LocationFeatureSpecification",
      name: amenity
    }))
  }

  return schema
}

export interface OrganizationSchema {
  "@context": string
  "@type": string
  name: string
  url: string
  logo: string
  description: string
  address: {
    "@type": string
    addressLocality: string
    addressRegion: string
    addressCountry: string
  }
  contactPoint: {
    "@type": string
    telephone: string
    contactType: string
    availableLanguage: string
  }
  sameAs: string[]
  foundingDate: string
  areaServed: {
    "@type": string
    name: string
  }
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Misiones Arrienda",
    url: "https://www.misionesarrienda.com.ar",
    logo: "https://www.misionesarrienda.com.ar/logo.png",
    description: "La plataforma líder de alquiler de propiedades en Misiones, Argentina. Encuentra casas, departamentos y locales comerciales en Posadas, Oberá, Puerto Iguazú y más ciudades.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Posadas",
      addressRegion: "Misiones",
      addressCountry: "AR"
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+54-3764-123456",
      contactType: "customer service",
      availableLanguage: "Spanish"
    },
    sameAs: [
      "https://www.facebook.com/misionesarrienda",
      "https://www.instagram.com/misionesarrienda",
      "https://twitter.com/misionesarrienda"
    ],
    foundingDate: "2024",
    areaServed: {
      "@type": "State",
      name: "Misiones, Argentina"
    }
  }
}

export interface BreadcrumbSchema {
  "@context": string
  "@type": string
  itemListElement: Array<{
    "@type": string
    position: number
    name: string
    item: string
  }>
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://www.misionesarrienda.com.ar${item.url}`
    }))
  }
}

export interface WebSiteSchema {
  "@context": string
  "@type": string
  name: string
  url: string
  description: string
  potentialAction: {
    "@type": string
    target: {
      "@type": string
      urlTemplate: string
    }
    "query-input": string
  }
  publisher: {
    "@type": string
    name: string
  }
}

export function generateWebSiteSchema(): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Misiones Arrienda",
    url: "https://www.misionesarrienda.com.ar",
    description: "Encuentra las mejores propiedades en alquiler en Misiones, Argentina",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.misionesarrienda.com.ar/properties?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    publisher: {
      "@type": "Organization",
      name: "Misiones Arrienda"
    }
  }
}

// Utility function to inject structured data into pages
export function injectStructuredData(schema: any): string {
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
}

// City-specific schema generation
export interface CityPageSchema {
  "@context": string
  "@type": string
  name: string
  description: string
  containedInPlace: {
    "@type": string
    name: string
  }
  geo?: {
    "@type": string
    latitude: number
    longitude: number
  }
}

export function generateCityPageSchema(cityName: string, description: string, coordinates?: { lat: number; lng: number }): CityPageSchema {
  const schema: CityPageSchema = {
    "@context": "https://schema.org",
    "@type": "City",
    name: cityName,
    description: description,
    containedInPlace: {
      "@type": "State",
      name: "Misiones, Argentina"
    }
  }

  if (coordinates) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: coordinates.lat,
      longitude: coordinates.lng
    }
  }

  return schema
}
