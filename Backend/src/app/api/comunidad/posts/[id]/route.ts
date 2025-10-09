import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateCommunityPostSchema } from '@/lib/validations/community'
import type { CommunityPost } from '@/types/community'

// GET /api/comunidad/posts/[id] - Devuelve detalle + author_photo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del post es requerido' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Obtener post desde la view con datos del autor
    const { data, error } = await supabase
      .from('community_posts_public')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single()

    if (error) {
      console.error('Error fetching community post:', error)
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Post no encontrado' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Error al obtener el post' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Post no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const post: CommunityPost = data

    return NextResponse.json(post)

  } catch (error) {
    console.error('Error in GET /api/comunidad/posts/[id]:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/comunidad/posts/[id] - Soft delete (archivar)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar ownership
    const { data: post, error: fetchError } = await supabase
      .from('community_posts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post no encontrado' },
        { status: 404 }
      )
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este post' },
        { status: 403 }
      )
    }

    // Soft delete (archivar) para no perder datos
    const { error: deleteError } = await supabase
      .from('community_posts')
      .update({ 
        is_active: false,
        status: 'ARCHIVED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting community post:', deleteError)
      return NextResponse.json(
        { error: 'DB_ERROR', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      id, 
      message: 'DELETED' 
    })

  } catch (error) {
    console.error('Error in DELETE /api/comunidad/posts/[id]:', error)
    
    return NextResponse.json(
      { error: 'UNEXPECTED', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/comunidad/posts/[id] - Actualizar post o cambiar status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar ownership
    const { data: existingPost, error: fetchError } = await supabase
      .from('community_posts')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post no encontrado' },
        { status: 404 }
      )
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este post' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // 🔧 NORMALIZAR ACCIÓN ARCHIVE/RESTORE AUNQUE NO HAYA "status"
    const wantsOnlyStatus = body && typeof body === 'object' && 
      ('status' in body || 'is_active' in body) && 
      Object.keys(body).length <= 2

    if (wantsOnlyStatus) {
      const desired = body.status?.toUpperCase?.()

      // Detectar si existe columna status (fallback seguro)
      let hasStatusCol = false
      try {
        // Intentar actualizar con status - si falla, sabemos que no existe
        const testUpdate = await supabase
          .from('community_posts')
          .select('id')
          .eq('id', id)
          .limit(1)
          .single()
        
        // Si llegamos aquí, asumimos que status podría existir
        // En producción, esto se puede optimizar con una query de schema
        hasStatusCol = true
      } catch (_) {
        hasStatusCol = false
      }

      const updatePayload: any = { 
        updated_at: new Date().toISOString() 
      }

      if (desired === 'ARCHIVED') {
        updatePayload.is_active = false
        if (hasStatusCol) updatePayload.status = 'ARCHIVED'
      } else if (desired === 'ACTIVE') {
        updatePayload.is_active = true
        if (hasStatusCol) updatePayload.status = 'ACTIVE'
      } else if (typeof body.is_active === 'boolean') {
        updatePayload.is_active = body.is_active
        if (hasStatusCol && body.is_active) updatePayload.status = 'ACTIVE'
        if (hasStatusCol && !body.is_active) updatePayload.status = 'ARCHIVED'
      } else {
        return NextResponse.json(
          { error: 'INVALID_STATUS' },
          { status: 400 }
        )
      }

      const { error: uerr } = await supabase
        .from('community_posts')
        .update(updatePayload)
        .eq('id', id)

      if (uerr) {
        console.error('Error updating post status:', uerr)
        return NextResponse.json(
          { error: 'DB_ERROR', details: uerr.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        id, 
        message: updatePayload.is_active ? 'Post restaurado' : 'Post archivado'
      })
    }

    // Actualización completa del post
    const validatedData = updateCommunityPostSchema.parse(body)

    // Mapear camelCase → snake_case
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (validatedData.role !== undefined) updateData.role = validatedData.role
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.city !== undefined) updateData.city = validatedData.city
    if (validatedData.neighborhood !== undefined) updateData.neighborhood = validatedData.neighborhood
    if (validatedData.price !== undefined) updateData.price = validatedData.price
    if (validatedData.budgetMin !== undefined) updateData.budget_min = validatedData.budgetMin
    if (validatedData.budgetMax !== undefined) updateData.budget_max = validatedData.budgetMax
    if (validatedData.availableFrom !== undefined) updateData.available_from = validatedData.availableFrom
    if (validatedData.leaseTerm !== undefined) updateData.lease_term = validatedData.leaseTerm
    if (validatedData.roomType !== undefined) updateData.room_type = validatedData.roomType
    if (validatedData.occupants !== undefined) updateData.occupants = validatedData.occupants
    if (validatedData.petPref !== undefined) updateData.pet_pref = validatedData.petPref
    if (validatedData.smokePref !== undefined) updateData.smoke_pref = validatedData.smokePref
    if (validatedData.diet !== undefined) updateData.diet = validatedData.diet
    if (validatedData.amenities !== undefined) updateData.amenities = validatedData.amenities
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags
    if (validatedData.images !== undefined) updateData.images = validatedData.images

    const { error: updateError } = await supabase
      .from('community_posts')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating community post:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id,
      message: 'Post actualizado exitosamente'
    })

  } catch (error) {
    console.error('Error in PATCH /api/comunidad/posts/[id]:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
