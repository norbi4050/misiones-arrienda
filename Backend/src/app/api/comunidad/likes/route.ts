import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema de validación para likes
const likeSchema = z.object({
  toId: z.string().min(1, 'ID del perfil es requerido')
})

// Schema para obtener likes
const getLikesSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional()
})

// POST /api/comunidad/likes - Dar like a un perfil
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { toId } = likeSchema.parse(body)

    // Verificar que no se esté dando like a sí mismo
    if (user.id === toId) {
      return NextResponse.json(
        { error: 'No puedes dar like a tu propio perfil' },
        { status: 400 }
      )
    }

    // Verificar que el perfil de destino existe
    const { data: targetProfile, error: profileError } = await supabase
      .from('community_profiles')
      .select('id, user_id')
      .eq('user_id', toId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya existe el like
    const { data: existingLike } = await supabase
      .from('community_likes')
      .select('id')
      .eq('from_user_id', user.id)
      .eq('to_user_id', toId)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { error: 'Ya has dado like a este perfil' },
        { status: 400 }
      )
    }

    // Crear el like
    const { data: newLike, error: likeError } = await supabase
      .from('community_likes')
      .insert({
        from_user_id: user.id,
        to_user_id: toId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (likeError) {
      console.error('Error creating like:', likeError)
      return NextResponse.json(
        { error: 'Error al dar like' },
        { status: 500 }
      )
    }

    // Verificar si hay match (like mutuo)
    const { data: reciprocalLike } = await supabase
      .from('community_likes')
      .select('id')
      .eq('from_user_id', toId)
      .eq('to_user_id', user.id)
      .single()

    let matched = false
    if (reciprocalLike) {
      // Crear match
      const { error: matchError } = await supabase
        .from('community_matches')
        .insert({
          user1_id: user.id,
          user2_id: toId,
          created_at: new Date().toISOString()
        })

      if (!matchError) {
        matched = true
      }
    }

    return NextResponse.json({
      success: true,
      like: newLike,
      matched
    }, { status: 201 })

  } catch (error) {
    console.error('Error in likes POST:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/comunidad/likes - Obtener likes del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || 'given' // 'given' or 'received'

    const params = getLikesSchema.parse({ page, limit })

    // Calcular offset para paginación
    const offset = (params.page! - 1) * params.limit!

    let query = supabase
      .from('community_likes')
      .select(`
        id,
        created_at,
        ${type === 'given' ? 'to_user_id' : 'from_user_id'} as user_id,
        profiles:${type === 'given' ? 'to_user_id' : 'from_user_id'} (
          id,
          role,
          city,
          neighborhood,
          budget_min,
          budget_max,
          bio,
          photos,
          age,
          tags,
          users (
            id,
            name,
            avatar
          )
        )
      `)

    if (type === 'given') {
      query = query.eq('from_user_id', user.id)
    } else {
      query = query.eq('to_user_id', user.id)
    }

    const { data: likes, error: likesError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + params.limit! - 1)

    if (likesError) {
      console.error('Error fetching likes:', likesError)
      return NextResponse.json(
        { error: 'Error al obtener likes' },
        { status: 500 }
      )
    }

    // Obtener total para paginación
    const { count, error: countError } = await supabase
      .from('community_likes')
      .select('*', { count: 'exact', head: true })
      .eq(type === 'given' ? 'from_user_id' : 'to_user_id', user.id)

    const total = count || 0
    const totalPages = Math.ceil(total / params.limit!)

    return NextResponse.json({
      likes,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNextPage: params.page! < totalPages,
        hasPrevPage: params.page! > 1
      }
    })

  } catch (error) {
    console.error('Error in likes GET:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/comunidad/likes - Quitar like
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { toId } = likeSchema.parse(body)

    // Eliminar el like
    const { error: deleteError } = await supabase
      .from('community_likes')
      .delete()
      .eq('from_user_id', user.id)
      .eq('to_user_id', toId)

    if (deleteError) {
      console.error('Error deleting like:', deleteError)
      return NextResponse.json(
        { error: 'Error al quitar like' },
        { status: 500 }
      )
    }

    // Si había un match, eliminarlo también
    const { error: matchDeleteError } = await supabase
      .from('community_matches')
      .delete()
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${toId}),and(user1_id.eq.${toId},user2_id.eq.${user.id})`)

    if (matchDeleteError) {
      console.error('Error deleting match:', matchDeleteError)
      // No retornamos error aquí porque el like se eliminó correctamente
    }

    return NextResponse.json({
      success: true,
      message: 'Like eliminado correctamente'
    })

  } catch (error) {
    console.error('Error in likes DELETE:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
