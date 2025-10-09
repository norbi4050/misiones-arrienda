// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PROMPT C — Smoketest E2E para Analytics
 * 
 * Endpoint dev-only que:
 * 1. Dispara eventos clave de analytics
 * 2. Espera inserciones en DB
 * 3. Consulta y retorna KPIs desde Supabase
 * 
 * Uso: GET http://localhost:3000/api/dev/analytics-smoketest
 * O: npm run dev:analytics-smoke
 */

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('[Analytics Smoketest] 🚀 Iniciando...')
    
    // 1. Definir eventos a disparar
    const testEvents = [
      {
        eventName: 'page_view',
        payload: { path: '/', source: 'smoketest' },
        page: '/dev/smoketest'
      },
      {
        eventName: 'view_property',
        payload: { 
          propertyId: 'test-property-123',
          city: 'Posadas',
          price: 350000,
          featured: false
        },
        targetType: 'property',
        targetId: 'test-property-123',
        page: '/properties/test-property-123'
      },
      {
        eventName: 'profile_view',
        payload: {
          profileId: 'test-agency-456',
          profileName: 'Inmobiliaria Test'
        },
        targetType: 'agency',
        targetId: 'test-agency-456',
        page: '/inmobiliaria/test-agency-456'
      },
      {
        eventName: 'contact_click',
        payload: {
          propertyId: 'test-property-123',
          contactType: 'message'
        },
        targetType: 'property',
        targetId: 'test-property-123',
        page: '/properties/test-property-123'
      },
      {
        eventName: 'message_sent',
        payload: {
          conversationId: 'test-conversation-789',
          propertyId: 'test-property-123'
        },
        targetType: 'conversation',
        targetId: 'test-conversation-789',
        page: '/messages'
      },
      {
        eventName: 'publish_completed',
        payload: {
          propertyId: 'test-property-new-001',
          plan: 'basico'
        },
        targetType: 'property',
        targetId: 'test-property-new-001',
        page: '/publicar'
      },
      {
        eventName: 'share_click',
        payload: {
          channel: 'whatsapp',
          entity: 'property',
          entity_id: 'test-property-123',
          context: 'property_detail'
        },
        targetType: 'property',
        targetId: 'test-property-123',
        page: '/properties/test-property-123'
      }
    ]
    
    console.log(`[Analytics Smoketest] 📤 Enviando ${testEvents.length} eventos...`)
    
    // 2. Enviar eventos al endpoint de ingesta
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const eventResults = []
    
    for (const event of testEvents) {
      try {
        const response = await fetch(`${baseUrl}/api/analytics/ingest`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'Analytics-Smoketest/1.0'
          },
          body: JSON.stringify({
            ...event,
            actorRole: 'smoketest',
            referrer: 'http://localhost:3000/dev/smoketest'
          })
        })
        
        eventResults.push({
          event: event.eventName,
          status: response.ok ? 'success' : 'failed',
          statusCode: response.status
        })
        
        console.log(`[Analytics Smoketest] ✅ ${event.eventName}: ${response.status}`)
      } catch (error: any) {
        eventResults.push({
          event: event.eventName,
          status: 'error',
          error: error.message
        })
        console.error(`[Analytics Smoketest] ❌ ${event.eventName}:`, error.message)
      }
    }
    
    // 3. Esperar a que se procesen las inserciones
    console.log('[Analytics Smoketest] ⏳ Esperando inserciones en DB (1.5s)...')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 4. Consultar Supabase para verificar datos
    console.log('[Analytics Smoketest] 🔍 Consultando KPIs desde Supabase...')
    const supabase = createClient()
    
    // Eventos recientes (últimos 30 minutos)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: recentEvents, error: eventsError } = await supabase
      .from('analytics_events')
      .select('event_name, event_time, actor_role')
      .gte('event_time', thirtyMinutesAgo)
      .order('event_time', { ascending: false })
      .limit(20)
    
    // Conteo por tipo de evento
    const { data: eventCounts, error: countsError } = await supabase
      .from('analytics_events')
      .select('event_name')
      .gte('event_time', thirtyMinutesAgo)
    
    const eventCountMap: Record<string, number> = {}
    if (eventCounts) {
      eventCounts.forEach((row: any) => {
        eventCountMap[row.event_name] = (eventCountMap[row.event_name] || 0) + 1
      })
    }
    
    // KPI Daily (últimos 5 días)
    const { data: kpiDaily, error: kpiDailyError } = await supabase
      .from('kpi_daily')
      .select('*')
      .order('day', { ascending: false })
      .limit(5)
    
    // KPI Property Views Daily (últimos 5 días)
    const { data: kpiPropertyViews, error: kpiPropertyError } = await supabase
      .from('kpi_property_views_daily')
      .select('*')
      .order('day', { ascending: false })
      .limit(5)
    
    // KPI Leads Daily (últimos 5 días) - si existe
    const { data: kpiLeads, error: kpiLeadsError } = await supabase
      .from('kpi_leads_daily')
      .select('*')
      .order('day', { ascending: false })
      .limit(5)
    
    const duration = Date.now() - startTime
    console.log(`[Analytics Smoketest] ✅ Completado en ${duration}ms`)
    
    // 5. Retornar resultados
    return NextResponse.json({
      success: true,
      summary: {
        events_sent: testEvents.length,
        events_succeeded: eventResults.filter(r => r.status === 'success').length,
        events_failed: eventResults.filter(r => r.status !== 'success').length,
        duration_ms: duration
      },
      event_results: eventResults,
      database_queries: {
        recent_events: {
          count: recentEvents?.length || 0,
          data: recentEvents || [],
          error: eventsError?.message
        },
        event_counts_last_30min: {
          data: eventCountMap,
          error: countsError?.message
        },
        kpi_daily: {
          count: kpiDaily?.length || 0,
          data: kpiDaily || [],
          error: kpiDailyError?.message
        },
        kpi_property_views_daily: {
          count: kpiPropertyViews?.length || 0,
          data: kpiPropertyViews || [],
          error: kpiPropertyError?.message
        },
        kpi_leads_daily: {
          count: kpiLeads?.length || 0,
          data: kpiLeads || [],
          error: kpiLeadsError?.message
        }
      },
      _meta: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        analytics_enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED
      }
    })
    
  } catch (error: any) {
    console.error('[Analytics Smoketest] ❌ Error fatal:', error)
    return NextResponse.json({
      success: false,
      error: 'SMOKETEST_FAILED',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
