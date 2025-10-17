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
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
        get(name: string) {
          // FIX: Handle chunked cookies (misiones-arrienda-auth.0, misiones-arrienda-auth.1, etc.)
          // @supabase/ssr splits large cookies into chunks, we need to reconstruct them
          const cookie = req.cookies.get(name);
          if (cookie) {
            console.log(`[MIDDLEWARE] Found cookie: ${name}`);
            return cookie.value;
          }

          // Check for chunked cookies (name.0, name.1, name.2, etc.)
          const chunks: string[] = [];
          let chunkIndex = 0;

          while (true) {
            const chunkName = `${name}.${chunkIndex}`;
            const chunk = req.cookies.get(chunkName);

            if (!chunk) {
              break; // No more chunks
            }

            chunks.push(chunk.value);
            chunkIndex++;
          }

          // If we found chunks, reconstruct the full value
          if (chunks.length > 0) {
            console.log(`[MIDDLEWARE] Reconstructed chunked cookie: ${name} (${chunks.length} chunks)`);
            return chunks.join('');
          }

          console.log(`[MIDDLEWARE] Cookie not found: ${name}`);
          return undefined;
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