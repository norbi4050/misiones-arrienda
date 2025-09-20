import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface TableAuditResult {
  exists: boolean
  error: string | null
  columns: string[]
  sampleData: any
  recordCount: number
  hasData?: boolean
}

interface AuditResults {
  [tableName: string]: TableAuditResult
}

interface Recommendation {
  type: string
  table: string
  column?: string
  priority: string
  action: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Lista de tablas principales que queremos auditar
    const tablesToAudit = [
      'properties',
      'users', 
      'profiles',
      'agents',
      'inquiries',
      'favorites',
      'subscriptions',
      'payments',
      'search_history',
      'user_profiles', // Para módulo comunidad
      'conversations',
      'messages'
    ]
    
    const auditResults: AuditResults = {}
    
    for (const tableName of tablesToAudit) {
      console.log(`🔍 Auditando tabla: ${tableName}`)
      
      try {
        // Intentar obtener un registro para ver la estructura
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          auditResults[tableName] = {
            exists: false,
            error: error.message,
            columns: [],
            sampleData: null,
            recordCount: 0
          }
        } else {
          // Obtener conteo total
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
          
          auditResults[tableName] = {
            exists: true,
            error: null,
            columns: data && data.length > 0 ? Object.keys(data[0]) : [],
            sampleData: data && data.length > 0 ? data[0] : null,
            recordCount: count || 0,
            hasData: (data && data.length > 0)
          }
        }
      } catch (tableError) {
        auditResults[tableName] = {
          exists: false,
          error: tableError instanceof Error ? tableError.message : 'Unknown error',
          columns: [],
          sampleData: null,
          recordCount: 0
        }
      }
    }
    
    // Resumen de la auditoría
    const summary = {
      totalTablesAudited: tablesToAudit.length,
      existingTables: Object.values(auditResults).filter((r: TableAuditResult) => r.exists).length,
      missingTables: Object.values(auditResults).filter((r: TableAuditResult) => !r.exists).length,
      tablesWithData: Object.values(auditResults).filter((r: TableAuditResult) => r.exists && r.recordCount > 0).length,
      emptyTables: Object.values(auditResults).filter((r: TableAuditResult) => r.exists && r.recordCount === 0).length
    }
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      summary,
      auditResults,
      recommendations: generateRecommendations(auditResults)
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function generateRecommendations(auditResults: AuditResults): Recommendation[] {
  const recommendations: Recommendation[] = []
  
  // Verificar tabla properties
  if (auditResults.properties?.exists) {
    const propertiesColumns = auditResults.properties.columns
    
    if (!propertiesColumns.includes('contact_phone')) {
      recommendations.push({
        type: 'missing_column',
        table: 'properties',
        column: 'contact_phone',
        priority: 'medium',
        action: 'Considerar agregar columna contact_phone si es necesaria para el negocio'
      })
    }
    
    if (!propertiesColumns.includes('contact_name')) {
      recommendations.push({
        type: 'missing_column',
        table: 'properties',
        column: 'contact_name',
        priority: 'medium',
        action: 'Considerar agregar columna contact_name si es necesaria para el negocio'
      })
    }
    
    if (!propertiesColumns.includes('contact_email')) {
      recommendations.push({
        type: 'missing_column',
        table: 'properties',
        column: 'contact_email',
        priority: 'medium',
        action: 'Considerar agregar columna contact_email si es necesaria para el negocio'
      })
    }
  } else {
    recommendations.push({
      type: 'missing_table',
      table: 'properties',
      priority: 'critical',
      action: 'Crear tabla properties - es fundamental para el sistema'
    })
  }
  
  // Verificar otras tablas críticas
  const criticalTables = ['users', 'profiles']
  criticalTables.forEach(table => {
    if (!auditResults[table]?.exists) {
      recommendations.push({
        type: 'missing_table',
        table,
        priority: 'critical',
        action: `Crear tabla ${table} - es fundamental para el sistema`
      })
    }
  })
  
  return recommendations
}
