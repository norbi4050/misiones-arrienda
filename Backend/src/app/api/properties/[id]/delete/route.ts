import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { withLogging, logger } from '@/lib/logger'
import { cleanupPropertyImages } from '@/lib/storage-cleanup'

export const DELETE = withLogging(async (req: NextRequest, context) => {
  try {
    // 1. Verificar autenticación
    const authenticatedUser = await getAuthenticatedUser(req)
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // 2. Extraer propertyId de la URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const propertyId = pathParts[pathParts.indexOf('properties') + 1]

    if (!propertyId) {
      return NextResponse.json(
        { error: 'ID de propiedad requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 3. Verificar que la propiedad existe y pertenece al usuario
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id, userId, title')
      .eq('id', propertyId)
      .eq('userId', authenticatedUser.id)
      .single()

    if (fetchError || !property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o no tienes permisos para eliminarla' },
        { status: 404 }
      )
    }

    // 4. Limpiar imágenes del storage ANTES de eliminar el registro
    const cleanupResult = await cleanupPropertyImages(
      authenticatedUser.id,
      propertyId,
      context
    )

    // Log del resultado de limpieza
    if (cleanupResult.success) {
      await logger.info('Images cleanup completed successfully', context, {
        propertyId,
        deletedFiles: cleanupResult.deletedFiles.length,
        files: cleanupResult.deletedFiles
      })
    } else {
      await logger.warn('Images cleanup had errors', context, {
        propertyId,
        errors: cleanupResult.errors,
        partialSuccess: cleanupResult.deletedFiles.length > 0
      })
    }

    // 5. Eliminar el registro de la propiedad (soft delete)
    const { error: deleteError } = await supabase
      .from('properties')
      .update({ 
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', propertyId)
      .eq('userId', authenticatedUser.id)

    if (deleteError) {
      await logger.error('Failed to delete property record', context, deleteError, {
        propertyId,
        userId: authenticatedUser.id
      })
      
      return NextResponse.json(
        { error: 'Error al eliminar la propiedad de la base de datos' },
        { status: 500 }
      )
    }

    // 6. Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Propiedad eliminada exitosamente',
      propertyId,
      cleanup: {
        imagesDeleted: cleanupResult.deletedFiles.length,
        cleanupSuccess: cleanupResult.success,
        errors: cleanupResult.errors
      }
    })

  } catch (error) {
    await logger.error('Unexpected error in property deletion', context, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// Método PATCH para archivado (alternativa al DELETE)
export const PATCH = withLogging(async (req: NextRequest, context) => {
  try {
    const body = await req.json()
    const { action } = body

    if (action !== 'archive') {
      return NextResponse.json(
        { error: 'Acción no válida. Use action: "archive"' },
        { status: 400 }
      )
    }

    // 1. Verificar autenticación
    const authenticatedUser = await getAuthenticatedUser(req)
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // 2. Extraer propertyId de la URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const propertyId = pathParts[pathParts.indexOf('properties') + 1]

    if (!propertyId) {
      return NextResponse.json(
        { error: 'ID de propiedad requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 3. Verificar que la propiedad existe y pertenece al usuario
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id, userId, title, status')
      .eq('id', propertyId)
      .eq('userId', authenticatedUser.id)
      .single()

    if (fetchError || !property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o no tienes permisos para archivarla' },
        { status: 404 }
      )
    }

    // 4. Limpiar imágenes del storage
    const cleanupResult = await cleanupPropertyImages(
      authenticatedUser.id,
      propertyId,
      context
    )

    // 5. Archivar la propiedad (cambiar status pero mantener registro)
    const { error: archiveError } = await supabase
      .from('properties')
      .update({ 
        status: 'ARCHIVED',
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', propertyId)
      .eq('userId', authenticatedUser.id)

    if (archiveError) {
      await logger.error('Failed to archive property', context, archiveError, {
        propertyId,
        userId: authenticatedUser.id
      })
      
      return NextResponse.json(
        { error: 'Error al archivar la propiedad' },
        { status: 500 }
      )
    }

    // 6. Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Propiedad archivada exitosamente',
      propertyId,
      previousStatus: property.status,
      newStatus: 'ARCHIVED',
      cleanup: {
        imagesDeleted: cleanupResult.deletedFiles.length,
        cleanupSuccess: cleanupResult.success,
        errors: cleanupResult.errors
      }
    })

  } catch (error) {
    await logger.error('Unexpected error in property archiving', context, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
