/**
 * Helper para generar URLs firmadas de Supabase Storage
 * Usado para acceso seguro a adjuntos de mensajes
 * 
 * @module storage/signed-url
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Genera una URL firmada para un archivo en Supabase Storage
 * 
 * @param bucket - Nombre del bucket (ej: 'message-attachments')
 * @param path - Ruta del archivo dentro del bucket
 * @param expiresIn - Tiempo de expiración en segundos (default: 3600 = 1 hora)
 * @returns URL firmada o null si hay error
 */
export async function generateSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600 // 1 hora por defecto (60 min)
): Promise<string | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
    
    if (error) {
      console.error('[SIGNED_URL] Error generando URL firmada:', {
        bucket,
        path,
        error: error.message
      })
      return null
    }
    
    if (!data?.signedUrl) {
      console.error('[SIGNED_URL] No se recibió URL firmada')
      return null
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('[SIGNED_URL] Excepción al generar URL firmada:', error)
    return null
  }
}

/**
 * Refresca la URL firmada de un adjunto específico
 * Útil cuando una URL ha expirado y necesita renovarse
 * 
 * @param attachmentId - ID del adjunto en la tabla message_attachments
 * @returns Nueva URL firmada o null si hay error
 */
export async function refreshSignedUrl(
  attachmentId: string
): Promise<string | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Obtener la ruta del adjunto desde la base de datos
    const { data: attachment, error: fetchError } = await supabase
      .from('message_attachments')
      .select('path, bucket')
      .eq('id', attachmentId)
      .single()
    
    if (fetchError || !attachment) {
      console.error('[SIGNED_URL] Error obteniendo adjunto:', {
        attachmentId,
        error: fetchError?.message
      })
      return null
    }
    
    // Generar nueva URL firmada
    return generateSignedUrl(
      attachment.bucket || 'message-attachments',
      attachment.path
    )
  } catch (error) {
    console.error('[SIGNED_URL] Excepción al refrescar URL firmada:', error)
    return null
  }
}

/**
 * Genera URLs firmadas para múltiples adjuntos
 * Útil para procesar lotes de adjuntos de manera eficiente
 * 
 * @param attachments - Array de objetos con bucket y path
 * @param expiresIn - Tiempo de expiración en segundos
 * @returns Array de URLs firmadas (null para los que fallen)
 */
export async function generateSignedUrls(
  attachments: Array<{ bucket: string; path: string }>,
  expiresIn: number = 3600
): Promise<Array<string | null>> {
  const promises = attachments.map(({ bucket, path }) =>
    generateSignedUrl(bucket, path, expiresIn)
  )
  
  return Promise.all(promises)
}

/**
 * Valida si una URL firmada aún es válida (no expirada)
 * Nota: Esta es una validación básica basada en el parámetro de expiración
 * 
 * @param signedUrl - URL firmada a validar
 * @returns true si la URL parece válida, false si no
 */
export function isSignedUrlValid(signedUrl: string): boolean {
  try {
    const url = new URL(signedUrl)
    const expiresAt = url.searchParams.get('Expires')
    
    if (!expiresAt) {
      return false
    }
    
    const expirationTime = parseInt(expiresAt, 10) * 1000 // Convertir a ms
    const now = Date.now()
    
    // Considerar válida si expira en más de 5 minutos
    return expirationTime > now + (5 * 60 * 1000)
  } catch {
    return false
  }
}
