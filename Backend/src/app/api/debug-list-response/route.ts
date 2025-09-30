import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const propertyId = url.searchParams.get('propertyId') || '09dfbd44-26e0-4e9b-882d-416bb8b06e31'
    const ownerId = url.searchParams.get('ownerId') || '6403f9d2-e846-4c70-87e0-e051127d9500'
    
    const BUCKET = 'property-images'
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('[DEBUG LIST] Starting debug for:', { propertyId, ownerId, BUCKET })

    // Test 1: Verificar conexión básica
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    // Test 2: Listar archivos en el prefix
    const prefix = `${ownerId}/${propertyId}`
    const { data: items, error: listError } = await supabaseAdmin
      .storage.from(BUCKET)
      .list(prefix, { limit: 100 })

    // Test 3: Generar URLs públicas
    let publicUrls: Array<{name: string, key: string, url: string, size: number, created: string}> = []
    if (items && !listError) {
      const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(prefix)
      const base = pub.publicUrl.replace(/\/$/, '')
      
      publicUrls = items
        .filter(it => it.name !== '.empty')
        .map(it => ({
          name: it.name,
          key: `${prefix}/${it.name}`,
          url: `${base}/${it.name}`,
          size: it.metadata?.size || 0,
          created: it.created_at
        }))
    }

    // Test 4: Verificar archivos directamente en storage
    const { data: allFiles, error: allError } = await supabaseAdmin
      .storage.from(BUCKET)
      .list('', { limit: 1000 })

    const matchingFiles = allFiles?.filter(f => f.name.includes(ownerId) || f.name.includes(propertyId)) || []

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      debug: {
        propertyId,
        ownerId,
        prefix,
        BUCKET
      },
      tests: {
        bucketsConnection: bucketsError ? `ERROR: ${bucketsError.message}` : `OK - ${buckets?.length} buckets`,
        listFiles: listError ? `ERROR: ${listError.message}` : `OK - ${items?.length} files`,
        publicUrls: publicUrls.length,
        allFilesInBucket: allFiles?.length || 0,
        matchingFiles: matchingFiles.length
      },
      results: {
        rawItems: items,
        processedUrls: publicUrls,
        matchingFilesInBucket: matchingFiles
      },
      expectedResponse: {
        items: publicUrls,
        count: publicUrls.length
      }
    })
  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message,
      timestamp: new Date().toISOString(),
      type: 'DEBUG_LIST_ERROR'
    }, { status: 500 })
  }
}
