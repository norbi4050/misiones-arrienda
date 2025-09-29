import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema de validación para bloqueos
const blockSchema = z.object({
  blockedUserId: z.string().min(1, 'ID del usuario es requerido')
})

// Schema para obtener bloqueos
const getBlocksSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional()
})

// POST /api/comunidad/blocks - Bloquear usuario
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
    const { blockedUserId } = blockSchema.parse(body)

    // Verificar que no se esté bloqueando a sí mismo
    if (user.id === blockedUserId) {
      return NextResponse.json(
        { error: 'No puedes bloquearte a ti mismo' },
        { status: 400 }
      )
    }

    // Verificar que el usuario a bloquear existe
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', blockedUserId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya está bloqueado
    const { data: existingBlock } = await supabase
      .from('community_blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedUserId)
      .single()

    if (existingBlock) {
      return NextResponse.json(
        { error: 'Usuario ya está bloqueado' },
        { status: 400 }
      )
    }

    // Crear el bloqueo
    const { data: newBlock, error: blockError } = await supabase
      .from('community_blocks')
      .insert({
        blocker_id: user.id,
        blocked_id: blockedUserId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (blockError) {
      console.error('Error creating block:', blockError)
      return NextResponse.json(
        { error: 'Error al bloquear usuario' },
        { status: 500 }
      )
    }

    // Eliminar likes y matches existentes entre los usuarios
    await supabase
      .from('community_likes')
      .delete()
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${blockedUserId}),and(from_user_id.eq.${blockedUserId},to_user_id.eq.${user.id})`)

    await supabase
      .from('community_post_likes')
      .delete()
      .or(`and(liker_id.eq.${user.id},post_id.in.(select id from community_posts where user_id = '${blockedUserId}')),and(liker_id.eq.${blockedUserId},post_id.in.(select id from community_posts where user_id = '${user.id}'))`)

    await supabase
      .from('community_matches')
      .update({ status: 'blocked' })
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${blockedUserId}),and(user1_id.eq.${blockedUserId},user2_id.eq.${user.id})`)

    return NextResponse.json({
      success: true,
      block: newBlock,
      message: 'Usuario bloqueado correctamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in block user:', error)
    
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

// GET /api/comunidad/blocks - Obtener usuarios bloqueados
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

    const params = getBlocksSchema.parse({ page, limit })

    // Calcular offset para paginación
    const offset = (params.page! - 1) * params.limit!

    // Obtener usuarios bloqueados
    const { data: blocks, error: blocksError } = await supabase
      .from('community_blocks')
      .select(`
        id,
        created_at,
        blocked_user:blocked_id (
          id,
          name,
          avatar
        )
      `)
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + params.limit! - 1)

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError)
      return NextResponse.json(
        { error: 'Error al obtener usuarios bloqueados' },
        { status: 500 }
      )
    }

    // Obtener total para paginación
    const { count, error: countError } = await supabase
      .from('community_blocks')
      .select('*', { count: 'exact', head: true })
      .eq('blocker_id', user.id)

    const total = count || 0
    const totalPages = Math.ceil(total / params.limit!)

    return NextResponse.json({
      blocks,
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
    console.error('Error in blocks GET:', error)
    
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

// DELETE /api/comunidad/blocks - Desbloquear usuario
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
    const { blockedUserId } = blockSchema.parse(body)

    // Eliminar el bloqueo
    const { error: deleteError } = await supabase
      .from('community_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedUserId)

    if (deleteError) {
      console.error('Error deleting block:', deleteError)
      return NextResponse.json(
        { error: 'Error al desbloquear usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario desbloqueado correctamente'
    })

  } catch (error) {
    console.error('Error in unblock user:', error)
    
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
