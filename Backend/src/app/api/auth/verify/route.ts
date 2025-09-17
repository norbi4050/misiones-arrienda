import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
// `dynamic` es opcional en route handlers
// export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // OK: usar request dentro del handler
  const url = req.nextUrl; // en vez de new URL(request.url)
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  }

  try {
    // Aquí iría la lógica de verificación del token
    // Por ejemplo, verificar con JWT o base de datos

    // Simulación de verificación exitosa
    return NextResponse.json({
      success: true,
      message: 'Token verificado correctamente',
      token
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    return NextResponse.json({
      error: 'Error al verificar token'
    }, { status: 500 });
  }
}
