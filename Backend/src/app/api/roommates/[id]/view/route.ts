import { NextRequest, NextResponse } from 'next/server'

// =====================================================
// POST /api/roommates/[id]/view - INCREMENTAR VISTAS
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== POST /api/roommates/[id]/view [${requestId}] ===`)
  
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

    console.log(`[${requestId}] Incrementando vista para roommate: ${id}`)

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
      .select('id, status, is_active, views_count')
      .eq('id', id)
      .single()

    if (fetchError || !existingRoommate) {
      console.log(`[${requestId}] Roommate no encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Roommate no encontrado' },
        { status: 404 }
      )
    }

    // Solo incrementar vistas si está publicado y activo
    if (existingRoommate.status !== 'PUBLISHED' || !existingRoommate.is_active) {
      console.log(`[${requestId}] Roommate no está disponible para vistas`)
      return NextResponse.json(
        { error: 'Roommate no disponible' },
        { status: 404 }
      )
    }

    // Llamar función RPC para incrementar vista
    const { error: rpcError } = await supabase
      .rpc('roommate_increment_view', { post_id: id })

    if (rpcError) {
      console.error(`[${requestId}] Error incrementando vista:`, rpcError)
      return NextResponse.json(
        { error: 'Error al incrementar vista' },
        { status: 500 }
      )
    }

    // Obtener el nuevo count de vistas
    const { data: updatedRoommate, error: updateError } = await supabase
      .from('roommate_posts')
      .select('views_count')
      .eq('id', id)
      .single()

    const newViewsCount = updatedRoommate?.views_count || (existingRoommate.views_count || 0) + 1

    console.log(`[${requestId}] Vista incrementada exitosamente. Nuevo count: ${newViewsCount}`)

    return NextResponse.json({
      success: true,
      viewsCount: newViewsCount,
      message: 'Vista registrada exitosamente',
      meta: {
        requestId,
        action: 'view'
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
