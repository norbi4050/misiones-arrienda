import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/debug-properties-count [${requestId}] ===`)
  
  try {
    // Crear cliente Supabase con Service Role
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Consultar todas las propiedades con sus estados
    const { data: allProperties, error: allError } = await supabase
      .from('properties')
      .select('id, title, status, is_active, created_at')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error(`[${requestId}] Error consultando todas las propiedades:`, allError)
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    // Consultar propiedades que muestra el listado (PUBLISHED + AVAILABLE con is_active=true)
    const { data: listingProperties, error: listingError } = await supabase
      .from('properties')
      .select('id, title, status, is_active, created_at')
      .in('status', ['PUBLISHED', 'AVAILABLE'])
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (listingError) {
      console.error(`[${requestId}] Error consultando propiedades del listado:`, listingError)
      return NextResponse.json({ error: listingError.message }, { status: 500 })
    }

    // Consultar propiedades que muestra el detalle individual (solo AVAILABLE con is_active=true)
    const { data: detailProperties, error: detailError } = await supabase
      .from('properties')
      .select('id, title, status, is_active, created_at')
      .eq('status', 'AVAILABLE')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (detailError) {
      console.error(`[${requestId}] Error consultando propiedades del detalle:`, detailError)
      return NextResponse.json({ error: detailError.message }, { status: 500 })
    }

    // Agrupar por status
    const statusCounts = allProperties.reduce((acc: any, prop: any) => {
      const key = `${prop.status}_${prop.is_active ? 'active' : 'inactive'}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const response = {
      timestamp: new Date().toISOString(),
      requestId,
      summary: {
        total_properties: allProperties.length,
        listing_shows: listingProperties.length, // Lo que muestra /properties
        detail_accessible: detailProperties.length, // Lo que es accesible individualmente
        status_breakdown: statusCounts
      },
      all_properties: allProperties,
      listing_properties: listingProperties,
      detail_properties: detailProperties,
      filters_used: {
        listing: "status IN ('PUBLISHED', 'AVAILABLE') AND is_active = true",
        detail: "status = 'AVAILABLE' AND is_active = true"
      }
    }

    console.log(`[${requestId}] Resumen:`, response.summary)

    return NextResponse.json(response)

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
