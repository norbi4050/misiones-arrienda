const fs = require('fs');
const path = require('path');

console.log('🔧 ACTIVANDO MIDDLEWARE DE SUPABASE');
console.log('===================================');

// Leer el middleware actual
const middlewarePath = 'Backend/src/middleware.ts';

try {
  const currentMiddleware = fs.readFileSync(middlewarePath, 'utf8');
  
  console.log('📄 Middleware actual detectado');
  
  // Crear el nuevo middleware con autenticación real
  const newMiddleware = `import { NextResponse, type NextRequest } from 'next/server'
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
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}`;

  // Crear backup del middleware actual
  const backupPath = 'Backend/src/middleware-backup.ts';
  fs.writeFileSync(backupPath, currentMiddleware);
  console.log('💾 Backup creado:', backupPath);

  // Escribir el nuevo middleware
  fs.writeFileSync(middlewarePath, newMiddleware);
  console.log('✅ Middleware de Supabase activado exitosamente');

  console.log('\n🎯 MIDDLEWARE ACTIVADO:');
  console.log('✅ Protección de rutas habilitada');
  console.log('✅ Autenticación con Supabase activa');
  console.log('✅ Redirecciones automáticas configuradas');
  
  console.log('\n🔒 RUTAS PROTEGIDAS:');
  console.log('- /dashboard (requiere login)');
  console.log('- /publicar (requiere login)');
  console.log('- /profile (requiere login)');
  console.log('- /admin (requiere login)');

  console.log('\n🚀 PRÓXIMOS PASOS:');
  console.log('1. Verifica que las variables de entorno estén configuradas');
  console.log('2. Inicia el servidor: cd Backend && npm run dev');
  console.log('3. Ejecuta el testing: node test-integracion-supabase-autenticacion-completo.js');

} catch (error) {
  console.log('❌ Error activando middleware:', error.message);
  console.log('\n💡 SOLUCIÓN:');
  console.log('1. Verifica que el archivo Backend/src/middleware.ts existe');
  console.log('2. Asegúrate de tener permisos de escritura');
  console.log('3. Ejecuta desde el directorio raíz del proyecto');
}
