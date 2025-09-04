import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Rutas que requieren autenticación
  const protectedRoutes = ['/profile', '/dashboard', '/publicar'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // Redirigir a login si no está autenticado
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Error en middleware:', error);
      const redirectUrl = new URL('/login', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};