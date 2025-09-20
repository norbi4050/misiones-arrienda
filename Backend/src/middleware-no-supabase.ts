import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Middleware completamente sin Supabase para identificar causa raíz
  console.log(`[MIDDLEWARE] Request to: ${request.nextUrl.pathname}`);
  
  // Solo permitir acceso sin ninguna verificación
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
