import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema para actualizar perfil
const updateProfileSchema = z.object({
  role: z.enum(['BUSCO', 'OFREZCO']).optional(),
  city: z.string().min(1).optional(),
  neighborhood: z.string().min(1).optional(),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  bio: z.string().max(500).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
  age: z.number().min(18).max(100).optional(),
  tags: z.array(z.string()).max(10).optional(),
  preferences: z.object({
    pet_friendly: z.boolean().optional(),
    smoking_allowed: z.boolean().optional(),
    furnished: z.boolean().optional(),
    shared_spaces: z.boolean().optional()
  }).optional()
})

// GET /api/comunidad/profiles/[id] - Obtener perfil específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Obtener el perfil específico
    const { data: profile, error: profileError } = await supabase
      .from('community_profiles')
      .select(`
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
        preferences,
        created_at,
        updated_at,
        user:user_id (
          id,
          name,
          avatar
        )
      `)
      .eq('id', id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Procesar datos del usuario
    const userData = Array.isArray(profile.user) ? profile.user[0] : profile.user

    // Verificar si el usuario actual ya dio like a este perfil
    let hasLiked = false
    let hasMatch = false

    if (userData?.id !== user.id) {
      // Verificar like
      const { data: like } = await supabase
        .from('community_likes')
        .select('id')
        .eq('from_user_id', user.id)
        .eq('to_user_id', userData?.id)
        .single()

      hasLiked = !!like

      // Verificar match
      const { data: match } = await supabase
        .from('community_matches')
        .select('id, status')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${userData?.id}),and(user1_id.eq.${userData?.id},user2_id.eq.${user.id})`)
        .eq('status', 'active')
        .single()

      hasMatch = !!match
    }

    // Obtener estadísticas del perfil
    const { data: stats } = await supabase
      .from('community_likes')
      .select('id', { count: 'exact' })
      .eq('to_user_id', userData?.id)

    const likesReceived = stats?.length || 0

    return NextResponse.json({
      profile: {
        ...profile,
        user: userData,
        stats: {
          likes_received: likesReceived
        },
        interaction: {
          has_liked: hasLiked,
          has_match: hasMatch,
          is_own_profile: userData?.id === user.id
        }
      }
    })

  } catch (error) {
    console.error('Error in profile GET:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/comunidad/profiles/[id] - Actualizar perfil
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    const updateData = updateProfileSchema.parse(body)

    // Verificar que el perfil existe y pertenece al usuario
    const { data: existingProfile, error: profileError } = await supabase
      .from('community_profiles')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (profileError || !existingProfile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    if (existingProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este perfil' },
        { status: 403 }
      )
    }

    // Validar budget si se proporciona
    if (updateData.budget_min && updateData.budget_max && updateData.budget_min > updateData.budget_max) {
      return NextResponse.json(
        { error: 'El presupuesto mínimo no puede ser mayor al máximo' },
        { status: 400 }
      )
    }

    // Actualizar el perfil
    const { data: updatedProfile, error: updateError } = await supabase
      .from('community_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
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
        preferences,
        created_at,
        updated_at,
        user:user_id (
          id,
          name,
          avatar
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...updatedProfile,
        user: Array.isArray(updatedProfile.user) ? updatedProfile.user[0] : updatedProfile.user
      }
    })

  } catch (error) {
    console.error('Error in profile PUT:', error)
    
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

// DELETE /api/comunidad/profiles/[id] - Eliminar perfil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Verificar que el perfil existe y pertenece al usuario
    const { data: existingProfile, error: profileError } = await supabase
      .from('community_profiles')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (profileError || !existingProfile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    if (existingProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este perfil' },
        { status: 403 }
      )
    }

    // Eliminar likes relacionados
    await supabase
      .from('community_likes')
      .delete()
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)

    // Eliminar matches relacionados
    await supabase
      .from('community_matches')
      .delete()
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    // Eliminar conversaciones relacionadas
    await supabase
      .from('community_conversations')
      .delete()
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    // Eliminar el perfil
    const { error: deleteError } = await supabase
      .from('community_profiles')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting profile:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil eliminado correctamente'
    })

  } catch (error) {
    console.error('Error in profile DELETE:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
