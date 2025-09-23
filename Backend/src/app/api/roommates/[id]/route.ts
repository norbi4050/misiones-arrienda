import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { transformRoommateFromDB } from '@/types/roommate'

// GET /api/roommates/[id] - DETALLE POR ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/roommates/[id] [${requestId}] ===`)

  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de roommate requerido' },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Buscando roommate por ID: ${id}`)

    const supabase = getSupabaseBrowser()

    // Buscar roommate por ID
    const { data: roommates, error } = await supabase
      .from('roommate_posts')
      .select(`
        id, title, description, city, province, room_type,
        monthly_rent, available_from, preferences, images,
        status, is_active, likes_count, views_count, slug,
        created_at, updated_at, published_at, images_urls, user_id
      `)
      .eq('id', id)
      .limit(1)

    if (error) {
      console.error(`[${requestId}] Error de Supabase:`, error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }

    if (!roommates || roommates.length === 0) {
      console.log(`[${requestId}] Roommate no encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Roommate no encontrado' },
        { status: 404 }
      )
    }

    const roommate = roommates[0]
    console.log(`[${requestId}] Roommate encontrado:`, roommate.title)

    // Transformar datos para frontend
    const transformedRoommate = transformRoommateFromDB(roommate)

    return NextResponse.json({
      roommate: transformedRoommate,
      meta: {
        requestId,
        resolvedBy: 'id'
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error inesperado:`, error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/roommates/[id] - EDITAR ROOMMATE
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const supabase = getSupabaseBrowser()

    // Verificar que el roommate existe
    const { data: existingRoommate, error: fetchError } = await supabase
      .from('roommate_posts')
      .select('id, title, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRoommate) {
      return NextResponse.json(
        { error: 'Roommate no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Mapear campos del frontend al backend
    if (body.title) updateData.title = body.title
    if (body.description) updateData.description = body.description
    if (body.city) updateData.city = body.city
    if (body.province) updateData.province = body.province
    if (body.roomType) updateData.room_type = body.roomType
    if (body.monthlyRent) updateData.monthly_rent = body.monthlyRent
    if (body.availableFrom) updateData.available_from = body.availableFrom
    if (body.preferences) updateData.preferences = body.preferences
    if (body.images) updateData.images = body.images
    if (body.imagesUrls) updateData.images_urls = body.imagesUrls
    if (body.status) updateData.status = body.status

    // Regenerar slug si cambió el título
    if (body.title && body.title !== existingRoommate.title) {
      const { generateRoommateSlug } = await import('@/lib/validations/roommate')
      updateData.slug = generateRoommateSlug(body.title, id)
    }

    // Actualizar en base de datos
    const { data: updatedRoommate, error: updateError } = await supabase
      .from('roommate_posts')
      .update(updateData)
      .eq('id', id)
      .select(`
        id, title, description, city, province, room_type,
        monthly_rent, available_from, preferences, images,
        status, is_active, likes_count, views_count, slug,
        created_at, updated_at, published_at, images_urls, user_id
      `)
      .single()

    if (updateError) {
      console.error('Error actualizando roommate:', updateError)
      return NextResponse.json(
        { error: 'Error actualizando roommate' },
        { status: 500 }
      )
    }

    // Transformar datos para frontend
    const transformedRoommate = transformRoommateFromDB(updatedRoommate)

    return NextResponse.json({
      roommate: transformedRoommate,
      message: 'Roommate actualizado exitosamente'
    })

  } catch (error) {
    console.error('Error en PATCH /api/roommates/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
