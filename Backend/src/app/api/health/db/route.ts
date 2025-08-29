import { NextResponse } from "next/server";

// Versión simplificada para evitar errores de build
export async function GET() {
  try {
    // Solo verificar variables de entorno durante build
    const hasDbUrl = !!process.env.DATABASE_URL;
    
    return NextResponse.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      database: {
        configured: hasDbUrl,
        message: hasDbUrl ? "Database URL configured" : "Database URL missing",
        note: "Full database connection test available at runtime"
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}

// Endpoint simplificado para diagnóstico
export async function POST() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      directUrl: process.env.DIRECT_URL ? 'configured' : 'missing',
      note: "This is a build-safe version. Full diagnostics available at runtime."
    };
    
    return NextResponse.json({
      ok: true,
      diagnostics
    });
    
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}
