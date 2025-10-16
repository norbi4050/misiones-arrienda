import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LEGACY_ROUTES } from '@/lib/legal-constants';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ========================================
  // SECURITY: Protección de Rutas Debug
  // ========================================
  // Bloquear TODAS las rutas /api/debug-* en producción
  if (pathname.startsWith('/api/debug-')) {
    // Capa 1: NODE_ENV check
    const isProduction = process.env.NODE_ENV === 'production';

    // Capa 2: Feature flag (más confiable que NODE_ENV)
    const debugEnabled = process.env.ENABLE_DEBUG_ENDPOINTS === 'true';

    if (isProduction || !debugEnabled) {
      console.warn(`[SECURITY] Blocked debug endpoint: ${pathname} (NODE_ENV=${process.env.NODE_ENV}, DEBUG_ENABLED=${debugEnabled})`);
      return new NextResponse('Not Found', { status: 404 });
    }

    // En desarrollo, permitir con log
    console.log(`[DEBUG] Allowed access to: ${pathname}`);
  }

  // Redirects 301 para rutas legales legacy
  if (pathname in LEGACY_ROUTES) {
    const canonicalUrl = new URL(LEGACY_ROUTES[pathname as keyof typeof LEGACY_ROUTES], req.url);
    return NextResponse.redirect(canonicalUrl, { status: 301 });
  }

  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Rutas que requieren autenticación
  const protectedRoutes = ['/profile', '/publicar', '/favorites', '/messages', '/mi-cuenta'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
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

  // [AuthBridge] Guard: Bloquear /comunidad para inmobiliarias
  // GUARD: soft-guard habilitado por FEATURE_COMMUNITY_SOFT_GUARD; evitamos 307 en /comunidad
  if (req.nextUrl.pathname.startsWith('/comunidad')) {
    // Importar flag dinámicamente para evitar problemas de edge runtime
    const FEATURE_COMMUNITY_SOFT_GUARD = process.env.NEXT_PUBLIC_FEATURE_COMMUNITY_SOFT_GUARD !== 'false';
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Verificar si es inmobiliaria
        const { data: userData } = await supabase
          .from('users')
          .select('user_type, is_company')
          .eq('id', user.id)
          .single();

        const isAgency = userData?.is_company === true || 
                        userData?.user_type?.toUpperCase() === 'INMOBILIARIA' ||
                        userData?.user_type?.toUpperCase() === 'AGENCY';

        if (isAgency) {
          // GUARD: Si soft-guard está activo, NO redirigir (dejar pasar a RSC)
          // Si está desactivado, mantener comportamiento legacy (redirect 307)
          if (!FEATURE_COMMUNITY_SOFT_GUARD) {
            console.log('[Middleware] Agency user blocked from /comunidad, redirecting to /mi-empresa (legacy mode)');
            return NextResponse.redirect(new URL('/mi-empresa', req.url));
          } else {
            console.log('[Middleware] Agency user accessing /comunidad with soft-guard enabled (no redirect)');
            // Continuar sin redirect - el RSC mostrará el EmptyState
          }
        }
      }
    } catch (error) {
      console.error('[Middleware] Error checking agency status:', error);
      // En caso de error, permitir acceso (fail-open)
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};