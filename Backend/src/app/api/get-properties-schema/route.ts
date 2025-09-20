import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Probar con campos muy básicos primero
    const basicFields = [
      'id',
      'title', 
      'description',
      'price',
      'created_at',
      'updated_at'
    ]
    
    // Intentar con solo campos básicos
    const testData1 = {
      title: 'TEST_BASIC',
      description: 'Test básico',
      price: 1
    }
    
    console.log('🔍 Probando campos básicos:', Object.keys(testData1))
    
    const { data: data1, error: error1 } = await supabase
      .from('properties')
      .insert(testData1)
      .select()
    
    if (error1) {
      // Si falla con campos básicos, probar solo con title
      const testData2 = { title: 'TEST_MINIMAL' }
      
      console.log('🔍 Probando campo mínimo:', Object.keys(testData2))
      
      const { data: data2, error: error2 } = await supabase
        .from('properties')
        .insert(testData2)
        .select()
      
      return NextResponse.json({
        status: 'schema_detection',
        basicFieldsTest: {
          error: error1.message,
          code: error1.code,
          testedFields: Object.keys(testData1)
        },
        minimalFieldTest: {
          error: error2?.message || 'SUCCESS',
          code: error2?.code || 'SUCCESS',
          testedFields: Object.keys(testData2),
          insertedData: data2
        },
        timestamp: new Date().toISOString()
      })
    }
    
    // Si funciona con campos básicos
    return NextResponse.json({
      status: 'success',
      message: 'Campos básicos funcionan',
      insertedData: data1,
      availableColumns: data1 && data1.length > 0 ? Object.keys(data1[0]) : [],
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
