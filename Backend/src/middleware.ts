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

  // ========================================
  // AUTHENTICATION CHECK (Unified)
  // ========================================
  // Get user session ONCE and reuse for all checks
  let user = null;
  let authError = null;

  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    user = authUser;
    authError = error;

    if (authError) {
      console.log(`[MIDDLEWARE] Auth error: ${authError.message}`);
    } else if (user) {
      console.log(`[MIDDLEWARE] User authenticated: ${user.id}`);
    } else {
      console.log(`[MIDDLEWARE] No authenticated user`);
    }
  } catch (error) {
    console.error('[MIDDLEWARE] Exception getting user:', error);
    authError = error;
  }

  // ========================================
  // PLAN EXPIRATION CHECK
  // ========================================
  // Verificar y expirar plan si corresponde (solo para inmobiliarias)
  if (user) {
    try {
      // Verificar si es inmobiliaria
      const { data: userData } = await supabase
        .from('users')
        .select('user_type, plan_tier, plan_end_date')
        .eq('id', user.id)
        .maybeSingle();

      const isAgency = userData?.user_type?.toUpperCase() === 'INMOBILIARIA' ||
                      userData?.user_type?.toUpperCase() === 'AGENCY';

      // Solo verificar expiración para inmobiliarias con plan
      if (isAgency && userData?.plan_tier && userData?.plan_end_date) {
        const planEndDate = new Date(userData.plan_end_date);
        const now = new Date();

        // Si el plan expiró, llamar a la función de expiración
        if (planEndDate < now) {
          console.log(`[MIDDLEWARE] Plan expired for user ${user.id}, auto-expiring...`);

          // Llamar a la función PostgreSQL para expirar el plan
          try {
            const { error } = await supabase.rpc('expire_user_plan', { user_uuid: user.id });
            if (error) {
              console.error('[MIDDLEWARE] Failed to expire plan:', error);
            }
          } catch (err) {
            console.error('[MIDDLEWARE] Failed to expire plan:', err);
          }
        }
      }
    } catch (error) {
      console.error('[MIDDLEWARE] Error checking plan expiration:', error);
      // No bloquear, solo log el error
    }
  }

  // ========================================
  // ADMIN ROUTES PROTECTION
  // ========================================
  // Proteger TODAS las rutas /admin/* y /api/admin/*
  // EXCEPTO /api/admin/check que es público (devuelve true/false)
  const isAdminCheckEndpoint = pathname === '/api/admin/check';
  const isAdminRoute = (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && !isAdminCheckEndpoint;

  if (isAdminRoute) {
    // Si no hay usuario, redirigir a login
    if (authError || !user) {
      console.log(`[MIDDLEWARE] Admin route without auth, redirecting to login: ${pathname}`);
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Verificar si el usuario es admin
    const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.toLowerCase() || '';
    const userEmail = user.email?.toLowerCase() || '';

    const isAdmin = userEmail === SUPER_ADMIN_EMAIL || ADMIN_EMAILS.includes(userEmail);

    if (!isAdmin) {
      console.warn(`[SECURITY] Non-admin user attempted to access admin route: ${userEmail} -> ${pathname}`);
      // Redirigir a home sin revelar que la ruta existe
      return NextResponse.redirect(new URL('/', req.url));
    }

    console.log(`[MIDDLEWARE] Admin access granted: ${userEmail} -> ${pathname}`);
  }

  // ========================================
  // PROTECTED ROUTES CHECK
  // ========================================
  const protectedRoutes = ['/profile', '/publicar', '/favorites', '/messages', '/mi-cuenta'];
  const isProtectedRoute = protectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (authError || !user) {
      console.log(`[MIDDLEWARE] Redirecting to login: ${pathname}`);
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ========================================
  // COMUNIDAD ACCESS GUARD (Inmobiliarias)
  // ========================================
  if (req.nextUrl.pathname.startsWith('/comunidad')) {
    const FEATURE_COMMUNITY_SOFT_GUARD = process.env.NEXT_PUBLIC_FEATURE_COMMUNITY_SOFT_GUARD !== 'false';

    // Only check if user is authenticated
    if (user) {
      try {
        // Verificar si es inmobiliaria
        const { data: userData } = await supabase
          .from('users')
          .select('user_type, is_company')
          .eq('id', user.id)
          .maybeSingle();

        const isAgency = userData?.is_company === true ||
                        userData?.user_type?.toUpperCase() === 'INMOBILIARIA' ||
                        userData?.user_type?.toUpperCase() === 'AGENCY';

        if (isAgency) {
          if (!FEATURE_COMMUNITY_SOFT_GUARD) {
            console.log('[MIDDLEWARE] Agency blocked from /comunidad (legacy mode)');
            return NextResponse.redirect(new URL('/mi-empresa', req.url));
          } else {
            console.log('[MIDDLEWARE] Agency accessing /comunidad with soft-guard');
          }
        }
      } catch (error) {
        console.error('[MIDDLEWARE] Error checking agency status:', error);
        // Fail-open: permitir acceso en caso de error
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};