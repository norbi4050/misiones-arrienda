import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const config: any = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'CONFIGURADA' : 'FALTANTE',
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADA' : 'FALTANTE',
      bucket: process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET || 'property-images (default)',
      timestamp: new Date().toISOString()
    }

    console.debug('[Debug Config]', config)

    // Test conexión si las variables están
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        // Test simple de conexión
        const { data, error } = await supabaseAdmin.storage.listBuckets()
        
        if (error) {
          config.connectionTest = `ERROR: ${error.message}`
        } else {
          config.connectionTest = `OK - ${data?.length || 0} buckets encontrados`
          config.buckets = data?.map(b => b.name) || []
        }
      } catch (e: any) {
        config.connectionTest = `EXCEPTION: ${e.message}`
      }
    } else {
      config.connectionTest = 'SKIP - Variables faltantes'
    }

    return NextResponse.json(config)
  } catch (e: any) {
    console.error('[Debug Config] exception:', e)
    return NextResponse.json({ 
      error: e.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
