// =====================================================
// TIPOS PARA SISTEMA DE ROOMMATES - 2025
// =====================================================
// Tipos unificados para roommate posts - Sincronizado con Schema DB

export interface RoommatePost {
  id: string
  title: string
  description: string
  city: string
  province: string
  roomType: 'PRIVATE' | 'SHARED'
  monthlyRent: number
  availableFrom: Date
  preferences?: string
  images: string[] // Array de URLs de imágenes
  imagesUrls: string[] // Array de keys de storage
  status: 'DRAFT' | 'PUBLISHED'
  isActive: boolean
  likesCount: number
  viewsCount: number
  slug?: string
  
  // Campos de sistema
  userId: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  
  // Campos calculados
  coverUrl?: string | null
  isPlaceholder?: boolean
  imagesCount?: number
}

// Tipos exportados individuales
export type RoomType = RoommatePost['roomType']
export type RoommateStatus = RoommatePost['status']

// Tipo para filtros de roommates
export interface RoommateFilters {
  q?: string // Búsqueda de texto
  city?: string
  province?: string
  roomType?: RoomType
  minRent?: number
  maxRent?: number
  availableFrom?: string // ISO date string
  order?: 'recent' | 'trending'
  page?: number
  limit?: number
}

// Tipo para formulario de creación/edición
export interface RoommateFormData {
  // Campos básicos requeridos
  title: string
  description: string
  city: string
  province: string
  roomType: RoomType
  monthlyRent: number
  availableFrom: string // ISO date string para formularios
  
  // Campos opcionales
  preferences?: string
  images: string[] // URLs para preview
  imagesUrls: string[] // Keys de storage
  
  // Estado
  status?: RoommateStatus
}

// Tipo para respuesta de API con metadatos
export interface RoommateApiResponse {
  items: RoommatePost[]
  count: number
  meta: {
    dataSource: 'db'
    requestId?: string
    filters: RoommateFilters
    sorting: {
      orderBy: string
      order: 'asc' | 'desc'
    }
    pagination: {
      page: number
      pageSize: number
      offset: number
      totalPages: number
    }
    error?: boolean
    message?: string
  }
}

// Tipo para detalle de roommate (dual-mode)
export interface RoommateDetail extends RoommatePost {
  // Campos adicionales para vista detalle
  author?: {
    id: string
    name?: string
    avatar?: string
  }
  
  // Campos de interacción
  isLiked?: boolean
  canEdit?: boolean
  canPublish?: boolean
  
  // Metadatos de imágenes
  coverUrl?: string | null
  coverUrlExpiresAt?: string
  isPlaceholder?: boolean
}

// Tipo para likes de roommates
export interface RoommateLike {
  id: string
  userId: string
  roommatePostId: string
  createdAt: Date
}

// Tipo para reportes de roommates
export interface RoommateReport {
  id: string
  userId: string
  roommatePostId: string
  reason: 'SPAM' | 'INAPPROPRIATE' | 'FAKE' | 'OTHER'
  description?: string
  createdAt: Date
}

// Tipo para acciones de roommate
export interface RoommateActions {
  like: (id: string) => Promise<void>
  unlike: (id: string) => Promise<void>
  report: (id: string, reason: RoommateReport['reason'], description?: string) => Promise<void>
  share: (id: string) => Promise<void>
  contact: (id: string) => Promise<void>
}

// Tipo para estadísticas de roommate
export interface RoommateStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalViews: number
  totalLikes: number
  averageRent: number
}

// Tipo para validación de publish-ready
export interface RoommatePublishValidation {
  isReady: boolean
  missingFields: string[]
  warnings: string[]
}

// Constantes para validación
export const ROOMMATE_CONSTANTS = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 140,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 2000,
  PREFERENCES_MAX_LENGTH: 1000,
  MIN_RENT: 0,
  MAX_RENT: 999999,
  MAX_IMAGES: 10,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
} as const

// Tipo para configuración de bucket
export interface RoommateImageConfig {
  bucket: 'roommate-images'
  maxImages: number
  maxFileSize: number
  allowedTypes: string[]
  structure: string // '<user_id>/<post_id>/<filename>'
}

// Tipo para signed URLs de roommates
export interface RoommateSignedUrl {
  url: string
  expiresAt: string
  key: string
}

// Tipo para errores de signed URLs
export interface RoommateSignedUrlError {
  error: string
  key: string
}

// Tipo para respuesta de upload de imágenes
export interface RoommateImageUploadResponse {
  success: boolean
  key?: string
  url?: string
  error?: string
}

// Tipo para batch de signed URLs
export interface RoommateSignedUrlBatch {
  success: RoommateSignedUrl[]
  errors: RoommateSignedUrlError[]
}

// Tipo para slug generation
export interface RoommateSlugData {
  title: string
  id: string
  slug: string
  isUnique: boolean
}

// Helpers de tipo para transformaciones
export type RoommatePostDB = Omit<RoommatePost, 'roomType' | 'monthlyRent' | 'availableFrom' | 'likesCount' | 'viewsCount' | 'isActive' | 'userId' | 'createdAt' | 'updatedAt' | 'publishedAt'> & {
  room_type: string
  monthly_rent: number
  available_from: string
  likes_count: number
  views_count: number
  is_active: boolean
  user_id: string
  created_at: string
  updated_at: string
  published_at?: string
}

// Función helper para transformar DB a frontend
export function transformRoommateFromDB(dbPost: RoommatePostDB): RoommatePost {
  return {
    id: dbPost.id,
    title: dbPost.title,
    description: dbPost.description,
    city: dbPost.city,
    province: dbPost.province,
    roomType: dbPost.room_type as RoomType,
    monthlyRent: dbPost.monthly_rent,
    availableFrom: new Date(dbPost.available_from),
    preferences: dbPost.preferences,
    images: dbPost.images,
    imagesUrls: dbPost.imagesUrls,
    status: dbPost.status as RoommateStatus,
    isActive: dbPost.is_active,
    likesCount: dbPost.likes_count,
    viewsCount: dbPost.views_count,
    slug: dbPost.slug,
    userId: dbPost.user_id,
    createdAt: new Date(dbPost.created_at),
    updatedAt: new Date(dbPost.updated_at),
    publishedAt: dbPost.published_at ? new Date(dbPost.published_at) : undefined,
  }
}

// Función helper para transformar frontend a DB
export function transformRoommateToDB(post: Partial<RoommatePost>): Partial<RoommatePostDB> {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    city: post.city,
    province: post.province,
    room_type: post.roomType,
    monthly_rent: post.monthlyRent,
    available_from: post.availableFrom?.toISOString(),
    preferences: post.preferences,
    images: post.images,
    imagesUrls: post.imagesUrls,
    status: post.status,
    is_active: post.isActive,
    likes_count: post.likesCount,
    views_count: post.viewsCount,
    slug: post.slug,
    user_id: post.userId,
    created_at: post.createdAt?.toISOString(),
    updated_at: post.updatedAt?.toISOString(),
    published_at: post.publishedAt?.toISOString(),
  }
}

// Tipo para contexto de roommates
export interface RoommateContextType {
  roommates: RoommatePost[]
  loading: boolean
  error: string | null
  filters: RoommateFilters
  setFilters: (filters: RoommateFilters) => void
  refreshRoommates: () => Promise<void>
  createRoommate: (data: RoommateFormData) => Promise<RoommatePost>
  updateRoommate: (id: string, data: Partial<RoommateFormData>) => Promise<RoommatePost>
  deleteRoommate: (id: string) => Promise<void>
  publishRoommate: (id: string) => Promise<void>
  unpublishRoommate: (id: string) => Promise<void>
}

// Exportar constantes y funciones como default para compatibilidad
export default {
  ROOMMATE_CONSTANTS,
  transformRoommateFromDB,
  transformRoommateToDB,
}
