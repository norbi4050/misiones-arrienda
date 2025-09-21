import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== DEBUG Community Tables [${requestId}] ===`)

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

    // Verificar qué tablas existen relacionadas con comunidad
    const tablesToCheck = [
      'community_profiles',
      'user_profiles', 
      'UserProfile',
      'profiles'
    ]

    const results: Record<string, any> = {}

    for (const tableName of tablesToCheck) {
      try {
        console.log(`[${requestId}] Verificando tabla: ${tableName}`)
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          results[tableName] = {
            exists: false,
            error: error.message,
            code: error.code
          }
        } else {
          results[tableName] = {
            exists: true,
            sampleCount: data?.length || 0
          }
        }
      } catch (e) {
        results[tableName] = {
          exists: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        }
      }
    }

    // También verificar el schema de la base de datos
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_table_info', { table_name: 'community_profiles' })

      if (!schemaError && schemaData) {
        results['schema_info'] = schemaData
      }
    } catch (e) {
      console.log(`[${requestId}] No se pudo obtener schema info`)
    }

    // Verificar si hay datos de comunidad en alguna tabla
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', user.id)
        .single()

      if (!userError && userData) {
        results['current_user'] = userData
      }
    } catch (e) {
      console.log(`[${requestId}] Error obteniendo usuario actual`)
    }

    return NextResponse.json({
      requestId,
      userId: user.id,
      userEmail: user.email,
      tableResults: results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
