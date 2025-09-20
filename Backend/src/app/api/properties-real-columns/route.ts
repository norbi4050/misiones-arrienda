import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log('🔍 Obteniendo columnas REALES de la tabla properties...')
    
    // Método 1: Intentar obtener columnas desde information_schema
    let columnsMethod1 = null
    try {
      const { data: columns1, error: error1 } = await supabase
        .rpc('get_table_columns', { table_name: 'properties' })
      
      if (!error1) {
        columnsMethod1 = columns1
      }
    } catch (e) {
      console.log('Método 1 falló:', e)
    }
    
    // Método 2: Intentar SELECT * LIMIT 0 para obtener estructura
    let columnsMethod2 = null
    try {
      const { data: data2, error: error2 } = await supabase
        .from('properties')
        .select('*')
        .limit(0)
      
      if (!error2) {
        columnsMethod2 = 'SELECT exitoso - tabla existe'
      } else {
        columnsMethod2 = `Error: ${error2.message} (Code: ${error2.code})`
      }
    } catch (e) {
      columnsMethod2 = `Exception: ${e}`
    }
    
    // Método 3: Intentar insertar registro vacío para ver qué campos requiere
    let columnsMethod3 = null
    try {
      const { data: data3, error: error3 } = await supabase
        .from('properties')
        .insert({})
        .select()
      
      if (!error3) {
        columnsMethod3 = 'INSERT vacío exitoso'
      } else {
        columnsMethod3 = `Error INSERT: ${error3.message} (Code: ${error3.code})`
      }
    } catch (e) {
      columnsMethod3 = `Exception INSERT: ${e}`
    }
    
    // Método 4: Intentar con campos básicos uno por uno
    const basicFields = ['id', 'title', 'description', 'price', 'userId', 'user_id', 'created_at', 'updated_at']
    const fieldTests: any = {}
    
    for (const field of basicFields) {
      try {
        const testData: any = {}
        testData[field] = field === 'price' ? 1 : 'test'
        
        const { data, error } = await supabase
          .from('properties')
          .insert(testData)
          .select()
        
        if (!error) {
          fieldTests[field] = 'EXISTE - INSERT exitoso'
        } else {
          fieldTests[field] = `Error: ${error.message} (${error.code})`
        }
      } catch (e) {
        fieldTests[field] = `Exception: ${e}`
      }
    }
    
    return NextResponse.json({
      status: 'analysis_complete',
      timestamp: new Date().toISOString(),
      methods: {
        method1_rpc: columnsMethod1,
        method2_select: columnsMethod2,
        method3_empty_insert: columnsMethod3,
        method4_field_tests: fieldTests
      },
      analysis: {
        table_exists: !columnsMethod2?.includes('PGRST204'),
        has_rls_blocking: columnsMethod2?.includes('42501') || columnsMethod3?.includes('42501'),
        possible_columns: Object.keys(fieldTests).filter(field => 
          fieldTests[field].includes('EXISTE') || 
          !fieldTests[field].includes('PGRST204')
        )
      },
      next_steps: [
        'Verificar qué campos realmente existen basado en los errores',
        'Ajustar el endpoint /api/properties/create para usar solo campos existentes',
        'Configurar RLS si es necesario'
      ]
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
