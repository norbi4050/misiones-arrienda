import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log('=== PROBANDO INSERCIÓN EN AGENTS ===')
    
    // Intentar insertar un agente con campos mínimos para descubrir la estructura
    const testAgent = {
      name: 'Test Agent',
      email: 'test@test.com'
    }
    
    console.log('Intentando insertar agente con campos mínimos:', testAgent)
    
    const { data: insertResult, error: insertError } = await supabase
      .from('agents')
      .insert(testAgent)
      .select()
      .single()
    
    if (insertError) {
      console.log('Error al insertar (esto nos ayuda a descubrir campos requeridos):', insertError)
      
      // Intentar con más campos comunes
      const testAgent2 = {
        name: 'Test Agent 2',
        email: 'test2@test.com',
        phone: '+54 376 123456'
      }
      
      console.log('Intentando con más campos:', testAgent2)
      
      const { data: insertResult2, error: insertError2 } = await supabase
        .from('agents')
        .insert(testAgent2)
        .select()
        .single()
      
      if (insertError2) {
        console.log('Error con más campos:', insertError2)
      } else {
        console.log('✅ Inserción exitosa con campos:', Object.keys(testAgent2))
        console.log('Agente creado:', insertResult2)
      }
      
      return NextResponse.json({
        success: true,
        investigation: {
          firstAttempt: {
            fields: testAgent,
            error: insertError
          },
          secondAttempt: {
            fields: testAgent2,
            result: insertResult2,
            error: insertError2
          }
        }
      })
    } else {
      console.log('✅ Inserción exitosa con campos mínimos:', insertResult)
      return NextResponse.json({
        success: true,
        investigation: {
          minimalFields: testAgent,
          result: insertResult,
          message: 'Agente creado con campos mínimos'
        }
      })
    }
    
  } catch (error) {
    console.error('Error probando inserción en agents:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
