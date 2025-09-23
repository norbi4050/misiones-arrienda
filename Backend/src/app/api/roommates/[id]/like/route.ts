import { NextRequest, NextResponse } from 'next/server'

// =====================================================
// POST /api/roommates/[id]/like - TOGGLE LIKE
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== POST /api/roommates/[id]/like [${requestId}] ===`)
  
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

    // Verificar autenticación (requerida para likes)
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

    // Verificar que el roommate existe y está publicado
    const { data: existingRoommate, error: fetchError } = await supabase
      .from('roommate_posts')
      .select('id, status, is_active, likes_count, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRoommate) {
      console.log(`[${requestId}] Roommate no encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Roommate no encontrado' },
        { status: 404 }
      )
    }

    // Solo permitir likes en roommates publicados y activos
    if (existingRoommate.status !== 'PUBLISHED' || !existingRoommate.is_active) {
      console.log(`[${requestId}] Roommate no está disponible para likes`)
      return NextResponse.json(
        { error: 'Roommate no disponible' },
        { status: 404 }
      )
    }

    // No permitir que el dueño se dé like a sí mismo
    if (existingRoommate.user_id === authenticatedUser.id) {
      console.log(`[${requestId}] Usuario no puede dar like a su propio roommate`)
      return NextResponse.json(
        { error: 'No puedes dar like a tu propio post' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un like del usuario
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('roommate_likes')
      .select('id')
      .eq('roommate_post_id', id)
      .eq('user_id', authenticatedUser.id)
      .single()

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error(`[${requestId}] Error verificando like existente:`, likeCheckError)
      return NextResponse.json(
        { error: 'Error al verificar like' },
        { status: 500 }
      )
    }

    let action: 'liked' | 'unliked'
    let newLikesCount = existingRoommate.likes_count || 0

    if (existingLike) {
      // Ya existe like, removerlo (unlike)
      console.log(`[${requestId}] Removiendo like existente`)
      
      const { error: deleteError } = await supabase
        .from('roommate_likes')
        .delete()
        .eq('roommate_post_id', id)
        .eq('user_id', authenticatedUser.id)

      if (deleteError) {
        console.error(`[${requestId}] Error removiendo like:`, deleteError)
        return NextResponse.json(
          { error: 'Error al remover like' },
          { status: 500 }
        )
      }

      // Decrementar contador
      newLikesCount = Math.max(0, newLikesCount - 1)
      action = 'unliked'

    } else {
      // No existe like, crearlo
      console.log(`[${requestId}] Creando nuevo like`)
      
      const { error: insertError } = await supabase
        .from('roommate_likes')
        .insert({
          roommate_post_id: id,
          user_id: authenticatedUser.id,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error(`[${requestId}] Error creando like:`, insertError)
        return NextResponse.json(
          { error: 'Error al crear like' },
          { status: 500 }
        )
      }

      // Incrementar contador
      newLikesCount = newLikesCount + 1
      action = 'liked'
    }

    // Actualizar contador en roommate_posts
    const { error: updateError } = await supabase
      .from('roommate_posts')
      .update({
        likes_count: newLikesCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error(`[${requestId}] Error actualizando contador de likes:`, updateError)
      // No fallar completamente, el like/unlike ya se procesó
      console.warn(`[${requestId}] Contador de likes puede estar desincronizado`)
    }

    console.log(`[${requestId}] Like ${action} exitosamente. Nuevo count: ${newLikesCount}`)

    return NextResponse.json({
      success: true,
      action,
      likesCount: newLikesCount,
      isLiked: action === 'liked',
      message: `${action === 'liked' ? 'Like agregado' : 'Like removido'} exitosamente`,
      meta: {
        requestId,
        action: 'like-toggle'
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
