// =====================================================
// DEV ONLY: Endpoint para obtener tu token de auth
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Método 1: Desde Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      return NextResponse.json({
        success: true,
        token,
        source: 'Authorization Header',
        instructions: 'Copia el token de arriba y úsalo en el script de testing'
      });
    }

    // Método 2: Desde cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Buscar cookies de Supabase
    const supabaseCookies = allCookies.filter(c => 
      c.name.includes('supabase') || 
      c.name.includes('auth')
    );

    if (supabaseCookies.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Token encontrado en cookies pero necesita ser extraído',
        cookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        instructions: [
          '1. Abre DevTools (F12)',
          '2. Ve a la pestaña Network',
          '3. Busca cualquier request a /api/',
          '4. En Headers, busca "Authorization: Bearer ..."',
          '5. Copia el token después de "Bearer "'
        ]
      });
    }

    // Método 3: Información de ayuda
    return NextResponse.json({
      success: false,
      message: 'No se encontró token en el request',
      help: {
        method1: 'Abre DevTools > Network > Busca un request a /api/ > Headers > Authorization',
        method2: 'Abre DevTools > Console > Ejecuta: Object.keys(localStorage).filter(k => k.includes("auth"))',
        method3: 'Usa el endpoint /api/users/profile y copia el header Authorization de ese request'
      },
      allHeaders: Object.fromEntries(request.headers.entries())
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
