import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Consultar el schema directamente desde information_schema
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'properties' })
    
    if (schemaError) {
      console.log('Error consultando schema, intentando método alternativo...')
      
      // Método alternativo: intentar insertar un registro vacío para ver qué columnas faltan
      const { error: insertError } = await supabase
        .from('properties')
        .insert({})
      
      return NextResponse.json({
        status: 'schema_check',
        message: 'Información del schema obtenida via error',
        insertError: insertError?.message || 'No error',
        errorDetails: insertError?.details || 'No details',
        errorHint: insertError?.hint || 'No hint'
      })
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Schema obtenido exitosamente',
      columns: schemaData
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Error interno',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
