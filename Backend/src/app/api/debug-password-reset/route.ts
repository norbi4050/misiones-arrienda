import { NextResponse } from 'next/server'
import { createSupabaseBrowser } from 'lib/supabase/browser'

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseBrowser()
    
    // Obtener la sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Obtener la URL actual
    const url = new URL(request.url)
    const origin = url.origin
    
    // Información de debug
    const debugInfo = {
      timestamp: new Date().toISOString(),
      currentOrigin: origin,
      expectedRedirectURL: `${origin}/reset-password`,
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        },
        expiresAt: session.expires_at
      } : null,
      sessionError: sessionError?.message || null,
      
      // URLs configuradas que deberían estar en Supabase
      configuredURLs: [
        'http://localhost:3000/reset-password',
        'https://misionesarrienda.com.ar/reset-password',
        'https://www.misionesarrienda.com.ar/reset-password'
      ],
      
      // Verificar variables de entorno
      env: {
        supabaseURL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada ✅' : 'NO configurada ❌',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada ✅' : 'NO configurada ❌'
      },
      
      // Instrucciones
      instructions: {
        step1: 'Verifica que las URLs de arriba estén en Supabase Dashboard',
        step2: 'Authentication → URL Configuration → Redirect URLs',
        step3: 'Después de configurar, solicita un NUEVO enlace (el anterior no sirve)',
        step4: 'El enlace debe tener este formato: http://localhost:3000/reset-password#access_token=XXX&type=recovery'
      }
    }
    
    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
