import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Usar Service Role Key para bypasear RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('🔍 Usando Service Role para obtener estructura real...')
    
    // Test 1: SELECT con Service Role
    const { data: selectData, error: selectError } = await supabaseAdmin
      .from('properties')
      .select('*')
      .limit(1)
    
    // Test 2: INSERT mínimo con Service Role
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('properties')
      .insert({
        title: 'TEST_SCHEMA_DETECTION',
        description: 'Test para detectar campos reales',
        price: 1
      })
      .select()
    
    // Test 3: Si el insert básico falla, probar solo con title
    let titleOnlyTest = null
    if (insertError) {
      const { data: titleData, error: titleError } = await supabaseAdmin
        .from('properties')
        .insert({ title: 'TEST_TITLE_ONLY' })
        .select()
      
      titleOnlyTest = {
        success: !titleError,
        error: titleError?.message,
        data: titleData
      }
    }
    
    // Limpiar datos de prueba si se insertaron
    if (insertData && insertData.length > 0) {
      await supabaseAdmin
        .from('properties')
        .delete()
        .eq('id', insertData[0].id)
    }
    
    if (titleOnlyTest?.data && titleOnlyTest.data.length > 0) {
      await supabaseAdmin
        .from('properties')
        .delete()
        .eq('id', titleOnlyTest.data[0].id)
    }
    
    // Analizar resultados
    const analysis = {
      service_role_works: true,
      select_works: !selectError,
      basic_insert_works: !insertError,
      title_only_works: titleOnlyTest ? titleOnlyTest.success : null,
      existing_data_count: selectData?.length || 0,
      existing_columns: selectData && selectData.length > 0 ? Object.keys(selectData[0]) : [],
      inserted_columns: insertData && insertData.length > 0 ? Object.keys(insertData[0]) : [],
      title_only_columns: titleOnlyTest?.data && titleOnlyTest.data.length > 0 ? Object.keys(titleOnlyTest.data[0]) : []
    }
    
    // Determinar campos que realmente existen
    const realColumns = analysis.existing_columns.length > 0 
      ? analysis.existing_columns 
      : analysis.inserted_columns.length > 0 
        ? analysis.inserted_columns 
        : analysis.title_only_columns
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      tests: {
        select_test: {
          success: !selectError,
          error: selectError?.message,
          data_count: selectData?.length || 0
        },
        basic_insert_test: {
          success: !insertError,
          error: insertError?.message,
          error_code: insertError?.code
        },
        title_only_test: titleOnlyTest
      },
      analysis,
      real_columns: realColumns,
      recommendations: generateColumnRecommendations(analysis, insertError, titleOnlyTest)
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurado',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function generateColumnRecommendations(analysis: any, insertError: any, titleOnlyTest: any) {
  const recommendations = []
  
  if (analysis.real_columns && analysis.real_columns.length > 0) {
    recommendations.push({
      type: 'success',
      message: `Tabla properties tiene ${analysis.real_columns.length} columnas reales`,
      columns: analysis.real_columns,
      action: 'Actualizar endpoint /api/properties/create para usar solo estos campos'
    })
    
    // Verificar campos específicos
    const hasUserId = analysis.real_columns.includes('userId')
    const hasUser_id = analysis.real_columns.includes('user_id')
    
    if (!hasUserId && !hasUser_id) {
      recommendations.push({
        type: 'critical',
        message: 'No hay columna para relacionar con usuarios',
        action: 'Agregar columna userId o user_id a la tabla properties'
      })
    }
    
    if (hasUser_id && !hasUserId) {
      recommendations.push({
        type: 'info',
        message: 'La tabla usa user_id (snake_case) en lugar de userId (camelCase)',
        action: 'Actualizar código para usar user_id en lugar de userId'
      })
    }
  } else {
    recommendations.push({
      type: 'critical',
      message: 'No se pudo determinar la estructura de la tabla properties',
      action: 'Verificar manualmente en Supabase Dashboard'
    })
  }
  
  return recommendations
}
