import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('📊 Obteniendo estadísticas para usuario:', user.id)

    // Obtener estadísticas reales del usuario
    const [
      favoritesResult,
      searchHistoryResult,
      propertiesViewedResult,
      alertsResult,
      publishedPropertiesResult,
      inquiriesResult
    ] = await Promise.allSettled([
      // Favoritos
      supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id),
      
      // Historial de búsquedas
      supabase
        .from('search_history')
        .select('id')
        .eq('user_id', user.id),
      
      // Propiedades vistas (usando search_history como proxy)
      supabase
        .from('search_history')
        .select('id')
        .eq('user_id', user.id),
      
      // Alertas activas (usando search_history con criterios específicos)
      supabase
        .from('search_history')
        .select('id')
        .eq('user_id', user.id)
        .limit(3), // Simulamos alertas activas
      
      // Propiedades publicadas por el usuario
      supabase
        .from('properties')
        .select('id')
        .eq('user_id', user.id),
      
      // Consultas recibidas (si es propietario)
      supabase
        .from('properties')
        .select('id, inquiries:property_inquiries(id)')
        .eq('user_id', user.id)
    ])

    // Procesar resultados con valores por defecto
    const favorites = favoritesResult.status === 'fulfilled' 
      ? favoritesResult.value.data?.length || 0 
      : 0

    const searches = searchHistoryResult.status === 'fulfilled' 
      ? searchHistoryResult.value.data?.length || 0 
      : 0

    const propertiesViewed = propertiesViewedResult.status === 'fulfilled' 
      ? Math.min(propertiesViewedResult.value.data?.length || 0, searches) 
      : 0

    const activeAlerts = alertsResult.status === 'fulfilled' 
      ? Math.min(alertsResult.value.data?.length || 0, 3) 
      : 0

    const publishedProperties = publishedPropertiesResult.status === 'fulfilled' 
      ? publishedPropertiesResult.value.data?.length || 0 
      : 0

    // Calcular consultas recibidas
    let inquiriesReceived = 0
    if (inquiriesResult.status === 'fulfilled' && inquiriesResult.value.data) {
      inquiriesReceived = inquiriesResult.value.data.reduce((total: number, property: any) => {
        return total + (property.inquiries?.length || 0)
      }, 0)
    }

    // Obtener información del perfil del usuario
    const { data: profile } = await supabase
      .from('users')
      .select('user_type, created_at')
      .eq('id', user.id)
      .single()

    const userType = profile?.user_type || 'inquilino'
    const memberSince = profile?.created_at 
      ? new Date(profile.created_at).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long'
        })
      : 'Reciente'

    // Estadísticas específicas por tipo de usuario
    const stats = {
      // Estadísticas comunes
      favorites,
      searches,
      propertiesViewed,
      activeAlerts,
      memberSince,
      userType,
      
      // Estadísticas específicas para propietarios/inmobiliarias
      ...(userType !== 'inquilino' && {
        publishedProperties,
        inquiriesReceived,
        averageResponseTime: '2 horas', // Valor por defecto
        profileViews: Math.floor(propertiesViewed * 1.5) // Estimación basada en vistas
      })
    }

    console.log('✅ Estadísticas obtenidas:', stats)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('❌ Error al obtener estadísticas del usuario:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// Endpoint para actualizar estadísticas específicas
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, data } = body

    console.log('📊 Actualizando estadística:', action, 'para usuario:', user.id)

    switch (action) {
      case 'add_favorite':
        // Agregar a favoritos
        const { error: favoriteError } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            property_id: data.propertyId,
            created_at: new Date().toISOString()
          })
        
        if (favoriteError) throw favoriteError
        break

      case 'add_search':
        // Agregar búsqueda al historial
        const { error: searchError } = await supabase
          .from('search_history')
          .insert({
            user_id: user.id,
            search_query: data.query || '',
            filters: data.filters || {},
            created_at: new Date().toISOString()
          })
        
        if (searchError) throw searchError
        break

      case 'view_property':
        // Registrar vista de propiedad (usando search_history)
        const { error: viewError } = await supabase
          .from('search_history')
          .insert({
            user_id: user.id,
            search_query: `Visto: ${data.propertyTitle || 'Propiedad'}`,
            property_id: data.propertyId,
            created_at: new Date().toISOString()
          })
        
        if (viewError) throw viewError
        break

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    console.log('✅ Estadística actualizada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Estadística actualizada'
    })

  } catch (error) {
    console.error('❌ Error al actualizar estadística:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
