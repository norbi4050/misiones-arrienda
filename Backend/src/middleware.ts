import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  console.log('🔐 Middleware de autenticación activo:', request.nextUrl.pathname)
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Verificar autenticación
  const { data: { user }, error } = await supabase.auth.getUser()

  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/publicar', '/profile', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Rutas de autenticación (login, register)
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && (!user || error)) {
    console.log('❌ Acceso denegado - Usuario no autenticado')
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user && !error) {
    console.log('✅ Usuario ya autenticado - Redirigiendo a dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log('✅ Acceso permitido:', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - auth/callback (Supabase auth callback)
     * - auth/confirm (Supabase email confirmation)
     * - auth/reset-password (Supabase password reset)
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api|auth/callback|auth/confirm|auth/reset-password|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
