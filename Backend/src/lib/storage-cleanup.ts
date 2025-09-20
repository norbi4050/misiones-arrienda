/**
 * Sistema de limpieza automática de imágenes en storage
 * Objetivo: Evitar imágenes huérfanas y controlar costos de almacenamiento
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { LogContext } from '@/lib/logger'

export interface StorageCleanupResult {
  success: boolean
  deletedFiles: string[]
  errors: string[]
  totalSize?: number
}

export class StorageCleanupService {
  private supabase: any

  constructor() {
    this.supabase = null
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Lista todas las imágenes de una propiedad específica
   */
  async listPropertyImages(userId: string, propertyId: string): Promise<string[]> {
    try {
      const supabase = await this.getSupabaseClient()
      const prefix = `${userId}/${propertyId}/`

      const { data, error } = await supabase.storage
        .from('property-images')
        .list(prefix, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        throw new Error(`Error listing files: ${error.message}`)
      }

      // Construir paths completos
      const filePaths = data?.map((file: any) => `${prefix}${file.name}`) || []
      return filePaths
    } catch (error) {
      console.error('Error listing property images:', error)
      return []
    }
  }

  /**
   * Elimina todas las imágenes de una propiedad
   */
  async deletePropertyImages(
    userId: string, 
    propertyId: string, 
    context?: LogContext
  ): Promise<StorageCleanupResult> {
    const result: StorageCleanupResult = {
      success: false,
      deletedFiles: [],
      errors: []
    }

    try {
      const supabase = await this.getSupabaseClient()
      
      // 1. Listar todas las imágenes de la propiedad
      const filePaths = await this.listPropertyImages(userId, propertyId)
      
      if (filePaths.length === 0) {
        result.success = true
        if (context) {
          await logger.info('No images found for property cleanup', context, {
            userId,
            propertyId,
            filesFound: 0
          })
        }
        return result
      }

      if (context) {
        await logger.info('Starting property images cleanup', context, {
          userId,
          propertyId,
          filesFound: filePaths.length,
          files: filePaths
        })
      }

      // 2. Eliminar archivos en lotes (Supabase tiene límite de 100 por request)
      const batchSize = 50
      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize)
        
        const { data, error } = await supabase.storage
          .from('property-images')
          .remove(batch)

        if (error) {
          result.errors.push(`Batch ${i}-${i + batch.length}: ${error.message}`)
          if (context) {
            await logger.warn('Error deleting batch of images', context, {
              userId,
              propertyId,
              batch,
              error: error.message
            })
          }
        } else {
          result.deletedFiles.push(...batch)
          if (context) {
            await logger.info('Successfully deleted batch of images', context, {
              userId,
              propertyId,
              deletedCount: batch.length,
              batch
            })
          }
        }
      }

      result.success = result.errors.length === 0
      
      if (context) {
        await logger.info('Property images cleanup completed', context, {
          userId,
          propertyId,
          totalDeleted: result.deletedFiles.length,
          errors: result.errors.length,
          success: result.success
        })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      result.errors.push(errorMessage)
      
      if (context) {
        await logger.error('Property images cleanup failed', context, error instanceof Error ? error : new Error(errorMessage), {
          userId,
          propertyId
        })
      }
      
      return result
    }
  }

  /**
   * Verifica si quedan imágenes huérfanas después de la limpieza
   */
  async verifyCleanup(userId: string, propertyId: string): Promise<{
    isClean: boolean
    remainingFiles: string[]
  }> {
    try {
      const remainingFiles = await this.listPropertyImages(userId, propertyId)
      return {
        isClean: remainingFiles.length === 0,
        remainingFiles
      }
    } catch (error) {
      console.error('Error verifying cleanup:', error)
      return {
        isClean: false,
        remainingFiles: []
      }
    }
  }

  /**
   * Limpieza masiva de imágenes huérfanas (para mantenimiento)
   */
  async cleanupOrphanedImages(context?: LogContext): Promise<StorageCleanupResult> {
    const result: StorageCleanupResult = {
      success: false,
      deletedFiles: [],
      errors: []
    }

    try {
      const supabase = await this.getSupabaseClient()

      // 1. Obtener todas las propiedades activas
      const { data: activeProperties, error: dbError } = await supabase
        .from('properties')
        .select('id, userId')
        .eq('isActive', true)

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      const activePropertyPaths = new Set(
        activeProperties?.map((p: any) => `${p.userId}/${p.id}/`) || []
      )

      // 2. Listar todos los archivos en storage
      const { data: allFiles, error: storageError } = await supabase.storage
        .from('property-images')
        .list('', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (storageError) {
        throw new Error(`Storage error: ${storageError.message}`)
      }

      // 3. Identificar archivos huérfanos
      const orphanedFiles: string[] = []
      
      for (const file of allFiles || []) {
        const filePath = file.name
        const pathParts = filePath.split('/')
        
        if (pathParts.length >= 2) {
          const propertyPath = `${pathParts[0]}/${pathParts[1]}/`
          if (!activePropertyPaths.has(propertyPath)) {
            orphanedFiles.push(filePath)
          }
        }
      }

      if (context) {
        await logger.info('Orphaned images scan completed', context, {
          totalFiles: allFiles?.length || 0,
          activeProperties: activeProperties?.length || 0,
          orphanedFiles: orphanedFiles.length
        })
      }

      // 4. Eliminar archivos huérfanos
      if (orphanedFiles.length > 0) {
        const { data, error } = await supabase.storage
          .from('property-images')
          .remove(orphanedFiles)

        if (error) {
          result.errors.push(`Error deleting orphaned files: ${error.message}`)
        } else {
          result.deletedFiles = orphanedFiles
          result.success = true
        }
      } else {
        result.success = true
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      result.errors.push(errorMessage)
      
      if (context) {
        await logger.error('Orphaned images cleanup failed', context, error instanceof Error ? error : new Error(errorMessage))
      }
      
      return result
    }
  }
}

// Instancia singleton
export const storageCleanup = new StorageCleanupService()

/**
 * Utilidad para usar en endpoints de eliminación
 */
export async function cleanupPropertyImages(
  userId: string,
  propertyId: string,
  context?: LogContext
): Promise<StorageCleanupResult> {
  return await storageCleanup.deletePropertyImages(userId, propertyId, context)
}

/**
 * Utilidad para verificar limpieza
 */
export async function verifyImageCleanup(
  userId: string,
  propertyId: string
): Promise<boolean> {
  const verification = await storageCleanup.verifyCleanup(userId, propertyId)
  return verification.isClean
}
