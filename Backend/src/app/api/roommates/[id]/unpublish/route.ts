import { NextRequest, NextResponse } from 'next/server'

// =====================================================
// PATCH /api/roommates/[id]/unpublish - DESPUBLICAR ROOMMATE
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== PATCH /api/roommates/[id]/unpublish [${requestId}] ===`)
  
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
      .select('id, user_id, title, status')
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
        { error: 'No tienes permisos para despublicar este roommate' },
        { status: 403 }
      )
    }

    // Verificar que esté en estado PUBLISHED
    if (existingRoommate.status !== 'PUBLISHED') {
      console.log(`[${requestId}] Roommate no está publicado: ${existingRoommate.status}`)
      return NextResponse.json(
        { error: `No se puede despublicar. Estado actual: ${existingRoommate.status}` },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Despublicando roommate...`)

    // Actualizar estado a DRAFT
    const { data: unpublishedRoommate, error: unpublishError } = await supabase
      .from('roommate_posts')
      .update({
        status: 'DRAFT',
        is_active: false,
        published_at: null, // Limpiar fecha de publicación
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, title, status, slug')
      .single()

    if (unpublishError) {
      console.error(`[${requestId}] Error despublicando roommate:`, unpublishError)
      return NextResponse.json(
        { error: `Error al despublicar roommate: ${unpublishError.message}` },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Roommate despublicado exitosamente`)

    return NextResponse.json({
      id: unpublishedRoommate.id,
      title: unpublishedRoommate.title,
      status: unpublishedRoommate.status,
      slug: unpublishedRoommate.slug,
      message: 'Roommate despublicado exitosamente',
      meta: {
        requestId,
        action: 'unpublish'
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
