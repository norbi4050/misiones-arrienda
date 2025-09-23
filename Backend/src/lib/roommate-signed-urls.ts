/**
 * 🔒 UTILIDADES PARA SIGNED URLs DE ROOMMATES
 * 
 * Sistema para generar signed URLs desde bucket público roommate-images
 * Basado en el sistema de propiedades pero adaptado para roommates
 */

import { createClient } from '@supabase/supabase-js'

// Cliente admin para generar signed URLs
const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Configuración de signed URLs para roommates
const ROOMMATE_SIGNED_URL_CONFIG = {
  expiresIn: 900, // 15 minutos en segundos
  bucket: 'roommate-images'
} as const

interface RoommateSignedUrlResult {
  url: string
  expiresAt: string
  key: string
}

interface RoommateSignedUrlError {
  error: string
  key: string
}

/**
 * Genera una signed URL para una key de storage de roommate
 */
export async function generateRoommateSignedUrl(key: string): Promise<RoommateSignedUrlResult | RoommateSignedUrlError> {
  if (!key || key.trim() === '') {
    return { error: 'Key vacía', key }
  }

  // Validar que no sea un data URI antes de procesar
  if (!isValidRoommateStorageKey(key)) {
    console.warn(`Fallback a placeholder para key ${key}: Key inválida (posible data URI)`)
    return { error: 'Key inválida (posible data URI)', key }
  }

  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase.storage
      .from(ROOMMATE_SIGNED_URL_CONFIG.bucket)
      .createSignedUrl(key, ROOMMATE_SIGNED_URL_CONFIG.expiresIn)

    if (error) {
      console.error(`Error generando signed URL para roommate key ${key}:`, error)
      return { error: error.message, key }
    }

    if (!data?.signedUrl) {
      return { error: 'No se pudo generar signed URL', key }
    }

    // Calcular fecha de expiración
    const expiresAt = new Date(Date.now() + (ROOMMATE_SIGNED_URL_CONFIG.expiresIn * 1000)).toISOString()

    return {
      url: data.signedUrl,
      expiresAt,
      key
    }
  } catch (error) {
    console.error(`Error inesperado generando signed URL para roommate key ${key}:`, error)
    return { 
      error: error instanceof Error ? error.message : 'Error desconocido', 
      key 
    }
  }
}

/**
 * Genera signed URLs para múltiples keys de roommate (batch)
 */
export async function generateRoommateSignedUrls(keys: string[]): Promise<{
  success: RoommateSignedUrlResult[]
  errors: RoommateSignedUrlError[]
}> {
  if (!keys || keys.length === 0) {
    return { success: [], errors: [] }
  }

  // Filtrar keys válidas
  const validKeys = keys.filter(key => key && key.trim() !== '')
  
  if (validKeys.length === 0) {
    return { 
      success: [], 
      errors: keys.map(key => ({ error: 'Key inválida', key }))
    }
  }

  try {
    // Generar signed URLs en paralelo
    const results = await Promise.allSettled(
      validKeys.map(key => generateRoommateSignedUrl(key))
    )

    const success: RoommateSignedUrlResult[] = []
    const errors: RoommateSignedUrlError[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const urlResult = result.value
        if ('url' in urlResult) {
          success.push(urlResult)
        } else {
          errors.push(urlResult)
        }
      } else {
        errors.push({
          error: result.reason?.message || 'Error desconocido',
          key: validKeys[index]
        })
      }
    })

    return { success, errors }
  } catch (error) {
    console.error('Error en batch de signed URLs de roommates:', error)
    return {
      success: [],
      errors: validKeys.map(key => ({
        error: error instanceof Error ? error.message : 'Error desconocido',
        key
      }))
    }
  }
}

/**
 * Genera signed URL para cover image de roommate SIN fallback a placeholder
 */
export async function generateRoommateCoverUrl(coverKey: string | null): Promise<{
  coverUrl: string | null
  coverUrlExpiresAt?: string
  isPlaceholder: boolean
}> {
  // Si no hay cover key, NO usar placeholder
  if (!coverKey || coverKey.trim() === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[NO-PLACEHOLDER] Sin cover key para roommate`)
    }
    return {
      coverUrl: null,
      isPlaceholder: true
    }
  }

  // Generar signed URL
  const result = await generateRoommateSignedUrl(coverKey)

  if ('url' in result) {
    return {
      coverUrl: result.url,
      coverUrlExpiresAt: result.expiresAt,
      isPlaceholder: false
    }
  } else {
    // Si falla, NO usar placeholder
    console.warn(`[NO-PLACEHOLDER] Error generando signed URL para roommate ${coverKey}:`, result.error)
    return {
      coverUrl: null,
      isPlaceholder: true
    }
  }
}

/**
 * Valida si una key de storage de roommate es válida
 */
export function isValidRoommateStorageKey(key: string): boolean {
  if (!key || key.trim() === '') return false
  
  // No debe ser una URL
  if (key.includes('http') || key.includes('/storage/v1/object/')) return false
  
  // No debe ser un data URI (base64)
  if (key.startsWith('data:') || key.includes('base64,')) return false
  
  // No debe ser demasiado largo (data URIs son muy largos)
  if (key.length > 500) return false
  
  // Debe tener formato userId/postId/filename (permitir múltiples extensiones)
  const keyPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.+-]+$/
  return keyPattern.test(key)
}

/**
 * Extrae keys de storage desde JSON para roommates
 */
export function extractRoommateStorageKeys(imagesJson: string | null): string[] {
  if (!imagesJson || imagesJson.trim() === '' || imagesJson === '[]') {
    return []
  }

  try {
    const parsed = JSON.parse(imagesJson)
    
    if (Array.isArray(parsed)) {
      return parsed.filter(key => isValidRoommateStorageKey(key))
    } else if (typeof parsed === 'string') {
      return isValidRoommateStorageKey(parsed) ? [parsed] : []
    }
    
    return []
  } catch {
    // Si falla el parsing, intentar como string simple
    return isValidRoommateStorageKey(imagesJson) ? [imagesJson] : []
  }
}

/**
 * Genera URL pública directa para bucket público roommate-images
 * SIN fallback a placeholder
 */
export function getRoommatePublicImageUrl(key: string): string | null {
  if (!key || key.trim() === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[NO-PLACEHOLDER] Key vacía para URL pública de roommate')
    }
    return null
  }
  
  // Si ya es una URL completa, devolverla tal como está
  if (key.startsWith('http') || key.startsWith('/')) {
    return key
  }
  
  // Validar que la key sea válida antes de generar URL
  if (!isValidRoommateStorageKey(key)) {
    console.warn(`[NO-PLACEHOLDER] Key inválida para URL pública de roommate: ${key}`)
    return null
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/roommate-images/${key}`
}

/**
 * Genera URL pública para cover image de roommate SIN fallback a placeholder
 * Alternativa simple a generateRoommateCoverUrl para buckets públicos
 */
export function generateRoommatePublicCoverUrl(coverKey: string | null): {
  coverUrl: string | null
  isPlaceholder: boolean
} {
  // Si no hay cover key, NO usar placeholder
  if (!coverKey || coverKey.trim() === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[NO-PLACEHOLDER] Sin cover key para roommate`)
    }
    return {
      coverUrl: null,
      isPlaceholder: true
    }
  }

  // Validar key antes de generar URL pública
  if (!isValidRoommateStorageKey(coverKey)) {
    console.warn(`[NO-PLACEHOLDER] Key inválida para roommate: ${coverKey}`)
    return {
      coverUrl: null,
      isPlaceholder: true
    }
  }

  // Generar URL pública directa
  return {
    coverUrl: getRoommatePublicImageUrl(coverKey),
    isPlaceholder: false
  }
}

/**
 * Función helper para mapear imágenes de roommate con URLs públicas
 */
export async function mapRoommateImagesToUrls(imagesUrls: string[]): Promise<string[]> {
  if (!imagesUrls || imagesUrls.length === 0) {
    return []
  }

  // Base URL pública para bucket roommate-images
  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/roommate-images/`
  
  // Procesar imágenes: convertir keys a URLs públicas
  const images = imagesUrls
    .filter(key => isValidRoommateStorageKey(key))
    .map(key => key.startsWith('http') ? key : `${publicBase}${key}`)

  return images
}

/**
 * Configuración y constantes exportadas para roommates
 */
export const ROOMMATE_SIGNED_URL_EXPIRY_MINUTES = ROOMMATE_SIGNED_URL_CONFIG.expiresIn / 60
export const ROOMMATE_IMAGES_BUCKET = ROOMMATE_SIGNED_URL_CONFIG.bucket

/**
 * Función para generar path de storage para roommate
 */
export function generateRoommateStoragePath(userId: string, postId: string, filename: string): string {
  // Limpiar filename
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${postId}/${cleanFilename}`
}

/**
 * Función para validar estructura de path de roommate
 */
export function validateRoommateStoragePath(path: string): {
  valid: boolean
  userId?: string
  postId?: string
  filename?: string
} {
  const parts = path.split('/')
  
  if (parts.length !== 3) {
    return { valid: false }
  }

  const [userId, postId, filename] = parts

  // Validar que cada parte tenga contenido válido
  if (!userId || !postId || !filename) {
    return { valid: false }
  }

  // Validar formato de cada parte
  const validFormat = /^[a-zA-Z0-9_-]+$/.test(userId) && 
                     /^[a-zA-Z0-9_-]+$/.test(postId) && 
                     /^[a-zA-Z0-9_.+-]+$/.test(filename)

  return {
    valid: validFormat,
    userId: validFormat ? userId : undefined,
    postId: validFormat ? postId : undefined,
    filename: validFormat ? filename : undefined
  }
}
