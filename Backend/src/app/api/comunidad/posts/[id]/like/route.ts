import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/comunidad/posts/[id]/like - Dar like a un post
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const postId = params.id

    // Verificar que el post existe y está activo
    const { data: post, error: postError } = await supabase
      .from('community_posts_public')
      .select('id, user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no se esté dando like a su propio post
    if (user.id === post.user_id) {
      return NextResponse.json(
        { error: 'No puedes dar like a tu propio post' },
        { status: 400 }
      )
    }

    // Verificar si ya existe el like
    const { data: existingLike } = await supabase
      .from('community_post_likes')
      .select('id')
      .eq('liker_id', user.id)
      .eq('post_id', postId)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { error: 'Ya has dado like a este post' },
        { status: 400 }
      )
    }

    // Crear el like
    const { data: newLike, error: likeError } = await supabase
      .from('community_post_likes')
      .insert({
        liker_id: user.id,
        post_id: postId,
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

    // Verificar si hay like recíproco (el autor del post dio like a algún post del usuario actual)
    const { data: reciprocalLike } = await supabase
      .from('community_post_likes')
      .select('post_id')
      .eq('liker_id', post.user_id)
      .in('post_id', [
        // Buscar posts del usuario actual que el autor haya likeado
        supabase
          .from('community_posts')
          .select('id')
          .eq('user_id', user.id)
      ])
      .single()

    let matched = false
    if (reciprocalLike) {
      // Verificar que no exista ya un match
      const { data: existingMatch } = await supabase
        .from('community_matches')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${post.user_id}),and(user1_id.eq.${post.user_id},user2_id.eq.${user.id})`)
        .single()

      if (!existingMatch) {
        // Crear match
        const { error: matchError } = await supabase
          .from('community_matches')
          .insert({
            user1_id: user.id,
            user2_id: post.user_id,
            status: 'active',
            created_at: new Date().toISOString()
          })

        if (!matchError) {
          matched = true
        }
      }
    }

    return NextResponse.json({
      success: true,
      liked: true,
      matched,
      message: matched ? '¡Hay match! Ahora pueden chatear.' : 'Like enviado correctamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in post like:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/comunidad/posts/[id]/like - Quitar like a un post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const postId = params.id

    // Eliminar el like
    const { error: deleteError } = await supabase
      .from('community_post_likes')
      .delete()
      .eq('liker_id', user.id)
      .eq('post_id', postId)

    if (deleteError) {
      console.error('Error deleting like:', deleteError)
      return NextResponse.json(
        { error: 'Error al quitar like' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      liked: false,
      message: 'Like eliminado correctamente'
    })

  } catch (error) {
    console.error('Error in delete post like:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
