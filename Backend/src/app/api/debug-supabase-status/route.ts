import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      envVars: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'CONFIGURADA' : 'FALTANTE',
        serviceRole: process.env.SUPABASE_SERVICE_ROLE ? 'CONFIGURADA' : 'FALTANTE',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'CONFIGURADA' : 'FALTANTE',
        bucket: process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET || 'property-images (default)'
      }
    }

    // Test 1: Verificar si las variables están realmente cargadas
    if (process.env.SUPABASE_SERVICE_ROLE) {
      diagnostics.serviceRoleLength = process.env.SUPABASE_SERVICE_ROLE.length
      diagnostics.serviceRolePrefix = process.env.SUPABASE_SERVICE_ROLE.substring(0, 20) + '...'
    }

    // Test 2: Intentar crear cliente con anon key (básico)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabaseAnon = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        
        // Test simple de conectividad
        const { data, error } = await supabaseAnon.from('properties').select('count').limit(1)
        
        if (error) {
          diagnostics.anonTest = `ERROR: ${error.message}`
          diagnostics.possibleCause = error.message.includes('paused') ? 'PROYECTO_PAUSADO' : 'OTRO_ERROR'
        } else {
          diagnostics.anonTest = 'OK - Conexión básica funciona'
        }
      } catch (e: any) {
        diagnostics.anonTest = `EXCEPTION: ${e.message}`
        diagnostics.possibleCause = e.message.includes('fetch') ? 'CONECTIVIDAD' : 'CONFIGURACION'
      }
    }

    // Test 3: Intentar crear cliente con service role (si está disponible)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE
        )
        
        // Test de storage específicamente
        const { data, error } = await supabaseAdmin.storage.listBuckets()
        
        if (error) {
          diagnostics.serviceTest = `ERROR: ${error.message}`
          diagnostics.possibleCause = error.message.includes('paused') ? 'PROYECTO_PAUSADO' : 'SERVICE_ROLE_INVALIDO'
        } else {
          diagnostics.serviceTest = `OK - ${data?.length || 0} buckets encontrados`
          diagnostics.buckets = data?.map(b => b.name) || []
          
          // Test específico del bucket property-images
          const bucket = process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET || 'property-images'
          const bucketExists = data?.some(b => b.name === bucket)
          diagnostics.propertyImagesBucket = bucketExists ? 'EXISTE' : 'NO_EXISTE'
        }
      } catch (e: any) {
        diagnostics.serviceTest = `EXCEPTION: ${e.message}`
        diagnostics.possibleCause = e.message.includes('fetch') ? 'PROYECTO_PAUSADO_O_CONECTIVIDAD' : 'SERVICE_ROLE_PROBLEMA'
      }
    }

    // Test 4: Verificar si el proyecto está pausado
    if (diagnostics.possibleCause === 'PROYECTO_PAUSADO') {
      diagnostics.recommendation = 'Verificar en Supabase Dashboard si el proyecto está pausado por falta de pago'
    } else if (diagnostics.possibleCause === 'SERVICE_ROLE_INVALIDO') {
      diagnostics.recommendation = 'Regenerar Service Role key en Supabase Dashboard > Settings > API'
    } else if (diagnostics.possibleCause === 'CONECTIVIDAD') {
      diagnostics.recommendation = 'Verificar conexión a internet y URL de Supabase'
    }

    return NextResponse.json(diagnostics)
  } catch (e: any) {
    console.error('[Debug Supabase Status] exception:', e)
    return NextResponse.json({ 
      error: e.message,
      timestamp: new Date().toISOString(),
      possibleCause: 'ENDPOINT_ERROR'
    }, { status: 500 })
  }
}
