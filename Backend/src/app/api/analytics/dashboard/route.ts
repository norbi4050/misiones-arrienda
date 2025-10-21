import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const range = searchParams.get('range') || '30d';

    // Verificar que el usuario puede acceder a estos analytics
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verificar plan
    const { data: planLimits } = await supabase
      .rpc('get_user_plan_limits', { user_uuid: user.id });

    if (!planLimits?.[0]?.allow_analytics) {
      return NextResponse.json({
        error: 'Tu plan no incluye acceso a analytics'
      }, { status: 403 });
    }

    // Calcular fecha de inicio según el rango
    const now = new Date();
    let daysAgo = 30;

    if (range === '7d') daysAgo = 7;
    else if (range === '30d') daysAgo = 30;
    else if (range === '90d') daysAgo = 90;

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);

    // Obtener IDs de propiedades del usuario
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id, title')
      .eq('user_id', userId);

    if (propsError) {
      console.error('Error fetching properties:', propsError);
      return NextResponse.json({ error: 'Error al obtener propiedades' }, { status: 500 });
    }

    const propertyIds = properties?.map(p => p.id) || [];

    if (propertyIds.length === 0) {
      // Usuario sin propiedades, devolver data vacía
      return NextResponse.json({
        summary: {
          totalViews: 0,
          totalContacts: 0,
          totalFavorites: 0,
          conversionRate: 0
        },
        viewsByDay: [],
        topProperties: [],
        eventBreakdown: []
      });
    }

    // === 1. RESUMEN GENERAL ===
    // Contar total de vistas
    const { count: totalViews } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_name', 'view_property')
      .in('target_id', propertyIds)
      .gte('created_at', startDate.toISOString());

    // Contar total de contactos (contact_click + contact_submit)
    const { count: totalContacts } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .in('event_name', ['contact_click', 'contact_submit'])
      .in('target_id', propertyIds)
      .gte('created_at', startDate.toISOString());

    // Contar total de favoritos
    const { count: totalFavorites } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_name', 'property_favorite')
      .in('target_id', propertyIds)
      .gte('created_at', startDate.toISOString());

    const conversionRate = totalViews && totalViews > 0
      ? Math.round(((totalContacts || 0) / totalViews) * 100)
      : 0;

    // === 2. VISITAS POR DÍA ===
    const { data: dailyEvents, error: dailyError } = await supabase
      .from('analytics_events')
      .select('created_at, event_name, target_id')
      .in('target_id', propertyIds)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (dailyError) {
      console.error('Error fetching daily events:', dailyError);
    }

    // Agrupar por día
    const dailyMap: Record<string, { views: number; contacts: number }> = {};

    dailyEvents?.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];

      if (!dailyMap[date]) {
        dailyMap[date] = { views: 0, contacts: 0 };
      }

      if (event.event_name === 'view_property') {
        dailyMap[date].views++;
      } else if (event.event_name === 'contact_click' || event.event_name === 'contact_submit') {
        dailyMap[date].contacts++;
      }
    });

    // Llenar días vacíos
    const viewsByDay = [];
    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      viewsByDay.push({
        date: dateStr,
        views: dailyMap[dateStr]?.views || 0,
        contacts: dailyMap[dateStr]?.contacts || 0
      });
    }

    // === 3. TOP PROPIEDADES ===
    const { data: propertyEvents, error: propEventsError } = await supabase
      .from('analytics_events')
      .select('event_name, target_id')
      .in('target_id', propertyIds)
      .gte('created_at', startDate.toISOString());

    if (propEventsError) {
      console.error('Error fetching property events:', propEventsError);
    }

    // Agrupar por propiedad
    const propertyStatsMap: Record<string, {
      views: number;
      contacts: number;
      favorites: number;
    }> = {};

    propertyEvents?.forEach(event => {
      const propId = event.target_id;
      if (!propId) return;

      if (!propertyStatsMap[propId]) {
        propertyStatsMap[propId] = { views: 0, contacts: 0, favorites: 0 };
      }

      if (event.event_name === 'view_property') {
        propertyStatsMap[propId].views++;
      } else if (event.event_name === 'contact_click' || event.event_name === 'contact_submit') {
        propertyStatsMap[propId].contacts++;
      } else if (event.event_name === 'property_favorite') {
        propertyStatsMap[propId].favorites++;
      }
    });

    // Crear array de top propiedades
    const topProperties = Object.entries(propertyStatsMap)
      .map(([propId, stats]) => {
        const property = properties?.find(p => p.id === propId);
        const conversionRate = stats.views > 0
          ? Math.round((stats.contacts / stats.views) * 100)
          : 0;

        return {
          id: propId,
          title: property?.title || 'Sin título',
          views: stats.views,
          contacts: stats.contacts,
          favorites: stats.favorites,
          conversionRate
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10); // Top 10

    // === 4. BREAKDOWN DE EVENTOS ===
    const { data: allEvents, error: allEventsError } = await supabase
      .from('analytics_events')
      .select('event_name')
      .or(`target_id.in.(${propertyIds.join(',')}),user_id.eq.${userId}`)
      .gte('created_at', startDate.toISOString());

    if (allEventsError) {
      console.error('Error fetching all events:', allEventsError);
    }

    const eventCountMap: Record<string, number> = {};

    allEvents?.forEach(event => {
      if (!eventCountMap[event.event_name]) {
        eventCountMap[event.event_name] = 0;
      }
      eventCountMap[event.event_name]++;
    });

    const eventBreakdown = Object.entries(eventCountMap)
      .map(([event_name, count]) => ({ event_name, count }))
      .sort((a, b) => b.count - a.count);

    // === RESPUESTA FINAL ===
    return NextResponse.json({
      summary: {
        totalViews: totalViews || 0,
        totalContacts: totalContacts || 0,
        totalFavorites: totalFavorites || 0,
        conversionRate
      },
      viewsByDay,
      topProperties,
      eventBreakdown
    });

  } catch (error) {
    console.error('Error in analytics dashboard API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
