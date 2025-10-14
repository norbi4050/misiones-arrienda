import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


/**
 * 🕒 CRON JOB: Limpieza Automática de Anuncios Expirados
 * 
 * Este endpoint se ejecuta diariamente (configurado en vercel.json)
 * para marcar anuncios expirados como inactivos.
 * 
 * Funcionalidad:
 * - Busca propiedades con expires_at < now
 * - Cambia status a 'ARCHIVED' y is_active a false
 * - Retorna estadísticas de cuántos anuncios se desactivaron
 * 
 * Seguridad:
 * - Requiere CRON_SECRET en headers para autorización
 * - Solo se ejecuta desde Vercel Cron Jobs
 */

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización del cron job
    const authHeader = request.headers.get('authorization')
    const CRON_SECRET = process.env.CRON_SECRET
    
    if (!CRON_SECRET) {
      console.error('❌ CRON_SECRET no configurado en variables de entorno')
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      console.warn('⚠️ Intento de acceso no autorizado al cron de expiración')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🕒 Iniciando limpieza de anuncios expirados...')

    const supabase = createClient()
    const now = new Date().toISOString()

    // 1️⃣ Buscar PROPIEDADES expiradas que aún están activas
    const { data: expiredProperties, error: findPropsError } = await supabase
      .from('properties')
      .select('id, title, user_id, expires_at')
      .lt('expires_at', now)
      .eq('is_active', true)
      .in('status', ['PUBLISHED', 'AVAILABLE'])

    if (findPropsError) {
      console.error('❌ Error buscando propiedades expiradas:', findPropsError)
    }

    const expiredPropsCount = expiredProperties?.length || 0
    console.log(`📊 Encontradas ${expiredPropsCount} propiedades expiradas`)

    // 2️⃣ Buscar PUBLICACIONES DE COMUNIDAD expiradas que aún están activas
    const { data: expiredCommunityPosts, error: findPostsError } = await supabase
      .from('community_posts')
      .select('id, title, user_id, expires_at')
      .lt('expires_at', now)
      .eq('status', 'active')

    if (findPostsError) {
      console.error('❌ Error buscando posts de comunidad expirados:', findPostsError)
    }

    const expiredPostsCount = expiredCommunityPosts?.length || 0
    console.log(`📊 Encontradas ${expiredPostsCount} publicaciones de comunidad expiradas`)

    const totalExpired = expiredPropsCount + expiredPostsCount

    if (totalExpired === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay anuncios expirados para procesar',
        expired: {
          properties: 0,
          community_posts: 0,
          total: 0
        },
        timestamp: new Date().toISOString()
      })
    }

    // 3️⃣ Marcar PROPIEDADES como archivadas (expiradas)
    if (expiredPropsCount > 0) {
      const { error: updatePropsError } = await supabase
        .from('properties')
        .update({
          status: 'ARCHIVED',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .lt('expires_at', now)
        .eq('is_active', true)
        .in('status', ['PUBLISHED', 'AVAILABLE'])

      if (updatePropsError) {
        console.error('❌ Error actualizando propiedades expiradas:', updatePropsError)
      } else {
        console.log(`✅ ${expiredPropsCount} propiedades marcadas como ARCHIVED`)
      }
    }

    // 4️⃣ Marcar POSTS DE COMUNIDAD como inactivos (expirados)
    if (expiredPostsCount > 0) {
      const { error: updatePostsError } = await supabase
        .from('community_posts')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .lt('expires_at', now)
        .eq('status', 'active')

      if (updatePostsError) {
        console.error('❌ Error actualizando posts de comunidad expirados:', updatePostsError)
      } else {
        console.log(`✅ ${expiredPostsCount} posts de comunidad marcados como inactive`)
      }
    }

    // 5️⃣ Retornar estadísticas de limpieza
    console.log(`✅ Limpieza completada: ${totalExpired} anuncios procesados`)
    
    return NextResponse.json({
      success: true,
      message: `Limpieza completada: ${totalExpired} anuncios expirados procesados`,
      expired: {
        properties: expiredPropsCount,
        community_posts: expiredPostsCount,
        total: totalExpired
      },
      details: {
        properties_archived: expiredProperties?.map(p => ({
          id: p.id,
          title: p.title,
          user_id: p.user_id,
          expires_at: p.expires_at
        })) || [],
        community_posts_deactivated: expiredCommunityPosts?.map(p => ({
          id: p.id,
          title: p.title,
          user_id: p.user_id,
          expires_at: p.expires_at
        })) || []
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error inesperado en cron de expiración:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Endpoint GET para verificar el estado (solo para debugging)
export async function GET() {
  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    // Contar propiedades expiradas pero aún activas
    const { count: expiredPropertiesActive } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', now)
      .eq('is_active', true)

    // Contar posts de comunidad expirados pero aún activos
    const { count: expiredPostsActive } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', now)
      .eq('status', 'active')

    // Contar propiedades que expiran pronto (próximos 7 días)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    
    const { count: propertiesExpiringSoon } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .gte('expires_at', now)
      .lte('expires_at', futureDate.toISOString())
      .eq('is_active', true)

    const { count: postsExpiringSoon } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .gte('expires_at', now)
      .lte('expires_at', futureDate.toISOString())
      .eq('status', 'active')

    return NextResponse.json({
      status: 'ok',
      stats: {
        properties: {
          expired_but_active: expiredPropertiesActive || 0,
          expiring_in_7_days: propertiesExpiringSoon || 0
        },
        community_posts: {
          expired_but_active: expiredPostsActive || 0,
          expiring_in_7_days: postsExpiringSoon || 0
        },
        total: {
          expired_but_active: (expiredPropertiesActive || 0) + (expiredPostsActive || 0),
          expiring_in_7_days: (propertiesExpiringSoon || 0) + (postsExpiringSoon || 0)
        }
      },
      info: {
        description: 'Endpoint de limpieza de anuncios expirados (propiedades + comunidad)',
        schedule: 'Diario a las 2:00 AM (configurado en vercel.json)',
        method: 'POST con Bearer token'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
