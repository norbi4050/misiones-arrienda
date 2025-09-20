import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Lista de tablas principales para auditar políticas RLS
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
      'user_profiles',
      'conversations',
      'messages'
    ]
    
    const auditResults: any = {}
    
    for (const tableName of tablesToAudit) {
      console.log(`🔍 Auditando políticas RLS para tabla: ${tableName}`)
      
      try {
        // Query para obtener información de RLS y políticas de cada tabla
        const { data: rlsInfo, error: rlsError } = await supabase
          .rpc('get_table_rls_info', { table_name: tableName })
        
        if (rlsError) {
          // Si la función RPC no existe, usar query directo a pg_policies
          const { data: policies, error: policiesError } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', tableName)
          
          if (policiesError) {
            // Fallback: intentar con información básica
            auditResults[tableName] = {
              status: 'error',
              error: `No se pudo obtener información RLS: ${policiesError.message}`,
              rls_enabled: 'unknown',
              policies: []
            }
          } else {
            auditResults[tableName] = {
              status: 'partial_info',
              rls_enabled: 'unknown',
              policies: policies || [],
              policy_count: policies?.length || 0
            }
          }
        } else {
          auditResults[tableName] = {
            status: 'success',
            rls_info: rlsInfo,
            policy_count: rlsInfo?.length || 0
          }
        }
        
        // Intentar una operación de prueba para detectar RLS
        const { data: testData, error: testError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        // Analizar el error para determinar estado de RLS
        if (testError) {
          if (testError.code === '42501') {
            auditResults[tableName].rls_status = 'enabled_blocking'
            auditResults[tableName].access_error = testError.message
          } else if (testError.code === 'PGRST204') {
            auditResults[tableName].rls_status = 'table_not_found'
            auditResults[tableName].access_error = testError.message
          } else {
            auditResults[tableName].rls_status = 'other_error'
            auditResults[tableName].access_error = testError.message
          }
        } else {
          auditResults[tableName].rls_status = 'accessible'
          auditResults[tableName].sample_data_count = testData?.length || 0
        }
        
      } catch (tableError) {
        auditResults[tableName] = {
          status: 'error',
          error: tableError instanceof Error ? tableError.message : 'Unknown error',
          rls_status: 'unknown'
        }
      }
    }
    
    // Generar resumen de auditoría RLS
    const summary = {
      total_tables_audited: tablesToAudit.length,
      tables_with_rls_blocking: Object.values(auditResults).filter((r: any) => r.rls_status === 'enabled_blocking').length,
      tables_accessible: Object.values(auditResults).filter((r: any) => r.rls_status === 'accessible').length,
      tables_with_errors: Object.values(auditResults).filter((r: any) => r.rls_status === 'other_error').length,
      tables_not_found: Object.values(auditResults).filter((r: any) => r.rls_status === 'table_not_found').length
    }
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      summary,
      audit_results: auditResults,
      recommendations: generateRLSRecommendations(auditResults)
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function generateRLSRecommendations(auditResults: any) {
  const recommendations = []
  
  // Analizar cada tabla
  Object.entries(auditResults).forEach(([tableName, result]: [string, any]) => {
    if (result.rls_status === 'enabled_blocking') {
      recommendations.push({
        type: 'rls_blocking',
        table: tableName,
        priority: 'critical',
        issue: 'RLS habilitado pero sin políticas que permitan acceso',
        action: `Crear políticas RLS para tabla ${tableName} o deshabilitar RLS temporalmente`,
        sql_example: `
-- Opción 1: Deshabilitar RLS
ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY;

-- Opción 2: Crear política básica
CREATE POLICY "Enable access for authenticated users" ON ${tableName}
FOR ALL USING (auth.role() = 'authenticated');
        `
      })
    }
    
    if (result.rls_status === 'accessible' && result.policy_count === 0) {
      recommendations.push({
        type: 'no_rls_protection',
        table: tableName,
        priority: 'medium',
        issue: 'Tabla accesible sin políticas RLS (posible riesgo de seguridad)',
        action: `Considerar habilitar RLS con políticas apropiadas para ${tableName}`
      })
    }
  })
  
  // Recomendación específica para properties
  if (auditResults.properties?.rls_status === 'enabled_blocking') {
    recommendations.push({
      type: 'properties_fix',
      table: 'properties',
      priority: 'critical',
      issue: 'Tabla properties bloqueada por RLS - causa del error de publicación',
      action: 'Configurar políticas RLS específicas para properties',
      sql_solution: `
-- Solución recomendada para tabla properties
CREATE POLICY "Users can insert their own properties" ON properties
FOR INSERT WITH CHECK (auth.uid() = userId);

CREATE POLICY "Anyone can view active properties" ON properties
FOR SELECT USING (true);

CREATE POLICY "Users can update their own properties" ON properties
FOR UPDATE USING (auth.uid() = userId);

CREATE POLICY "Users can delete their own properties" ON properties
FOR DELETE USING (auth.uid() = userId);
      `
    })
  }
  
  return recommendations
}
