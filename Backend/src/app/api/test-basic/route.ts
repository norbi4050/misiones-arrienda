import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('🔍 Test básico iniciado...');
    
    // Test 1: Variables de entorno
    const envVars = {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
    
    console.log('🔍 Variables de entorno:', {
      URL_EXISTS: !!envVars.SUPABASE_URL,
      KEY_EXISTS: !!envVars.SUPABASE_ANON_KEY,
      URL_PREFIX: envVars.SUPABASE_URL?.substring(0, 30),
      KEY_PREFIX: envVars.SUPABASE_ANON_KEY?.substring(0, 30)
    });

    return NextResponse.json({
      success: true,
      message: "Test básico exitoso",
      timestamp: new Date().toISOString(),
      env_check: {
        URL_EXISTS: !!envVars.SUPABASE_URL,
        KEY_EXISTS: !!envVars.SUPABASE_ANON_KEY
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('🚨 Error en test básico:', error);
    return NextResponse.json({
      error: "Error en test básico",
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
