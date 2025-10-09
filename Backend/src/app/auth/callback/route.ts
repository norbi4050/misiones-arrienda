import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Si hay un error, redirigir al login con el mensaje
  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Intercambiar el code por una sesión
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code:', exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`)
    }
    
    // Si la sesión se creó exitosamente, redirigir a reset-password
    if (data.session) {
      // Crear respuesta con redirección
      const response = NextResponse.redirect(`${requestUrl.origin}/reset-password`)
      
      // Establecer cookies de sesión
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        maxAge: data.session.expires_in,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      
      return response
    }
  }

  // Si no hay code, redirigir al home
  return NextResponse.redirect(requestUrl.origin)
}
