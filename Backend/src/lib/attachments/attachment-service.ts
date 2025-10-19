// =====================================================
// ATTACHMENT SERVICE V2.0 - Sistema Robusto de Adjuntos
// Fecha: 11 de Enero de 2025
// =====================================================

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { getUserPlanLimits } from '@/lib/plan-guards'
import { PLAN_ATTACHMENT_LIMITS, type PlanTier } from '@/types/plan-limits'
import { createId } from '@paralleldrive/cuid2'
import sharp from 'sharp'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const prisma = new PrismaClient()

// =====================================================
// TIPOS
// =====================================================

export interface AttachmentFile {
  file: File
  buffer: Buffer
}

export interface AttachmentMetadata {
  width?: number
  height?: number
}

export interface CreateAttachmentResult {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  storageUrl: string
  width?: number
  height?: number
}

export interface ValidationError {
  code: 'SIZE_LIMIT' | 'MIME_NOT_ALLOWED' | 'DAILY_QUOTA' | 'PLAN_REQUIRED' | 'MAX_FILES' | 'INVALID_FILE'
  message: string
  details?: any
}

// =====================================================
// VALIDACIÓN
// =====================================================

/**
 * Valida archivos antes de subir
 */
export async function validateAttachments(
  userId: string,
  files: AttachmentFile[]
): Promise<{ valid: boolean; error?: ValidationError }> {
  try {
    // 1. Obtener plan del usuario
    const limits = await getUserPlanLimits(userId)
    
    if (!limits) {
      return {
        valid: false,
        error: {
          code: 'PLAN_REQUIRED',
          message: 'No se pudo verificar tu plan'
        }
      }
    }

    // 2. Verificar si el plan permite adjuntos
    if (!limits.allow_attachments) {
      return {
        valid: false,
        error: {
          code: 'PLAN_REQUIRED',
          message: 'Adjuntar archivos es una función PRO. Mejora tu plan.',
          details: { planTier: limits.plan_tier }
        }
      }
    }

    const planLimits = PLAN_ATTACHMENT_LIMITS[limits.plan_tier]

    // 3. Validar cantidad de archivos
    if (files.length > planLimits.maxFiles) {
      return {
        valid: false,
        error: {
          code: 'MAX_FILES',
          message: `Máximo ${planLimits.maxFiles} archivos por mensaje`,
          details: { maxFiles: planLimits.maxFiles, provided: files.length }
        }
      }
    }

    // 4. Validar cada archivo
    for (const { file } of files) {
      // Validar tamaño
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > planLimits.maxSizeMB) {
        return {
          valid: false,
          error: {
            code: 'SIZE_LIMIT',
            message: `Archivo "${file.name}" excede ${planLimits.maxSizeMB}MB`,
            details: { fileName: file.name, sizeMB: sizeMB.toFixed(2), maxSizeMB: planLimits.maxSizeMB }
          }
        }
      }

      // Validar tipo MIME
      if (!planLimits.allowedMimes.includes(file.type as any)) {
        return {
          valid: false,
          error: {
            code: 'MIME_NOT_ALLOWED',
            message: `Tipo de archivo "${file.type}" no permitido`,
            details: { fileName: file.name, mimeType: file.type, allowed: planLimits.allowedMimes }
          }
        }
      }
    }

    // 5. Validar cuota diaria
    const { data: dailyCount } = await supabase.rpc('count_user_daily_attachments', {
      user_uuid: userId
    })

    const currentCount = dailyCount || 0
    if (currentCount + files.length > planLimits.dailyCount) {
      return {
        valid: false,
        error: {
          code: 'DAILY_QUOTA',
          message: `Límite diario alcanzado (${currentCount}/${planLimits.dailyCount})`,
          details: { current: currentCount, limit: planLimits.dailyCount, trying: files.length }
        }
      }
    }

    return { valid: true }

  } catch (error) {
    console.error('[AttachmentService] Error en validación:', error)
    return {
      valid: false,
      error: {
        code: 'INVALID_FILE',
        message: 'Error al validar archivos'
      }
    }
  }
}

// =====================================================
// PROCESAMIENTO DE IMÁGENES
// =====================================================

/**
 * Extrae metadata de imágenes
 */
async function extractImageMetadata(buffer: Buffer, mimeType: string): Promise<AttachmentMetadata> {
  if (!mimeType.startsWith('image/')) {
    return {}
  }

  try {
    const metadata = await sharp(buffer).metadata()
    return {
      width: metadata.width,
      height: metadata.height
    }
  } catch (error) {
    console.error('[AttachmentService] Error extrayendo metadata de imagen:', error)
    return {}
  }
}

// =====================================================
// STORAGE
// =====================================================

/**
 * Sube archivo a Supabase Storage
 */
async function uploadToStorage(
  conversationId: string,
  messageId: string,
  file: File,
  buffer: Buffer
): Promise<{ path: string; url: string }> {
  // Sanitizar nombre de archivo
  const sanitizedName = sanitizeFileName(file.name)
  
  // Generar path único: {conversationId}/{messageId}/{timestamp}_{filename}
  const timestamp = Date.now()
  const storagePath = `${conversationId}/${messageId}/${timestamp}_${sanitizedName}`

  // Subir a Storage
  const { data, error } = await supabase.storage
    .from('message-attachments')
    .upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('[AttachmentService] Error subiendo a Storage:', error)
    throw new Error(`Error al subir archivo: ${error.message}`)
  }

  // Generar URL firmada (válida por 1 hora)
  const { data: urlData } = await supabase.storage
    .from('message-attachments')
    .createSignedUrl(storagePath, 3600)

  if (!urlData?.signedUrl) {
    throw new Error('Error al generar URL firmada')
  }

  return {
    path: storagePath,
    url: urlData.signedUrl
  }
}

/**
 * Elimina archivo de Storage
 */
async function deleteFromStorage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('message-attachments')
    .remove([storagePath])

  if (error) {
    console.error('[AttachmentService] Error eliminando de Storage:', error)
    throw new Error(`Error al eliminar archivo: ${error.message}`)
  }
}

// =====================================================
// SERVICIO PRINCIPAL
// =====================================================

/**
 * Crea adjuntos vinculados a un mensaje (TRANSACCIÓN ATÓMICA)
 */
export async function createMessageAttachments(
  messageId: string,
  conversationId: string,
  userId: string,
  files: AttachmentFile[]
): Promise<CreateAttachmentResult[]> {
  const uploadedPaths: string[] = []
  const createdAttachments: CreateAttachmentResult[] = []

  try {
    console.log(`[AttachmentService] Creando ${files.length} adjuntos para mensaje ${messageId}`)

    // Procesar cada archivo
    for (const { file, buffer } of files) {
      // 1. Subir a Storage
      const { path, url } = await uploadToStorage(conversationId, messageId, file, buffer)
      uploadedPaths.push(path)

      // 2. Extraer metadata (si es imagen)
      const metadata = await extractImageMetadata(buffer, file.type)

      // 3. Crear registro en DB
      const attachment = await prisma.messageAttachment.create({
        data: {
          id: createId(),
          messageId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storagePath: path,
          // storageUrl eliminado - no existe en schema real
          width: metadata.width,
          height: metadata.height,
          uploadedBy: userId
        }
      })

      createdAttachments.push({
        id: attachment.id,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        storageUrl: attachment.storageUrl,
        width: attachment.width || undefined,
        height: attachment.height || undefined
      })

      console.log(`[AttachmentService] Adjunto creado: ${attachment.id} - ${attachment.fileName}`)
    }

    console.log(`[AttachmentService] ${createdAttachments.length} adjuntos creados exitosamente`)
    return createdAttachments

  } catch (error) {
    console.error('[AttachmentService] Error en createMessageAttachments:', error)

    // ROLLBACK: Eliminar archivos subidos a Storage
    console.log(`[AttachmentService] Iniciando rollback de ${uploadedPaths.length} archivos`)
    
    for (const path of uploadedPaths) {
      try {
        await deleteFromStorage(path)
        console.log(`[AttachmentService] Rollback: Eliminado ${path}`)
      } catch (rollbackError) {
        console.error(`[AttachmentService] Error en rollback de ${path}:`, rollbackError)
      }
    }

    // ROLLBACK: Eliminar registros de DB (si se crearon)
    if (createdAttachments.length > 0) {
      try {
        await prisma.messageAttachment.deleteMany({
          where: {
            id: { in: createdAttachments.map(a => a.id) }
          }
        })
        console.log(`[AttachmentService] Rollback: Eliminados ${createdAttachments.length} registros de DB`)
      } catch (rollbackError) {
        console.error('[AttachmentService] Error en rollback de DB:', rollbackError)
      }
    }

    throw error
  }
}

/**
 * Obtiene adjuntos de un mensaje
 */
export async function getMessageAttachments(messageId: string): Promise<CreateAttachmentResult[]> {
  const attachments = await prisma.messageAttachment.findMany({
    where: { messageId },
    orderBy: { createdAt: 'asc' }
  })

  return attachments.map(att => ({
    id: att.id,
    fileName: att.fileName,
    fileSize: att.fileSize,
    mimeType: att.mimeType,
    storageUrl: att.storageUrl,
    width: att.width || undefined,
    height: att.height || undefined
  }))
}

/**
 * Regenera URL firmada para un adjunto
 */
export async function regenerateSignedUrl(attachmentId: string): Promise<string> {
  const attachment = await prisma.messageAttachment.findUnique({
    where: { id: attachmentId }
  })

  if (!attachment) {
    throw new Error('Adjunto no encontrado')
  }

  const { data } = await supabase.storage
    .from('message-attachments')
    .createSignedUrl(attachment.storagePath, 3600)

  if (!data?.signedUrl) {
    throw new Error('Error al generar URL firmada')
  }

  // Actualizar URL en DB
  await prisma.messageAttachment.update({
    where: { id: attachmentId },
    data: { storageUrl: data.signedUrl }
  })

  return data.signedUrl
}

/**
 * Elimina un adjunto (archivo + registro)
 */
export async function deleteAttachment(attachmentId: string, userId: string): Promise<void> {
  const attachment = await prisma.messageAttachment.findUnique({
    where: { id: attachmentId }
  })

  if (!attachment) {
    throw new Error('Adjunto no encontrado')
  }

  // Verificar permisos
  if (attachment.uploadedBy !== userId) {
    throw new Error('No tienes permiso para eliminar este adjunto')
  }

  // Eliminar de Storage
  await deleteFromStorage(attachment.storagePath)

  // Eliminar de DB
  await prisma.messageAttachment.delete({
    where: { id: attachmentId }
  })

  console.log(`[AttachmentService] Adjunto eliminado: ${attachmentId}`)
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Sanitiza nombre de archivo
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')  // Solo alfanuméricos, puntos y guiones
    .replace(/\.{2,}/g, '.')           // Evitar múltiples puntos
    .replace(/^\.+/, '')               // Remover puntos al inicio
    .substring(0, 255)                 // Limitar longitud
}

/**
 * Formatea tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Obtiene información de límites para UI
 */
export async function getAttachmentLimitsInfo(userId: string) {
  try {
    const limits = await getUserPlanLimits(userId)
    
    if (!limits) {
      return null
    }

    const planLimits = PLAN_ATTACHMENT_LIMITS[limits.plan_tier]
    
    const { data: dailyCount } = await supabase.rpc('count_user_daily_attachments', {
      user_uuid: userId
    })

    return {
      planTier: limits.plan_tier,
      allowAttachments: limits.allow_attachments,
      maxFiles: planLimits.maxFiles,
      maxSizeMB: planLimits.maxSizeMB,
      allowedMimes: planLimits.allowedMimes,
      dailyLimit: planLimits.dailyCount,
      dailyUsed: dailyCount || 0,
      dailyRemaining: Math.max(0, planLimits.dailyCount - (dailyCount || 0))
    }
  } catch (error) {
    console.error('[AttachmentService] Error obteniendo límites:', error)
    return null
  }
}
