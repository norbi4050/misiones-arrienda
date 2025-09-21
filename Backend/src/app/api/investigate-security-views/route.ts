import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/investigate-security-views - Investigar views con SECURITY DEFINER
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/investigate-security-views [${requestId}] ===`)

  try {
    const supabase = await createClient()

    const results: any = {}

    // 1. Examinar definiciones de views problemáticas
    console.log(`[${requestId}] Examinando views SECURITY DEFINER...`)
    
    const viewsToCheck = [
      'property_with_owner',
      'user_profile_views', 
      'user_searches',
      'system_stats'
    ]

    for (const viewName of viewsToCheck) {
      try {
        // Intentar contar registros para verificar si existe
        const { count, error: countError } = await supabase
          .from(viewName)
          .select('*', { count: 'exact', head: true })

        if (countError) {
          console.log(`[${requestId}] View ${viewName} no existe o error:`, countError.message)
          results[viewName] = {
            exists: false,
            error: countError.message
          }
          continue
        }

        results[viewName] = {
          exists: true,
          rowCount: count || 0,
          securityRisk: count && count > 0 ? 'HIGH' : 'LOW'
        }

        console.log(`[${requestId}] View ${viewName}: ${count || 0} registros`)

      } catch (error) {
        console.log(`[${requestId}] Error procesando view ${viewName}:`, error)
        results[viewName] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      }
    }

    // 2. Examinar tablas sin RLS
    console.log(`[${requestId}] Examinando tablas sin RLS...`)
    
    const tablesToCheck = [
      'backup_policies_before_optimization',
      'optimization_log'
    ]

    for (const tableName of tablesToCheck) {
      try {
        // Verificar si la tabla existe y contar registros
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (countError) {
          console.log(`[${requestId}] Tabla ${tableName} no existe o error:`, countError.message)
          results[`table_${tableName}`] = {
            exists: false,
            error: countError.message
          }
          continue
        }

        results[`table_${tableName}`] = {
          exists: true,
          rowCount: count || 0,
          needsRLS: true
        }

        console.log(`[${requestId}] Tabla ${tableName}: ${count || 0} registros`)

      } catch (error) {
        console.log(`[${requestId}] Error procesando tabla ${tableName}:`, error)
        results[`table_${tableName}`] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      }
    }

    // 3. Buscar uso de views en código (simulado)
    console.log(`[${requestId}] Analizando uso en aplicación...`)
    
    // Nota: En un entorno real, buscaríamos en el código fuente
    // Por ahora, documentamos qué buscar
    results.codeAnalysis = {
      note: "Buscar en código fuente referencias a estas views:",
      viewsToSearch: viewsToCheck,
      searchPatterns: [
        "FROM property_with_owner",
        "FROM user_profile_views", 
        "FROM user_searches",
        "FROM system_stats"
      ],
      recommendation: "Usar search_files para buscar estas referencias en src/"
    }

    // 4. Recomendaciones basadas en hallazgos
    const recommendations = []

    for (const viewName of viewsToCheck) {
      const viewData = results[viewName]
      if (viewData?.exists) {
        if (viewData.rowCount > 0) {
          recommendations.push({
            view: viewName,
            action: "CRITICAL - Remove SECURITY DEFINER or drop view",
            reason: `Has ${viewData.rowCount} rows - potential data exposure`
          })
        } else {
          recommendations.push({
            view: viewName,
            action: "SAFE - Can drop view safely",
            reason: "Empty view - no data exposure risk"
          })
        }
      }
    }

    for (const tableName of tablesToCheck) {
      const tableData = results[`table_${tableName}`]
      if (tableData?.exists) {
        if (tableData.rowCount > 0) {
          recommendations.push({
            table: tableName,
            action: "ENABLE RLS or make private",
            reason: `Has ${tableData.rowCount} rows - needs protection`
          })
        } else {
          recommendations.push({
            table: tableName,
            action: "SAFE - Enable RLS as precaution",
            reason: "Empty table - low risk but good practice"
          })
        }
      }
    }

    console.log(`[${requestId}] Investigación completada. ${recommendations.length} recomendaciones generadas.`)

    return NextResponse.json({
      investigation: results,
      recommendations,
      summary: {
        viewsChecked: viewsToCheck.length,
        tablesChecked: tablesToCheck.length,
        criticalIssues: recommendations.filter(r => r.action.includes('CRITICAL')).length,
        safeToFix: recommendations.filter(r => r.action.includes('SAFE')).length
      },
      nextSteps: [
        "1. Review recommendations above",
        "2. Search codebase for view usage with search_files",
        "3. Apply fixes based on findings",
        "4. Test application after fixes"
      ]
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Error interno del servidor al investigar views de seguridad' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
