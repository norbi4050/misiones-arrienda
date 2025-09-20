import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log('🔍 Verificando acceso a tabla properties...')
    
    // Test 1: Intentar SELECT
    console.log('Test 1: SELECT')
    const { data: selectData, error: selectError } = await supabase
      .from('properties')
      .select('*')
      .limit(1)
    
    // Test 2: Intentar INSERT con datos mínimos
    console.log('Test 2: INSERT')
    const { data: insertData, error: insertError } = await supabase
      .from('properties')
      .insert({
        title: 'TEST_RLS_CHECK',
        description: 'Test para verificar RLS',
        price: 1
      })
      .select()
    
    // Test 3: Verificar información de la tabla
    console.log('Test 3: Table Info')
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'properties')
    
    return NextResponse.json({
      status: 'rls_check_complete',
      timestamp: new Date().toISOString(),
      tests: {
        select_test: {
          success: !selectError,
          error: selectError?.message || null,
          error_code: selectError?.code || null,
          data_count: selectData?.length || 0
        },
        insert_test: {
          success: !insertError,
          error: insertError?.message || null,
          error_code: insertError?.code || null,
          inserted_id: insertData?.[0]?.id || null
        },
        table_info_test: {
          success: !tableError,
          error: tableError?.message || null,
          table_exists: tableInfo && tableInfo.length > 0
        }
      },
      analysis: {
        rls_blocking_select: selectError?.code === '42501',
        rls_blocking_insert: insertError?.code === '42501',
        table_exists: !tableError && tableInfo && tableInfo.length > 0,
        schema_mismatch: insertError?.code === 'PGRST204'
      },
      recommendations: generateQuickRecommendations(selectError, insertError, tableError)
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function generateQuickRecommendations(selectError: any, insertError: any, tableError: any) {
  const recommendations = []
  
  if (selectError?.code === '42501') {
    recommendations.push({
      issue: 'RLS bloquea SELECT en properties',
      solution: 'Crear política: CREATE POLICY "Enable read access" ON properties FOR SELECT USING (true);'
    })
  }
  
  if (insertError?.code === '42501') {
    recommendations.push({
      issue: 'RLS bloquea INSERT en properties - CAUSA PRINCIPAL DEL ERROR',
      solution: 'Crear política: CREATE POLICY "Enable insert for authenticated users" ON properties FOR INSERT WITH CHECK (auth.role() = \'authenticated\');',
      priority: 'CRITICAL'
    })
  }
  
  if (insertError?.code === 'PGRST204') {
    recommendations.push({
      issue: 'Schema mismatch - campos no existen',
      solution: 'Verificar qué campos realmente existen en la tabla properties'
    })
  }
  
  if (!selectError && !insertError) {
    recommendations.push({
      issue: 'Acceso completo disponible',
      solution: 'La tabla properties es accesible - el problema puede estar en otro lugar'
    })
  }
  
  return recommendations
}
