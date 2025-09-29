// ============================================================================
// PROPERTY IMAGES - Utilidades genéricas para manejo de imágenes
// Compatible con imports named y default
// ============================================================================

import { createClient } from '@/lib/supabase/server'

export type PropertyImage = { url: string; alt?: string }

/**
 * Resolver URL de imagen de propiedad
 */
export function resolvePropertyImage(path?: string): string {
  if (!path) return '/placeholder-apartment-1.jpg'
  // Si ya viene URL absoluta, devolver tal cual
  if (/^https?:\/\//i.test(path)) return path
  // Si es ruta relativa al storage/CDN, ajustar si es necesario
  return path
}

/**
 * Normalizar lista de imágenes a formato estándar
 */
export function normalizeImages(list?: Array<string | PropertyImage>): PropertyImage[] {
  if (!list || !Array.isArray(list)) return []
  return list.map((it) =>
    typeof it === 'string' 
      ? { url: resolvePropertyImage(it) } 
      : { url: resolvePropertyImage(it.url), alt: it.alt }
  )
}

/**
 * API común para carouseles - formato compatible con ImageCarousel
 */
export function getCarouselImages(list?: Array<string | PropertyImage>): { src: string; alt: string }[] {
  return normalizeImages(list).map((i, idx) => ({ 
    src: i.url, 
    alt: i.alt ?? `Imagen ${idx + 1}` 
  }))
}

/**
 * Obtener imagen principal (cover) de una propiedad
 */
export function getCoverImage(images?: Array<string | PropertyImage>): string {
  const normalized = normalizeImages(images)
  return normalized[0]?.url || '/placeholder-apartment-1.jpg'
}

/**
 * Validar si una URL es una imagen válida
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false
  const imageExtensions = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i
  return imageExtensions.test(url) || url.includes('ui-avatars.com')
}

/**
 * Generar placeholder para imagen faltante
 */
export function generatePlaceholder(title?: string, index: number = 1): string {
  if (!title) return `/placeholder-apartment-${index}.jpg`
  
  // Usar ui-avatars para generar placeholder dinámico
  const encodedTitle = encodeURIComponent(title.substring(0, 20))
  return `https://ui-avatars.com/api/?name=${encodedTitle}&background=E5E7EB&color=6B7280&size=400&format=png`
}

/**
 * Aplicar cache-busting con properties.updated_at
 */
export function withPropertyVersion(url: string, updatedAt: string): string {
  if (!url || !updatedAt) return url
  
  const v = Math.floor(new Date(updatedAt).getTime() / 1000)
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${v}`
}

/**
 * Obtener imágenes de propiedad desde bucket (server-side)
 * Implementa patrón bucket-first con fallback
 */
export async function getPropertyImages({
  userId,
  propertyId,
  fallbackImages = [],
  maxImages = 10
}: {
  userId: string
  propertyId: string
  fallbackImages?: string[]
  maxImages?: number
}): Promise<string[]> {
  try {
    const supabase = createClient()
    
    // 1. Obtener updated_at de la propiedad para cache-busting
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .select('updated_at')
      .eq('id', propertyId)
      .maybeSingle()

    if (propErr) {
      console.error('Error fetching property for cache-busting:', propErr)
      return fallbackImages.slice(0, maxImages)
    }

    // 2. Listar archivos del bucket
    const { data: files, error: listErr } = await supabase
      .storage
      .from('property-images')
      .list(`${userId}/${propertyId}`, {
        limit: maxImages,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listErr || !files || files.length === 0) {
      // Fallback a imágenes del JSON
      return fallbackImages.slice(0, maxImages)
    }

    // 3. Generar URLs públicas con cache-busting
    const bucketImages = files.map(file => {
      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(`${userId}/${propertyId}/${file.name}`)
      
      return property?.updated_at 
        ? withPropertyVersion(data.publicUrl, property.updated_at)
        : data.publicUrl
    })

    // 4. Si hay pocas imágenes en bucket, completar con fallback
    if (bucketImages.length < maxImages && fallbackImages.length > 0) {
      const remaining = maxImages - bucketImages.length
      const additionalImages = fallbackImages.slice(0, remaining)
      return [...bucketImages, ...additionalImages]
    }

    return bucketImages

  } catch (error) {
    console.error('Error in getPropertyImages:', error)
    return fallbackImages.slice(0, maxImages)
  }
}

/**
 * Obtener primera imagen de propiedad (cover) con bucket-first
 */
export async function getPropertyCoverImage({
  userId,
  propertyId,
  fallbackImages = [],
  title
}: {
  userId: string
  propertyId: string
  fallbackImages?: string[]
  title?: string
}): Promise<string> {
  const images = await getPropertyImages({ userId, propertyId, fallbackImages, maxImages: 1 })
  
  if (images.length > 0) {
    return images[0]
  }
  
  // Último fallback: placeholder generado
  return generatePlaceholder(title, 1)
}

// Default export para compatibilidad con imports default
const propertyImages = { 
  resolvePropertyImage, 
  normalizeImages, 
  getCarouselImages, 
  getCoverImage,
  isValidImageUrl,
  generatePlaceholder,
  withPropertyVersion,
  getPropertyImages,
  getPropertyCoverImage
}

export default propertyImages
