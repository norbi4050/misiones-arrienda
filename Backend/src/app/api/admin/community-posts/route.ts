import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { isCurrentUserAdmin } from '@/lib/admin-auth'

// Service Role Client para bypass de RLS
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

// GET /api/admin/community-posts - Listar todas las publicaciones de comunidad (admin)
export async function GET(request: NextRequest) {
  try {
    console.log('[API /admin/community-posts GET] Request started')

    // Verificar permisos de admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      console.log('[API /admin/community-posts GET] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('[API /admin/community-posts GET] Admin verified')

    const { searchParams } = new URL(request.url)

    // Parámetros de paginación y filtros
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || 'all'
    const cityFilter = searchParams.get('city') || 'all'
    const statusFilter = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    console.log('[API /admin/community-posts GET] Params:', {
      page, limit, search, roleFilter, cityFilter, statusFilter, sortBy, sortOrder
    })

    // Construir query base usando supabaseAdmin para bypassear RLS
    // Usar SELECT * para obtener todas las columnas disponibles
    let query = supabaseAdmin
      .from('community_posts')
      .select(`*`, { count: 'exact' })

    console.log('[API /admin/community-posts GET] Query initialized')

    // Aplicar filtros
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter)
    }

    if (cityFilter !== 'all') {
      query = query.eq('city', cityFilter)
    }

    // Filtro de estado
    if (statusFilter === 'active') {
      query = query.eq('is_active', true)
    } else if (statusFilter === 'suspended') {
      query = query.eq('is_active', false)
      // Excluir posts eliminados (marcados con [DELETED])
      query = query.not('title', 'like', '[DELETED]%')
    } else if (statusFilter === 'all') {
      // 'all' muestra activos Y suspendidos, pero NO eliminados
      // Excluir posts con [DELETED] en el título
      query = query.not('title', 'like', '[DELETED]%')
    }

    // Ordenamiento
    const orderColumn = sortBy === 'created_at' ? 'created_at' :
                       sortBy === 'likes' ? 'like_count' :
                       sortBy === 'title' ? 'title' :
                       sortBy === 'updated_at' ? 'updated_at' : 'created_at'

    query = query.order(orderColumn, { ascending: sortOrder === 'asc' })

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error, count } = await query

    console.log('[API /admin/community-posts GET] Query result:', {
      postsCount: posts?.length || 0,
      totalCount: count,
      hasError: !!error
    })

    if (error) {
      console.error('[API /admin/community-posts GET] Error fetching posts:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: 'Error fetching community posts', details: error.message },
        { status: 500 }
      )
    }

    // Obtener conteo de reportes y datos de usuario para cada post
    const postsWithReports = await Promise.all(
      (posts || []).map(async (post) => {
        // Intentar obtener reportes, pero no fallar si la tabla no existe
        let reportsCount = 0
        try {
          const { count } = await supabaseAdmin
            .from('community_post_report')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
          reportsCount = count || 0
        } catch (err) {
          console.warn('[API /admin/community-posts GET] Could not fetch reports for post:', post.id, err)
        }

        // Obtener datos del usuario
        let user = null
        try {
          const { data } = await supabaseAdmin
            .from('User')
            .select('name, email')
            .eq('id', post.user_id)
            .maybeSingle()
          user = data
        } catch (err) {
          console.warn('[API /admin/community-posts GET] Could not fetch user for post:', post.id, err)
        }

        return {
          ...post,
          user,
          reportsCount
        }
      })
    )

    // Estadísticas generales
    const { count: totalPosts } = await supabaseAdmin
      .from('community_posts')
      .select('*', { count: 'exact', head: true })

    const { count: activePosts } = await supabaseAdmin
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: suspendedPosts } = await supabaseAdmin
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)

    const { count: offerPosts } = await supabaseAdmin
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'OFREZCO')
      .eq('is_active', true)

    const { count: seekPosts } = await supabaseAdmin
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'BUSCO')
      .eq('is_active', true)

    return NextResponse.json({
      posts: postsWithReports,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: {
        total: totalPosts || 0,
        active: activePosts || 0,
        suspended: suspendedPosts || 0,
        offer: offerPosts || 0,
        seek: seekPosts || 0
      }
    })
  } catch (error: any) {
    console.error('[API /admin/community-posts GET] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/community-posts - Acciones sobre publicaciones (suspender, activar, eliminar)
export async function PATCH(request: NextRequest) {
  try {
    console.log('[API /admin/community-posts PATCH] Request started')

    // Verificar permisos de admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      console.log('[API /admin/community-posts PATCH] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { postId, action } = body

    console.log('[API /admin/community-posts PATCH] Action:', { postId, action })

    if (!postId || !action) {
      return NextResponse.json(
        { error: 'postId y action son requeridos' },
        { status: 400 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'suspend':
        updateData = { is_active: false, updated_at: new Date().toISOString() }
        break
      case 'activate':
        updateData = { is_active: true, updated_at: new Date().toISOString() }
        break
      case 'delete':
        console.log('[API /admin/community-posts PATCH] Deleting post:', postId)

        // El esquema de la base de datos tiene foreign key constraints problemáticos
        // que referencian tablas que no existen. Usamos RPC para ejecutar SQL directo
        // con constraints deshabilitados temporalmente.
        try {
          // Ejecutar DELETE directo usando SQL raw a través de RPC
          // Primero intentamos un delete simple
          const { error: deleteError } = await supabaseAdmin
            .from('community_posts')
            .delete()
            .eq('id', postId)

          if (deleteError) {
            // Si falla por FK constraints, hacemos soft delete
            console.warn('[API /admin/community-posts PATCH] Hard delete failed, trying soft delete:', deleteError)

            // Obtener el post actual para modificar su título
            const { data: currentPost } = await supabaseAdmin
              .from('community_posts')
              .select('title')
              .eq('id', postId)
              .single()

            const { error: softDeleteError } = await supabaseAdmin
              .from('community_posts')
              .update({
                is_active: false,
                title: `[DELETED] ${currentPost?.title || 'Post eliminado'}`,
                updated_at: new Date().toISOString()
              })
              .eq('id', postId)

            if (softDeleteError) {
              console.error('[API /admin/community-posts PATCH] Soft delete also failed:', softDeleteError)
              return NextResponse.json(
                { error: 'Error eliminando publicación', details: softDeleteError.message },
                { status: 500 }
              )
            }

            console.log('[API /admin/community-posts PATCH] Post soft-deleted successfully:', postId)
            return NextResponse.json({
              success: true,
              message: 'Publicación eliminada exitosamente'
            })
          }

          console.log('[API /admin/community-posts PATCH] Post hard-deleted successfully:', postId)
          return NextResponse.json({
            success: true,
            message: 'Publicación eliminada exitosamente'
          })
        } catch (err) {
          console.error('[API /admin/community-posts PATCH] Exception during delete:', err)
          return NextResponse.json(
            { error: 'Error interno al eliminar publicación' },
            { status: 500 }
          )
        }
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    // Actualizar publicación
    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      console.error('[API /admin/community-posts PATCH] Error updating post:', error)
      return NextResponse.json(
        { error: 'Error actualizando publicación', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post: data,
      message: `Publicación ${action === 'suspend' ? 'suspendida' : 'reactivada'} exitosamente`
    })
  } catch (error: any) {
    console.error('[API /admin/community-posts PATCH] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
