import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log('🔍 Obteniendo estructura REAL de Supabase...')
    
    // Obtener TODAS las tablas que realmente existen
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (tablesError) {
      return NextResponse.json({
        status: 'error',
        error: `No se pueden obtener las tablas: ${tablesError.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    const realSchema: any = {}
    
    // Para cada tabla, obtener sus columnas REALES
    for (const table of tables || []) {
      const tableName = table.table_name
      console.log(`📋 Analizando tabla: ${tableName}`)
      
      try {
        // Obtener columnas reales de cada tabla
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position')
        
        if (columnsError) {
          realSchema[tableName] = {
            status: 'error',
            error: columnsError.message
          }
        } else {
          realSchema[tableName] = {
            status: 'success',
            columns: columns || [],
            column_names: (columns || []).map(col => col.column_name),
            column_count: (columns || []).length
          }
        }
        
        // Intentar obtener una fila de muestra para ver la estructura real
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!sampleError && sampleData && sampleData.length > 0) {
          realSchema[tableName].sample_structure = Object.keys(sampleData[0])
          realSchema[tableName].has_data = true
        } else {
          realSchema[tableName].has_data = false
          realSchema[tableName].sample_error = sampleError?.message
        }
        
      } catch (tableError) {
        realSchema[tableName] = {
          status: 'error',
          error: tableError instanceof Error ? tableError.message : 'Unknown error'
        }
      }
    }
    
    // Análisis específico de la tabla properties
    const propertiesAnalysis = realSchema.properties ? {
      exists: true,
      columns: realSchema.properties.column_names || [],
      has_userId: realSchema.properties.column_names?.includes('userId') || false,
      has_user_id: realSchema.properties.column_names?.includes('user_id') || false,
      has_title: realSchema.properties.column_names?.includes('title') || false,
      has_description: realSchema.properties.column_names?.includes('description') || false,
      has_price: realSchema.properties.column_names?.includes('price') || false,
      total_columns: realSchema.properties.column_count || 0
    } : {
      exists: false,
      error: 'Tabla properties no encontrada'
    }
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      total_tables: tables?.length || 0,
      table_names: (tables || []).map(t => t.table_name),
      properties_analysis: propertiesAnalysis,
      full_schema: realSchema,
      recommendations: generateSchemaRecommendations(realSchema, propertiesAnalysis)
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function generateSchemaRecommendations(realSchema: any, propertiesAnalysis: any) {
  const recommendations = []
  
  if (!propertiesAnalysis.exists) {
    recommendations.push({
      type: 'critical',
      issue: 'Tabla properties no existe',
      action: 'Crear tabla properties en Supabase'
    })
  } else {
    if (!propertiesAnalysis.has_userId && !propertiesAnalysis.has_user_id) {
      recommendations.push({
        type: 'critical',
        issue: 'Tabla properties no tiene columna userId ni user_id',
        action: 'Agregar columna para relacionar con usuarios',
        sql: 'ALTER TABLE properties ADD COLUMN user_id UUID REFERENCES auth.users(id);'
      })
    }
    
    if (!propertiesAnalysis.has_title) {
      recommendations.push({
        type: 'critical',
        issue: 'Tabla properties no tiene columna title',
        action: 'Agregar columna title',
        sql: 'ALTER TABLE properties ADD COLUMN title TEXT NOT NULL;'
      })
    }
    
    if (!propertiesAnalysis.has_description) {
      recommendations.push({
        type: 'critical',
        issue: 'Tabla properties no tiene columna description',
        action: 'Agregar columna description',
        sql: 'ALTER TABLE properties ADD COLUMN description TEXT;'
      })
    }
    
    if (!propertiesAnalysis.has_price) {
      recommendations.push({
        type: 'critical',
        issue: 'Tabla properties no tiene columna price',
        action: 'Agregar columna price',
        sql: 'ALTER TABLE properties ADD COLUMN price NUMERIC NOT NULL;'
      })
    }
  }
  
  return recommendations
}
