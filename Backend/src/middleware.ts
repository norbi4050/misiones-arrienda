import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register', '/properties', '/', '/terms', '/privacy'];
  const adminRoutes = ['/admin', '/api/admin'];

  // Añadir protección para ruta /admin en middleware
  if (pathname.startsWith('/admin')) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    try {
      const { data: user } = await supabase
        .from('users')
        .select('isAdmin')
        .eq('id', session.user.id)
        .single();
      if (!user?.isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('Error verificando admin:', error);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || (route !== '/' && pathname.startsWith(route))
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Crear cliente Supabase
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Redirigir a login si no hay sesión
  if (!session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Verificar admin para rutas admin
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('isAdmin')
        .eq('id', session.user.id)
        .single();
        
      if (!user?.isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // Si hay error al verificar admin, redirigir a dashboard por seguridad
      console.error('Error verificando admin:', error);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
