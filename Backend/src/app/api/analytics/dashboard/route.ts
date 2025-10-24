import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cache simple en memoria (1 hora)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

function getCacheKey(userId: string, range: string): string {
  return `analytics:${userId}:${range}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Analytics API] Request received');
    const supabase = createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Analytics API] Auth error:', authError?.message);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('[Analytics API] User authenticated:', user.id);

    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const range = searchParams.get('range') || '30d';

    // Verificar que el usuario puede acceder a estos analytics
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verificar cache primero
    const cacheKey = getCacheKey(userId, range);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('[Analytics] Cache HIT:', cacheKey);
      return NextResponse.json(cachedData);
    }

    console.log('[Analytics] Cache MISS:', cacheKey);

    // Verificar plan
    console.log('[Analytics API] Checking plan limits...');
    const { data: planLimits, error: planError } = await supabase
      .rpc('get_user_plan_limits', { user_uuid: user.id });

    if (planError) {
      console.error('[Analytics API] Plan limits error:', planError);
      return NextResponse.json({
        error: 'Error al verificar permisos del plan'
      }, { status: 500 });
    }

    console.log('[Analytics API] Plan limits:', planLimits?.[0]);

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

    // Calcular fecha del periodo anterior para comparación
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysAgo);

    // Obtener IDs de propiedades del usuario
    console.log('[Analytics API] Fetching properties for user:', userId);
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id, title')
      .eq('user_id', userId);

    if (propsError) {
      console.error('[Analytics API] Error fetching properties:', propsError);
      return NextResponse.json({ error: 'Error al obtener propiedades' }, { status: 500 });
    }

    console.log('[Analytics API] Found', properties?.length || 0, 'properties');

    const propertyIds = properties?.map(p => p.id) || [];

    if (propertyIds.length === 0) {
      // Usuario sin propiedades, devolver data vacía
      const emptyData = {
        summary: {
          totalViews: 0,
          totalContacts: 0,
          totalFavorites: 0,
          conversionRate: 0,
          // Comparativas
          viewsChange: 0,
          contactsChange: 0,
          favoritesChange: 0,
        },
        viewsByDay: [],
        topProperties: [],
        eventBreakdown: []
      };
      setCache(cacheKey, emptyData);
      return NextResponse.json(emptyData);
    }

    // === OPTIMIZACIÓN 1: UN SOLO QUERY PARA RESUMEN ACTUAL ===
    console.log('[Analytics API] Fetching current period summary...');
    const { data: currentSummaryData, error: summaryError } = await supabase
      .from('analytics_events')
      .select('event_name')
      .in('target_id', propertyIds)
      .gte('event_time', startDate.toISOString());

    if (summaryError) {
      console.error('[Analytics API] Error fetching summary:', summaryError);
      return NextResponse.json({ error: 'Error al obtener resumen' }, { status: 500 });
    }

    console.log('[Analytics API] Current period events:', currentSummaryData?.length || 0);

    // Procesar en memoria (es más rápido que múltiples queries)
    let totalViews = 0;
    let totalContacts = 0;
    let totalFavorites = 0;

    currentSummaryData?.forEach(event => {
      if (event.event_name === 'view_property') totalViews++;
      else if (event.event_name === 'contact_click' || event.event_name === 'contact_submit') totalContacts++;
      else if (event.event_name === 'property_favorite') totalFavorites++;
    });

    console.log('[Analytics API] Processed current period:', {
      totalViews,
      totalContacts,
      totalFavorites
    });

    const conversionRate = totalViews > 0
      ? Math.round((totalContacts / totalViews) * 100)
      : 0;

    console.log('[Analytics API] Conversion rate:', conversionRate + '%');

    // === OPTIMIZACIÓN 2: QUERY PARA PERIODO ANTERIOR (COMPARACIÓN) ===
    const { data: previousSummaryData, error: prevSummaryError } = await supabase
      .from('analytics_events')
      .select('event_name')
      .in('target_id', propertyIds)
      .gte('event_time', previousStartDate.toISOString())
      .lt('event_time', startDate.toISOString());

    let previousViews = 0;
    let previousContacts = 0;
    let previousFavorites = 0;

    previousSummaryData?.forEach(event => {
      if (event.event_name === 'view_property') previousViews++;
      else if (event.event_name === 'contact_click' || event.event_name === 'contact_submit') previousContacts++;
      else if (event.event_name === 'property_favorite') previousFavorites++;
    });

    // Calcular cambios porcentuales
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const viewsChange = calculateChange(totalViews, previousViews);
    const contactsChange = calculateChange(totalContacts, previousContacts);
    const favoritesChange = calculateChange(totalFavorites, previousFavorites);

    // === OPTIMIZACIÓN 3: QUERY CON DATE GROUPING ===
    // Obtener eventos agrupados por día
    const { data: dailyEvents, error: dailyError } = await supabase
      .from('analytics_events')
      .select('event_time, event_name')
      .in('target_id', propertyIds)
      .gte('event_time', startDate.toISOString())
      .order('event_time', { ascending: true });

    if (dailyError) {
      console.error('Error fetching daily events:', dailyError);
    }

    // Agrupar por día en memoria
    const dailyMap: Record<string, { views: number; contacts: number }> = {};

    dailyEvents?.forEach(event => {
      const date = new Date(event.event_time).toISOString().split('T')[0];

      if (!dailyMap[date]) {
        dailyMap[date] = { views: 0, contacts: 0 };
      }

      if (event.event_name === 'view_property') {
        dailyMap[date].views++;
      } else if (event.event_name === 'contact_click' || event.event_name === 'contact_submit') {
        dailyMap[date].contacts++;
      }
    });

    // Crear array completo con todos los días (incluyendo días sin datos)
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

    // === OPTIMIZACIÓN 4: AGRUPAR POR PROPIEDAD EN UN SOLO QUERY ===
    const { data: propertyEvents, error: propEventsError } = await supabase
      .from('analytics_events')
      .select('event_name, target_id')
      .in('target_id', propertyIds)
      .gte('event_time', startDate.toISOString());

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

    // === 5. BREAKDOWN DE EVENTOS ===
    const eventCountMap: Record<string, number> = {};

    currentSummaryData?.forEach(event => {
      if (!eventCountMap[event.event_name]) {
        eventCountMap[event.event_name] = 0;
      }
      eventCountMap[event.event_name]++;
    });

    const eventBreakdown = Object.entries(eventCountMap)
      .map(([event_name, count]) => ({ event_name, count }))
      .sort((a, b) => b.count - a.count);

    // === RESPUESTA FINAL ===
    const responseData = {
      summary: {
        totalViews,
        totalContacts,
        totalFavorites,
        conversionRate,
        // Comparativas con periodo anterior
        viewsChange,
        contactsChange,
        favoritesChange,
        previousPeriod: {
          views: previousViews,
          contacts: previousContacts,
          favorites: previousFavorites
        }
      },
      viewsByDay,
      topProperties,
      eventBreakdown
    };

    // Guardar en cache
    setCache(cacheKey, responseData);

    console.log('[Analytics API] Response ready, sending data');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[Analytics API] FATAL ERROR:', error);
    console.error('[Analytics API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
