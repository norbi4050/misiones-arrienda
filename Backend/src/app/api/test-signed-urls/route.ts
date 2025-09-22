import { NextRequest, NextResponse } from 'next/server'
import { generateSignedUrl, isValidStorageKey } from '@/lib/signed-urls'

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== GET /api/test-signed-urls [${requestId}] ===`)

  try {
    // Key real de la auditoría
    const realKey = '6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg'
    
    const tests: any = {
      key_real: realKey,
      key_validation: isValidStorageKey(realKey),
      key_length: realKey.length,
      key_pattern_test: /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(realKey),
      signed_url_result: null as any,
      bucket_config: {
        bucket: 'property-images',
        expected_public: true
      },
      environment_check: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        service_role_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      }
    }

    console.log(`[${requestId}] Testing key validation:`, {
      key: realKey,
      isValid: tests.key_validation,
      length: tests.key_length
    })

    // Test de signed URL solo si la key es válida
    if (tests.key_validation) {
      console.log(`[${requestId}] Key válida, generando signed URL...`)
      tests.signed_url_result = await generateSignedUrl(realKey)
    } else {
      console.log(`[${requestId}] Key inválida, saltando generación de signed URL`)
      tests.signed_url_result = { error: 'Key inválida según isValidStorageKey()', key: realKey }
    }

    // Test directo con Supabase
    let directSupabaseTest = null
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Test directo de signed URL
      const { data: directSignedUrl, error: directError } = await supabase.storage
        .from('property-images')
        .createSignedUrl(realKey, 900)

      directSupabaseTest = {
        success: !directError,
        error: directError?.message,
        url: directSignedUrl?.signedUrl ? 'URL_GENERATED' : null
      }

      // Test de existencia del archivo
      const { data: fileExists, error: fileError } = await supabase.storage
        .from('property-images')
        .list('6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714')

      tests.file_exists_test = {
        success: !fileError,
        error: fileError?.message,
        files_found: fileExists?.length || 0,
        files: fileExists?.map(f => f.name) || []
      }

    } catch (error) {
      directSupabaseTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    const result = {
      requestId,
      timestamp: new Date().toISOString(),
      tests,
      direct_supabase_test: directSupabaseTest,
      conclusions: {
        key_validation_issue: !tests.key_validation,
        signed_url_working: tests.signed_url_result && 'url' in tests.signed_url_result,
        environment_ok: tests.environment_check.supabase_url && tests.environment_check.service_role_key,
        bucket_accessible: directSupabaseTest?.success
      }
    }

    console.log(`[${requestId}] Test results:`, result.conclusions)

    return NextResponse.json(result)

  } catch (error) {
    console.error(`[${requestId}] Error en test:`, error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId 
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
