import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      error: 'operator does not exist: text = uuid',
      analysis: 'Problema de esquema en storage.objects - conflicto de tipos'
    }

    // Test 1: Verificar si el bucket property-images existe
    try {
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
      
      if (bucketsError) {
        diagnostics.bucketsTest = `ERROR: ${bucketsError.message}`
      } else {
        const propertyImagesBucket = buckets?.find(b => b.name === 'property-images')
        diagnostics.bucketsTest = `OK - ${buckets?.length || 0} buckets`
        diagnostics.propertyImagesBucket = propertyImagesBucket ? 'EXISTE' : 'NO_EXISTE'
        diagnostics.bucketsList = buckets?.map(b => b.name) || []
      }
    } catch (e: any) {
      diagnostics.bucketsTest = `EXCEPTION: ${e.message}`
    }

    // Test 2: Verificar si podemos hacer una query simple a storage.objects
    try {
      const { data, error } = await supabaseAdmin
        .from('objects')
        .select('bucket_id, name')
        .limit(1)
      
      if (error) {
        diagnostics.objectsTest = `ERROR: ${error.message}`
      } else {
        diagnostics.objectsTest = `OK - Query funciona`
      }
    } catch (e: any) {
      diagnostics.objectsTest = `EXCEPTION: ${e.message}`
    }

    // Test 3: Información sobre el problema específico
    diagnostics.possibleCauses = [
      'Bucket property-images no existe',
      'Políticas RLS mal configuradas',
      'Esquema de storage.objects corrupto',
      'Versión de Supabase incompatible'
    ]

    diagnostics.solutions = [
      'Crear bucket property-images manualmente',
      'Ejecutar SQL de configuración de storage',
      'Verificar políticas RLS',
      'Usar bucket existente (ej: avatars)'
    ]

    return NextResponse.json(diagnostics)
  } catch (e: any) {
    console.error('[Debug Storage Schema] exception:', e)
    return NextResponse.json({ 
      error: e.message,
      timestamp: new Date().toISOString(),
      type: 'ENDPOINT_ERROR'
    }, { status: 500 })
  }
}
