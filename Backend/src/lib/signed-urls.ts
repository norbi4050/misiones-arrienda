/**
 * 🔒 UTILIDADES PARA SIGNED URLs
 * 
 * Sistema para generar signed URLs desde bucket privado property-images
 * Reemplaza el sistema de bucket público por mayor seguridad
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

// Configuración de signed URLs
const SIGNED_URL_CONFIG = {
  expiresIn: 900, // 15 minutos en segundos
  bucket: 'property-images'
} as const

interface SignedUrlResult {
  url: string
  expiresAt: string
  key: string
}

interface SignedUrlError {
  error: string
  key: string
}

/**
 * Genera una signed URL para una key de storage
 */
export async function generateSignedUrl(key: string): Promise<SignedUrlResult | SignedUrlError> {
  if (!key || key.trim() === '') {
    return { error: 'Key vacía', key }
  }

  // Validar que no sea un data URI antes de procesar
  if (!isValidStorageKey(key)) {
    console.warn(`Fallback a placeholder para key ${key}: Key inválida (posible data URI)`)
    return { error: 'Key inválida (posible data URI)', key }
  }

  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase.storage
      .from(SIGNED_URL_CONFIG.bucket)
      .createSignedUrl(key, SIGNED_URL_CONFIG.expiresIn)

    if (error) {
      console.error(`Error generando signed URL para key ${key}:`, error)
      return { error: error.message, key }
    }

    if (!data?.signedUrl) {
      return { error: 'No se pudo generar signed URL', key }
    }

    // Calcular fecha de expiración
    const expiresAt = new Date(Date.now() + (SIGNED_URL_CONFIG.expiresIn * 1000)).toISOString()

    return {
      url: data.signedUrl,
      expiresAt,
      key
    }
  } catch (error) {
    console.error(`Error inesperado generando signed URL para key ${key}:`, error)
    return { 
      error: error instanceof Error ? error.message : 'Error desconocido', 
      key 
    }
  }
}

/**
 * Genera signed URLs para múltiples keys (batch)
 */
export async function generateSignedUrls(keys: string[]): Promise<{
  success: SignedUrlResult[]
  errors: SignedUrlError[]
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
      validKeys.map(key => generateSignedUrl(key))
    )

    const success: SignedUrlResult[] = []
    const errors: SignedUrlError[] = []

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
    console.error('Error en batch de signed URLs:', error)
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
 * Genera signed URL para cover image con fallback a placeholder
 */
export async function generateCoverUrl(coverKey: string | null, propertyType?: string): Promise<{
  coverUrl: string
  coverUrlExpiresAt?: string
  isPlaceholder: boolean
}> {
  // Si no hay cover key, usar placeholder
  if (!coverKey || coverKey.trim() === '') {
    return {
      coverUrl: getPlaceholderUrl(propertyType),
      isPlaceholder: true
    }
  }

  // Generar signed URL
  const result = await generateSignedUrl(coverKey)

  if ('url' in result) {
    return {
      coverUrl: result.url,
      coverUrlExpiresAt: result.expiresAt,
      isPlaceholder: false
    }
  } else {
    // Si falla, usar placeholder
    console.warn(`Fallback a placeholder para key ${coverKey}:`, result.error)
    return {
      coverUrl: getPlaceholderUrl(propertyType),
      isPlaceholder: true
    }
  }
}

/**
 * Obtiene URL de placeholder basada en tipo de propiedad
 */
function getPlaceholderUrl(propertyType?: string): string {
  const placeholders = {
    'HOUSE': '/placeholder-house-1.jpg',
    'APARTMENT': '/placeholder-apartment-1.jpg',
    'COMMERCIAL': '/placeholder-house-2.jpg',
    'LAND': '/placeholder-house-2.jpg',
    'OFFICE': '/placeholder-apartment-2.jpg',
    'WAREHOUSE': '/placeholder-house-2.jpg',
    'PH': '/placeholder-apartment-1.jpg',
    'STUDIO': '/placeholder-apartment-2.jpg'
  }

  return placeholders[propertyType as keyof typeof placeholders] || '/placeholder-house-1.jpg'
}

/**
 * Valida si una key de storage es válida
 */
export function isValidStorageKey(key: string): boolean {
  if (!key || key.trim() === '') return false
  
  // No debe ser una URL
  if (key.includes('http') || key.includes('/storage/v1/object/')) return false
  
  // No debe ser un data URI (base64)
  if (key.startsWith('data:') || key.includes('base64,')) return false
  
  // No debe ser demasiado largo (data URIs son muy largos)
  if (key.length > 500) return false
  
  // Debe tener formato userId/propertyId/filename (permitir múltiples extensiones)
  const keyPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.+-]+$/
  return keyPattern.test(key)
}

/**
 * Extrae keys de storage desde JSON
 */
export function extractStorageKeys(imagesJson: string | null): string[] {
  if (!imagesJson || imagesJson.trim() === '' || imagesJson === '[]') {
    return []
  }

  try {
    const parsed = JSON.parse(imagesJson)
    
    if (Array.isArray(parsed)) {
      return parsed.filter(key => isValidStorageKey(key))
    } else if (typeof parsed === 'string') {
      return isValidStorageKey(parsed) ? [parsed] : []
    }
    
    return []
  } catch {
    // Si falla el parsing, intentar como string simple
    return isValidStorageKey(imagesJson) ? [imagesJson] : []
  }
}

/**
 * Genera URL pública directa para bucket público property-images
 * Más simple y eficiente que signed URLs cuando el bucket es público
 */
export function getPublicImageUrl(key: string): string {
  if (!key || key.trim() === '') {
    return '/placeholder-house-1.jpg'
  }
  
  // Si ya es una URL completa, devolverla tal como está
  if (key.startsWith('http') || key.startsWith('/')) {
    return key
  }
  
  // Validar que la key sea válida antes de generar URL
  if (!isValidStorageKey(key)) {
    console.warn(`Key inválida para URL pública: ${key}`)
    return '/placeholder-house-1.jpg'
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/property-images/${key}`
}

/**
 * Genera URL pública para cover image con fallback a placeholder
 * Alternativa simple a generateCoverUrl para buckets públicos
 */
export function generatePublicCoverUrl(coverKey: string | null, propertyType?: string): {
  coverUrl: string
  isPlaceholder: boolean
} {
  // Si no hay cover key, usar placeholder
  if (!coverKey || coverKey.trim() === '') {
    return {
      coverUrl: getPlaceholderUrl(propertyType),
      isPlaceholder: true
    }
  }

  // Validar key antes de generar URL pública
  if (!isValidStorageKey(coverKey)) {
    console.warn(`Fallback a placeholder para key inválida: ${coverKey}`)
    return {
      coverUrl: getPlaceholderUrl(propertyType),
      isPlaceholder: true
    }
  }

  // Generar URL pública directa
  return {
    coverUrl: getPublicImageUrl(coverKey),
    isPlaceholder: false
  }
}

/**
 * Configuración y constantes exportadas
 */
export const SIGNED_URL_EXPIRY_MINUTES = SIGNED_URL_CONFIG.expiresIn / 60
export const PROPERTY_IMAGES_BUCKET = SIGNED_URL_CONFIG.bucket
