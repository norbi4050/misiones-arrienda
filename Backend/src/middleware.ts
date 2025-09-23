// src/middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Dejá pasar rutas públicas:
  const publicPaths = [
    '/',               // home
    '/comunidad',      // pública
    '/login',          // login público
    '/api/community/profiles', // API pública
  ]
  
  if (
    publicPaths.includes(req.nextUrl.pathname) ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api') || // si tus APIs públicas necesitan pasar
    req.nextUrl.pathname.startsWith('/favicon') ||
    req.nextUrl.pathname.startsWith('/assets') ||
    req.nextUrl.pathname.startsWith('/images')
  ) {
    return NextResponse.next()
  }

  // si quisieras proteger otras rutas, acá harías el check de sesión con cookies header, etc.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
