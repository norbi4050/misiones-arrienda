import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema para obtener matches
const getMatchesSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional(),
  status: z.enum(['active', 'archived']).optional()
})

// Schema para procesar match automático
const processMatchSchema = z.object({
  userId: z.string().min(1, 'ID del usuario es requerido')
})

// GET /api/comunidad/matches - Obtener matches del usuario
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
    const status = searchParams.get('status') || 'active'

    const params = getMatchesSchema.parse({ page, limit, status })

    // Calcular offset para paginación
    const offset = (params.page! - 1) * params.limit!

    // Obtener matches donde el usuario es user1 o user2
    let query = supabase
      .from('community_matches')
      .select(`
        id,
        created_at,
        status,
        last_message_at,
        user1_id,
        user2_id,
        user1:user1_id (
          id,
          name,
          avatar,
          community_profiles (
            id,
            role,
            city,
            neighborhood,
            budget_min,
            budget_max,
            bio,
            photos,
            age,
            tags
          )
        ),
        user2:user2_id (
          id,
          name,
          avatar,
          community_profiles (
            id,
            role,
            city,
            neighborhood,
            budget_min,
            budget_max,
            bio,
            photos,
            age,
            tags
          )
        )
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    if (params.status) {
      query = query.eq('status', params.status)
    }

    const { data: matches, error: matchesError } = await query
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + params.limit! - 1)

    if (matchesError) {
      console.error('Error fetching matches:', matchesError)
      return NextResponse.json(
        { error: 'Error al obtener matches' },
        { status: 500 }
      )
    }

    // Procesar matches para mostrar el otro usuario
    const processedMatches = matches?.map(match => {
      const otherUser = match.user1_id === user.id ? match.user2 : match.user1
      const otherUserData = Array.isArray(otherUser) ? otherUser[0] : otherUser
      return {
        id: match.id,
        created_at: match.created_at,
        status: match.status,
        last_message_at: match.last_message_at,
        user: otherUserData,
        profile: otherUserData?.community_profiles?.[0] || null
      }
    }) || []

    // Obtener total para paginación
    const { count, error: countError } = await supabase
      .from('community_matches')
      .select('*', { count: 'exact', head: true })
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', params.status || 'active')

    const total = count || 0
    const totalPages = Math.ceil(total / params.limit!)

    return NextResponse.json({
      matches: processedMatches,
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
    console.error('Error in matches GET:', error)

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

// POST /api/comunidad/matches - Procesar match automático
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
    const { userId } = processMatchSchema.parse(body)

    // Verificar que no se esté haciendo match consigo mismo
    if (user.id === userId) {
      return NextResponse.json(
        { error: 'No puedes hacer match contigo mismo' },
        { status: 400 }
      )
    }

    // Verificar que ambos usuarios tengan perfiles de comunidad
    const { data: userProfile } = await supabase
      .from('community_profiles')
      .select('id, role, city')
      .eq('user_id', user.id)
      .single()

    const { data: targetProfile } = await supabase
      .from('community_profiles')
      .select('id, role, city')
      .eq('user_id', userId)
      .single()

    if (!userProfile || !targetProfile) {
      return NextResponse.json(
        { error: 'Ambos usuarios deben tener perfiles de comunidad' },
        { status: 400 }
      )
    }

    // Verificar compatibilidad básica (roles complementarios)
    const rolesCompatible = (
      (userProfile.role === 'BUSCO' && targetProfile.role === 'OFREZCO') ||
      (userProfile.role === 'OFREZCO' && targetProfile.role === 'BUSCO')
    )

    if (!rolesCompatible) {
      return NextResponse.json(
        { error: 'Los perfiles no son compatibles' },
        { status: 400 }
      )
    }

    // Verificar que no exista ya un match
    const { data: existingMatch } = await supabase
      .from('community_matches')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
      .single()

    if (existingMatch) {
      return NextResponse.json(
        { error: 'Ya existe un match entre estos usuarios' },
        { status: 400 }
      )
    }

    // Verificar que ambos se hayan dado like mutuamente
    const { data: like1 } = await supabase
      .from('community_likes')
      .select('id')
      .eq('from_user_id', user.id)
      .eq('to_user_id', userId)
      .single()

    const { data: like2 } = await supabase
      .from('community_likes')
      .select('id')
      .eq('from_user_id', userId)
      .eq('to_user_id', user.id)
      .single()

    if (!like1 || !like2) {
      return NextResponse.json(
        { error: 'Ambos usuarios deben haberse dado like mutuamente' },
        { status: 400 }
      )
    }

    // Crear el match
    const { data: newMatch, error: matchError } = await supabase
      .from('community_matches')
      .insert({
        user1_id: user.id,
        user2_id: userId,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        created_at,
        status,
        user1:user1_id (
          id,
          name,
          avatar
        ),
        user2:user2_id (
          id,
          name,
          avatar
        )
      `)
      .single()

    if (matchError) {
      console.error('Error creating match:', matchError)
      return NextResponse.json(
        { error: 'Error al crear match' },
        { status: 500 }
      )
    }

    // Crear conversación inicial
    const { data: conversation, error: conversationError } = await supabase
      .from('community_conversations')
      .insert({
        match_id: newMatch.id,
        user1_id: user.id,
        user2_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      // No retornamos error porque el match se creó correctamente
    }

    return NextResponse.json({
      success: true,
      match: newMatch,
      conversation: conversation || null,
      message: '¡Match creado! Ahora pueden comenzar a chatear.'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in matches POST:', error)

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

// PUT /api/comunidad/matches - Actualizar estado de match
export async function PUT(request: NextRequest) {
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
    const { matchId, status } = z.object({
      matchId: z.string().min(1),
      status: z.enum(['active', 'archived', 'blocked'])
    }).parse(body)

    // Verificar que el usuario sea parte del match
    const { data: match, error: matchError } = await supabase
      .from('community_matches')
      .select('id, user1_id, user2_id')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match no encontrado' },
        { status: 404 }
      )
    }

    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este match' },
        { status: 403 }
      )
    }

    // Actualizar el estado del match
    const { data: updatedMatch, error: updateError } = await supabase
      .from('community_matches')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating match:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar match' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      message: `Match ${status === 'archived' ? 'archivado' : status === 'blocked' ? 'bloqueado' : 'activado'} correctamente`
    })

  } catch (error) {
    console.error('Error in matches PUT:', error)

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
