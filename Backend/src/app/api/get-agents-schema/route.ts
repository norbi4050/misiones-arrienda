import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log('=== INVESTIGANDO TABLA AGENTS ===')
    
    // 1. Verificar si la tabla agents existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%agent%')
    
    console.log('Tablas que contienen "agent":', tables)
    
    // 2. Obtener estructura de la tabla agents
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'agents')
      .order('ordinal_position')
    
    console.log('Columnas de tabla agents:', columns)
    
    // 3. Intentar obtener un registro de ejemplo
    const { data: sampleAgent, error: sampleError } = await supabase
      .from('agents')
      .select('*')
      .limit(1)
      .single()
    
    console.log('Agente de ejemplo:', sampleAgent)
    console.log('Error al obtener agente:', sampleError)
    
    // 4. Contar total de agentes
    const { count, error: countError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
    
    console.log('Total de agentes:', count)
    
    return NextResponse.json({
      success: true,
      investigation: {
        tablesWithAgent: tables,
        agentsColumns: columns,
        sampleAgent: sampleAgent,
        totalAgents: count,
        errors: {
          tablesError,
          columnsError,
          sampleError,
          countError
        }
      }
    })
    
  } catch (error) {
    console.error('Error investigando tabla agents:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      investigation: 'failed'
    }, { status: 500 })
  }
}
