import { NextRequest, NextResponse } from 'next/server'

// =====================================================
// PATCH /api/roommates/[id]/publish - PUBLICAR ROOMMATE
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== PATCH /api/roommates/[id]/publish [${requestId}] ===`)
  
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Verificar que sea un UUID válido
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    if (!isUUID) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    // Verificar autenticación
    const { getAuthenticatedUser } = await import('@/lib/auth-middleware')
    const authenticatedUser = await getAuthenticatedUser(request)
    
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log(`[${requestId}] Usuario autenticado: ${authenticatedUser.id}`)

    // Crear cliente Supabase con Service Role
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar que el roommate existe y pertenece al usuario
    const { data: existingRoommate, error: fetchError } = await supabase
      .from('roommate_posts')
      .select('id, user_id, title, status, city, room_type, monthly_rent, available_from, description')
      .eq('id', id)
      .single()

    if (fetchError || !existingRoommate) {
      console.log(`[${requestId}] Roommate no encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Roommate no encontrado' },
        { status: 404 }
      )
    }

    // Verificar ownership
    if (existingRoommate.user_id !== authenticatedUser.id) {
      console.log(`[${requestId}] Usuario no es dueño del roommate`)
      return NextResponse.json(
        { error: 'No tienes permisos para publicar este roommate' },
        { status: 403 }
      )
    }

    // Verificar que esté en estado DRAFT
    if (existingRoommate.status !== 'DRAFT') {
      console.log(`[${requestId}] Roommate no está en estado DRAFT: ${existingRoommate.status}`)
      return NextResponse.json(
        { error: `No se puede publicar. Estado actual: ${existingRoommate.status}` },
        { status: 400 }
      )
    }

    // Validar que esté publish-ready
    const { validatePublishReady } = await import('@/lib/validations/roommate')
    const publishValidation = validatePublishReady({
      title: existingRoommate.title,
      description: existingRoommate.description,
      city: existingRoommate.city,
      province: 'Misiones', // Default
      roomType: existingRoommate.room_type as any,
      monthlyRent: existingRoommate.monthly_rent,
      availableFrom: existingRoommate.available_from,
      images: [], // Se validará por separado
      imagesUrls: [],
      status: 'DRAFT' // Agregar status requerido
    })

    if (!publishValidation.isReady) {
      console.log(`[${requestId}] Roommate no está listo para publicar:`, publishValidation.missingFields)
      return NextResponse.json(
        { 
          error: 'El roommate no está listo para publicar',
          missingFields: publishValidation.missingFields,
          warnings: publishValidation.warnings
        },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Publicando roommate...`)

    // Actualizar estado a PUBLISHED
    const { data: publishedRoommate, error: publishError } = await supabase
      .from('roommate_posts')
      .update({
        status: 'PUBLISHED',
        is_active: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, title, status, published_at, slug')
      .single()

    if (publishError) {
      console.error(`[${requestId}] Error publicando roommate:`, publishError)
      return NextResponse.json(
        { error: `Error al publicar roommate: ${publishError.message}` },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Roommate publicado exitosamente`)

    return NextResponse.json({
      id: publishedRoommate.id,
      title: publishedRoommate.title,
      status: publishedRoommate.status,
      publishedAt: publishedRoommate.published_at,
      slug: publishedRoommate.slug,
      message: 'Roommate publicado exitosamente',
      meta: {
        requestId,
        action: 'publish'
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Formato de datos inválido' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
