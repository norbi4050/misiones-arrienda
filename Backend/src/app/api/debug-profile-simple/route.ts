import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getServerSupabase() {
  try {
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          },
        },
      }
    );
  } catch (error: any) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}

export async function GET() {
  try {
    console.log('🔍 Debug: Iniciando debug de perfil...');
    
    // 1. Verificar variables de entorno
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      KEY_VALUE: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
    };
    
    console.log('🔍 Debug: Variables de entorno:', envCheck);

    if (!envCheck.SUPABASE_URL || !envCheck.SUPABASE_ANON_KEY) {
      return NextResponse.json({
        error: "Variables de entorno faltantes",
        details: envCheck
      }, { status: 500 });
    }

    // 2. Crear cliente Supabase
    console.log('🔍 Debug: Creando cliente Supabase...');
    const supabase = await getServerSupabase();
    console.log('🔍 Debug: Cliente Supabase creado exitosamente');

    // 3. Verificar autenticación
    console.log('🔍 Debug: Verificando autenticación...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('🚨 Debug: Error de autenticación:', authError);
      return NextResponse.json({
        error: "Error de autenticación",
        details: authError.message,
        step: "auth_check"
      }, { status: 401 });
    }

    if (!user) {
      console.log('⚠️ Debug: No hay usuario autenticado');
      return NextResponse.json({
        error: "No hay usuario autenticado",
        step: "auth_check"
      }, { status: 401 });
    }

    console.log('✅ Debug: Usuario autenticado:', user.email);

    // 4. Test básico de conexión a BD
    console.log('🔍 Debug: Probando conexión básica a BD...');
    const { data: testConnection, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('🚨 Debug: Error de conexión a BD:', connectionError);
      return NextResponse.json({
        error: "Error de conexión a base de datos",
        details: connectionError.message,
        step: "connection_test"
      }, { status: 500 });
    }

    console.log('✅ Debug: Conexión a BD exitosa');

    // 5. Test de lectura de perfil específico
    console.log('🔍 Debug: Probando lectura de perfil del usuario...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('🚨 Debug: Error leyendo perfil:', profileError);
      return NextResponse.json({
        error: "Error leyendo perfil del usuario",
        details: profileError.message,
        step: "profile_read",
        user_id: user.id
      }, { status: 500 });
    }

    console.log('✅ Debug: Perfil leído exitosamente:', profile);

    return NextResponse.json({
      success: true,
      message: "Debug completado exitosamente",
      data: {
        env_check: envCheck,
        user_authenticated: !!user,
        user_email: user.email,
        user_id: user.id,
        profile_found: !!profile,
        profile_data: profile
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('🚨 Debug: Error inesperado:', error);
    return NextResponse.json({
      error: "Error inesperado en debug",
      details: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      step: "unexpected_error"
    }, { status: 500 });
  }
}
