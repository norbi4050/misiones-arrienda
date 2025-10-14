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
  country: string // Campo faltante agregado
  postalCode: string
  latitude?: number
  longitude?: number
  propertyType: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'LAND' | 'OFFICE' | 'WAREHOUSE' | 'PH' | 'STUDIO'
  status: 'AVAILABLE' | 'RENTED' | 'SOLD' | 'MAINTENANCE' | 'RESERVED' | 'EXPIRED'
  operationType: 'alquiler' | 'venta' | 'ambos' // Tipo de operación en español
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
  agent?: {
    id: string
    name: string
    email: string
    phone?: string
    rating?: number
  }
  
  // FASE 6: Owner info (para links a perfil de inmobiliarias)
  owner_id?: string
  owner_type?: string
  owner_company_name?: string
}

// Tipos exportados individuales
export type PropertyType = Property['propertyType']
export type PropertyStatus = Property['status']
export type OperationType = Property['operationType']

// Tipo para filtros de propiedades
export interface PropertyFilters {
  city?: string
  province?: string
  propertyType?: Property['propertyType']
  operationType?: OperationType // Filtro por tipo de operación
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  maxBedrooms?: number
  minBathrooms?: number
  featured?: boolean
  status?: Property['status']
}

// Tipo para datos de consulta/inquiry
export interface InquiryData {
  propertyId: string
  name: string
  email: string
  phone?: string
  message: string
  type?: 'GENERAL' | 'VISIT' | 'INFO' | 'BUY' | 'RENT'
  interestedIn?: 'BUY' | 'RENT' | 'INFO'
}

// Tipo para formulario de creación (sincronizado con propertySchema)
export interface PropertyFormData {
  // Campos básicos requeridos
  title: string
  description: string
  price: number
  currency: string
  oldPrice?: number
  
  // Tipo de propiedad
  propertyType: Property['propertyType']
  
  // Tipo de operación
  operationType: OperationType
  
  // Características
  bedrooms: number
  bathrooms: number
  garages: number
  area: number
  lotArea?: number
  
  // Ubicación
  address: string
  city: string
  province: string
  country: string
  postalCode: string
  latitude?: number
  longitude?: number
  
  // Contacto
  contact_name?: string
  contact_phone: string
  contact_email?: string
  
  // Multimedia
  images: string[]
  virtualTourUrl?: string
  
  // Características adicionales
  amenities: string[]
  features: string[]
  yearBuilt?: number
  floor?: number
  totalFloors?: number
  
  // Estado
  status: Property['status']
  featured: boolean
  
  // Campos específicos del formulario
  mascotas?: boolean
  expensasIncl?: boolean
  servicios?: string[]
  
  // Campos de sistema opcionales
  expiresAt?: Date
  highlightedUntil?: Date
  isPaid?: boolean
  userId?: string
  agentId?: string
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
