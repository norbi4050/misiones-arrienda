import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envDebug = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      
      // Variables públicas (seguras de mostrar)
      supabaseUrl: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        prefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'undefined'
      },
      
      anonKey: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        prefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...' || 'undefined'
      },
      
      // Variable problemática (solo metadata, no el valor)
      serviceRole: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE,
        length: process.env.SUPABASE_SERVICE_ROLE?.length || 0,
        prefix: process.env.SUPABASE_SERVICE_ROLE?.substring(0, 20) + '...' || 'undefined',
        type: typeof process.env.SUPABASE_SERVICE_ROLE,
        isString: typeof process.env.SUPABASE_SERVICE_ROLE === 'string',
        isEmpty: process.env.SUPABASE_SERVICE_ROLE === '',
        isWhitespace: process.env.SUPABASE_SERVICE_ROLE?.trim() === ''
      },
      
      bucket: {
        exists: !!process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET,
        value: process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET || 'property-images (default)'
      },
      
      // Verificar todas las variables que empiecen con SUPABASE
      allSupabaseVars: Object.keys(process.env)
        .filter(key => key.includes('SUPABASE'))
        .map(key => ({
          name: key,
          exists: !!process.env[key],
          length: process.env[key]?.length || 0
        }))
    }

    return NextResponse.json(envDebug)
  } catch (e: any) {
    console.error('[Debug Env Vars] exception:', e)
    return NextResponse.json({ 
      error: e.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
