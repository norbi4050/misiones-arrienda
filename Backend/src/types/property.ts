// Tipos unificados para propiedades - Sincronizado con Prisma Schema
export interface Property {
  id: string
  title: string
  description: string
  price: number
  currency: string
  oldPrice?: number
  bedrooms: number
  bathrooms: number
  garages: number
  area: number
  lotArea?: number
  address: string
  city: string
  province: string
  postalCode: string
  latitude?: number
  longitude?: number
  propertyType: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'LAND' | 'OFFICE' | 'WAREHOUSE' | 'PH' | 'STUDIO'
  status: 'AVAILABLE' | 'RENTED' | 'SOLD' | 'MAINTENANCE' | 'RESERVED' | 'EXPIRED'
  images: string[] // Array de URLs de imágenes
  virtualTourUrl?: string
  amenities: string[] // Array de amenidades
  features: string[] // Array de características
  yearBuilt?: number
  floor?: number
  totalFloors?: number
  featured: boolean
  
  // Campos de contacto
  contact_name?: string
  contact_phone: string
  contact_email?: string
  
  // Campos de sistema
  expiresAt?: Date
  highlightedUntil?: Date
  isPaid: boolean
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Relaciones
  userId: string
  agentId?: string
}

// Tipo para filtros de propiedades
export interface PropertyFilters {
  city?: string
  propertyType?: Property['propertyType']
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  minBathrooms?: number
  featured?: boolean
  status?: Property['status']
}

// Tipo para formulario de creación (sin campos de sistema)
export interface PropertyFormData {
  title: string
  description: string
  price: number
  currency: string
  propertyType: Property['propertyType']
  bedrooms: number
  bathrooms: number
  garages: number
  area: number
  lotArea?: number
  address: string
  city: string
  province: string
  postalCode: string
  latitude?: number
  longitude?: number
  images: string[]
  virtualTourUrl?: string
  amenities: string[]
  features: string[]
  yearBuilt?: number
  floor?: number
  totalFloors?: number
  contact_name?: string
  contact_phone: string
  contact_email?: string
  
  // Campos específicos del formulario
  mascotas?: boolean
  expensasIncl?: boolean
  servicios?: string[]
}

// Límites por plan
export interface PlanLimits {
  images: number
  featured: boolean
  highlighted: boolean
  duration: number // días
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  basic: {
    images: 3,
    featured: false,
    highlighted: false,
    duration: 30
  },
  featured: {
    images: 8,
    featured: true,
    highlighted: false,
    duration: 45
  },
  premium: {
    images: 20,
    featured: true,
    highlighted: true,
    duration: 60
  }
}
