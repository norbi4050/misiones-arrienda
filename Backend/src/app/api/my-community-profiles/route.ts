import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema para filtros de búsqueda
const searchSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(20),
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE']).optional().default('ALL')
})

// GET /api/my-community-profiles - Obtener perfiles de comunidad del usuario autenticado
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/my-community-profiles [${requestId}] ===`)

  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log(`[${requestId}] Usuario no autenticado`)
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log(`[${requestId}] Usuario autenticado:`, user.id)

    // Parsear parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const params = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      status: searchParams.get('status') || 'ALL'
    }

    // Validar parámetros
    const validatedParams = searchSchema.parse(params)

    console.log(`[${requestId}] Parámetros:`, validatedParams)

    // Construir query para obtener perfiles de comunidad del usuario
    // Nota: Según el schema de Prisma, UserProfile se mapea a user_profiles
    let query = supabase
      .from('user_profiles')
      .select(`
        id, role, city, neighborhood, budget_min, budget_max, bio, photos,
        age, pet_pref, smoke_pref, diet, tags, highlighted_until,
        created_at, updated_at,
        users!inner(id, name, avatar)
      `)
      .eq('user_id', user.id)  // Solo perfiles del usuario autenticado

    // Aplicar filtro de estado si no es 'ALL'
    // Nota: UserProfile no tiene campo 'status', usar is_suspended en su lugar
    if (validatedParams.status !== 'ALL') {
      if (validatedParams.status === 'INACTIVE') {
        query = query.eq('is_suspended', true)
      } else {
        query = query.eq('is_suspended', false)
      }
    }

    // Aplicar ordenamiento por fecha de actualización
    query = query.order('updated_at', { ascending: false })

    // Calcular offset para paginación
    const page = validatedParams.page ?? 1
    const limit = validatedParams.limit ?? 20
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Ejecutar consulta
    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      console.error(`[${requestId}] Error obteniendo perfiles:`, profilesError)
      
      // Si la tabla no existe, devolver array vacío en lugar de error
      if (profilesError.code === '42P01') {
        console.log(`[${requestId}] Tabla community_profiles no existe, devolviendo array vacío`)
        return NextResponse.json({
          profiles: [],
          pagination: {
            page: page,
            limit: limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          filters: {
            status: validatedParams.status || 'ALL'
          }
        })
      }

      return NextResponse.json(
        { error: 'Error al obtener perfiles de comunidad' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Perfiles encontrados:`, profiles?.length || 0)

    // Procesar perfiles para respuesta
    const processedProfiles = (profiles || []).map((profile: any) => {
      // Procesar fotos
      let photos = []
      if (profile.photos) {
        try {
          photos = JSON.parse(profile.photos)
          if (!Array.isArray(photos)) photos = []
        } catch (e) {
          console.log(`[${requestId}] Error parseando photos para ${profile.id}`)
          photos = []
        }
      }

      // Procesar tags
      let tags = []
      if (profile.tags) {
        try {
          tags = JSON.parse(profile.tags)
          if (!Array.isArray(tags)) tags = []
        } catch (e) {
          console.log(`[${requestId}] Error parseando tags para ${profile.id}`)
          tags = []
        }
      }

      return {
        id: profile.id,
        role: profile.role,
        city: profile.city,
        neighborhood: profile.neighborhood,
        budgetMin: profile.budget_min,
        budgetMax: profile.budget_max,
        bio: profile.bio,
        photos: photos,
        age: profile.age,
        petPref: profile.pet_pref,
        smokePref: profile.smoke_pref,
        diet: profile.diet,
        tags: tags,
        status: profile.is_suspended ? 'INACTIVE' : 'ACTIVE',
        highlightedUntil: profile.highlighted_until,
        user: {
          id: profile.users.id,
          name: profile.users.name,
          avatar: profile.users.avatar,
          rating: profile.users.rating || 5.0,
          reviewCount: profile.users.review_count || 0
        },
        _count: {
          likesReceived: 0 // TODO: Implementar conteo real de likes
        },
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    })

    // Obtener total para paginación
    let countQuery = supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (validatedParams.status !== 'ALL') {
      if (validatedParams.status === 'INACTIVE') {
        countQuery = countQuery.eq('is_suspended', true)
      } else {
        countQuery = countQuery.eq('is_suspended', false)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`[${requestId}] Error obteniendo total:`, countError)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    console.log(`[${requestId}] Total perfiles: ${total}, Páginas: ${totalPages}`)

    return NextResponse.json({
      profiles: processedProfiles,
      pagination: {
        page: page,
        limit: limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        status: validatedParams.status || 'ALL'
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

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

// PUT /api/my-community-profiles - Actualizar perfil específico del usuario
export async function PUT(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== PUT /api/my-community-profiles [${requestId}] ===`)

  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log(`[${requestId}] Usuario no autenticado`)
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    console.log(`[${requestId}] Actualizando perfil ${id} para usuario ${user.id}`)

    // Actualizar perfil en la base de datos
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)  // Asegurar que solo actualice perfiles del usuario
      .select()
      .single()

    if (updateError) {
      console.error(`[${requestId}] Error actualizando perfil:`, updateError)
      return NextResponse.json(
        { error: 'Error al actualizar perfil' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Perfil actualizado exitosamente`)
    return NextResponse.json(updatedProfile)

  } catch (error) {
    console.error(`[${requestId}] Error general:`, error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/my-community-profiles - Eliminar perfil específico del usuario
export async function DELETE(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== DELETE /api/my-community-profiles [${requestId}] ===`)

  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log(`[${requestId}] Usuario no autenticado`)
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Eliminando perfil ${id} para usuario ${user.id}`)

    // Eliminar perfil de la base de datos
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)  // Asegurar que solo elimine perfiles del usuario

    if (deleteError) {
      console.error(`[${requestId}] Error eliminando perfil:`, deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar perfil' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Perfil eliminado exitosamente`)
    return NextResponse.json({ 
      success: true, 
      message: 'Perfil eliminado exitosamente' 
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
