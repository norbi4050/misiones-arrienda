import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/execute-security-fix - Ejecutar corrección de errores de seguridad
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== POST /api/execute-security-fix [${requestId}] ===`)

  try {
    const supabase = await createClient()

    // Verificar autenticación (solo para admin/service)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log(`[${requestId}] Ejecutando corrección de seguridad...`)

    const results: any = {
      viewsFixed: [],
      tablesFixed: [],
      errors: []
    }

    // 1. Corregir views SECURITY DEFINER
    const viewsToFix = [
      'property_with_owner',
      'user_profile_views', 
      'user_searches',
      'system_stats'
    ]

    for (const viewName of viewsToFix) {
      try {
        // Verificar si la view existe
        const { data: viewExists } = await supabase
          .from('information_schema.views')
          .select('table_name')
          .eq('table_name', viewName)
          .single()

        if (viewExists) {
          // Remover SECURITY DEFINER usando SQL directo
          const { error: alterError } = await supabase.rpc('execute_sql', {
            sql: `ALTER VIEW ${viewName} SET (security_definer = false);`
          })

          if (alterError) {
            console.log(`[${requestId}] Error corrigiendo view ${viewName}:`, alterError.message)
            results.errors.push({
              type: 'view',
              name: viewName,
              error: alterError.message
            })
          } else {
            console.log(`[${requestId}] ✅ View ${viewName}: SECURITY DEFINER removido`)
            results.viewsFixed.push(viewName)
          }
        } else {
          console.log(`[${requestId}] View ${viewName} no existe - OK`)
        }

      } catch (error) {
        console.log(`[${requestId}] Error procesando view ${viewName}:`, error)
        results.errors.push({
          type: 'view',
          name: viewName,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // 2. Habilitar RLS en tablas sin protección
    const tablesToFix = [
      'backup_policies_before_optimization',
      'optimization_log'
    ]

    for (const tableName of tablesToFix) {
      try {
        // Verificar si la tabla existe
        const { data: tableExists } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', tableName)
          .single()

        if (tableExists) {
          // Habilitar RLS
          const { error: rlsError } = await supabase.rpc('execute_sql', {
            sql: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
          })

          if (rlsError) {
            console.log(`[${requestId}] Error habilitando RLS en ${tableName}:`, rlsError.message)
            results.errors.push({
              type: 'table_rls',
              name: tableName,
              error: rlsError.message
            })
          } else {
            // Crear política restrictiva
            const policyName = `${tableName}_service_role_only`
            const { error: policyError } = await supabase.rpc('execute_sql', {
              sql: `
                CREATE POLICY "${policyName}" ON ${tableName}
                FOR ALL USING (
                  current_setting('role') = 'service_role' OR
                  (current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role'
                );
              `
            })

            if (policyError) {
              console.log(`[${requestId}] Error creando política para ${tableName}:`, policyError.message)
              results.errors.push({
                type: 'table_policy',
                name: tableName,
                error: policyError.message
              })
            } else {
              console.log(`[${requestId}] ✅ Tabla ${tableName}: RLS habilitado con política restrictiva`)
              results.tablesFixed.push(tableName)
            }
          }
        } else {
          console.log(`[${requestId}] Tabla ${tableName} no existe - OK`)
        }

      } catch (error) {
        console.log(`[${requestId}] Error procesando tabla ${tableName}:`, error)
        results.errors.push({
          type: 'table',
          name: tableName,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    console.log(`[${requestId}] Corrección completada:`, {
      viewsFixed: results.viewsFixed.length,
      tablesFixed: results.tablesFixed.length,
      errors: results.errors.length
    })

    return NextResponse.json({
      success: true,
      results,
      summary: {
        viewsProcessed: viewsToFix.length,
        viewsFixed: results.viewsFixed.length,
        tablesProcessed: tablesToFix.length,
        tablesFixed: results.tablesFixed.length,
        totalErrors: results.errors.length
      },
      message: results.errors.length === 0 
        ? 'Corrección de seguridad completada exitosamente'
        : `Corrección parcial: ${results.errors.length} errores encontrados`,
      nextSteps: [
        'Verificar que /api/users/stats sigue funcionando',
        'Verificar que /api/users/activity sigue funcionando',
        'Ejecutar linter de Supabase para confirmar corrección'
      ]
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Error interno del servidor al ejecutar corrección de seguridad' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
