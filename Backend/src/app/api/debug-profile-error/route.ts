import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

async function getServerSupabase() {
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
}

export async function GET() {
  const supabase = await getServerSupabase();
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    step: 'inicio',
    errors: []
  };

  try {
    debugInfo.step = 'verificando_auth';
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      debugInfo.errors.push(`Auth error: ${authError.message}`);
      return NextResponse.json({
        error: "Error de autenticación",
        debug: debugInfo
      }, { status: 401 });
    }

    if (!user) {
      debugInfo.errors.push('Usuario no encontrado');
      return NextResponse.json({
        error: "Usuario no autenticado",
        debug: debugInfo
      }, { status: 401 });
    }

    debugInfo.user = {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    };

    debugInfo.step = 'verificando_tabla_users';

    // Verificar si la tabla 'users' existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');

    if (tablesError) {
      debugInfo.errors.push(`Error verificando tabla: ${tablesError.message}`);
    } else {
      debugInfo.tableExists = tables && tables.length > 0;
    }

    debugInfo.step = 'intentando_select_profile';

    // Intentar obtener perfil
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, name, email, phone, avatar, bio, verified, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      debugInfo.errors.push(`Profile error: ${profileError.message}`);
      debugInfo.profileError = {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      };
    } else {
      debugInfo.profileFound = !!profile;
      debugInfo.profile = profile;
    }

    debugInfo.step = 'verificando_schema_users';

    // Verificar schema de la tabla users
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');

    if (columnsError) {
      debugInfo.errors.push(`Error verificando columnas: ${columnsError.message}`);
    } else {
      debugInfo.tableSchema = columns;
    }

    return NextResponse.json({
      success: debugInfo.errors.length === 0,
      debug: debugInfo,
      message: "Debug de perfil completado"
    });

  } catch (error) {
    debugInfo.step = 'error_inesperado';
    debugInfo.errors.push(`Error inesperado: ${error instanceof Error ? error.message : 'Unknown'}`);
    
    return NextResponse.json({
      error: "Error inesperado en debug",
      debug: debugInfo
    }, { status: 500 });
  }
}
