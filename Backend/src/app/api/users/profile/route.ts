/**
 * /api/users/profile - Endpoint completo de perfil de usuario
 * 
 * GET: Retorna los datos completos del perfil del usuario autenticado
 * PUT: Actualiza los datos del perfil del usuario autenticado
 * 
 * Usa mapUserProfile para normalizar los datos a formato CurrentUser
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { mapUserProfile } from "@/lib/auth/mapUserProfile";

const CUSTOM_AUTH_COOKIE = "misiones-arrienda-auth";

function getChunkAware(store: ReturnType<typeof cookies>, base: string): string | undefined {
  const direct = store.get(base)?.value;
  if (direct) return direct;
  const parts: string[] = [];
  for (let i = 0; i < 12; i++) {
    const v = store.get(`${base}.${i}`)?.value;
    if (!v) break;
    parts.push(v);
  }
  return parts.length ? parts.join("") : undefined;
}

function aliasCookieGet(store: ReturnType<typeof cookies>, name: string) {
  return getChunkAware(store, name) ?? getChunkAware(store, CUSTOM_AUTH_COOKIE);
}

function getServerSupabase(req: NextRequest) {
  const store = cookies();
  const authHeader = req.headers.get("authorization") ?? undefined;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
      cookies: {
        get: (name: string) => aliasCookieGet(store, name),
        set: () => {},
        remove: () => {},
      },
    }
  );
}

/**
 * GET /api/users/profile
 * Obtiene el perfil del usuario autenticado
 */
export async function GET(req: NextRequest) {
  const supabase = getServerSupabase(req);
  
  // Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const hdrs = new Headers();
  hdrs.set("cache-control", "no-store");
  hdrs.set("x-build", process.env.VERCEL_GIT_COMMIT_SHA || "local");

  if (authError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" }, 
      { status: 401, headers: hdrs }
    );
  }

  // Obtener datos de tabla users (fuente de verdad para user_type)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('[API /users/profile GET] Error fetching user:', userError);
    return NextResponse.json(
      { error: "User not found", details: userError.message },
      { status: 404, headers: hdrs }
    );
  }

  if (!userData) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404, headers: hdrs }
    );
  }

  // Si el usuario es BUSCO/INQUILINO, obtener datos adicionales de user_profiles
  let profileData = userData;
  if (userData.user_type === 'inquilino' || userData.user_type === 'busco') {
    const { data: communityData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('userId', user.id)
      .maybeSingle();

    if (communityData) {
      // Combinar datos, priorizando userData para campos importantes como user_type
      profileData = {
        ...communityData,
        ...userData,
      };
    }
  }

  // Mapear a CurrentUser usando mapUserProfile
  const profile = mapUserProfile(profileData);

  if (!profile) {
    console.error('[API /users/profile GET] mapUserProfile returned null');
    return NextResponse.json(
      { error: "Failed to map profile data" },
      { status: 500, headers: hdrs }
    );
  }

  // DEBUG: Log para verificar que avatar está en el perfil
  console.log('[API /users/profile GET] Profile avatar:', profile.avatar);

  return NextResponse.json({ profile }, { headers: hdrs });
}

/**
 * PUT /api/users/profile
 * Actualiza el perfil del usuario autenticado
 */
export async function PUT(req: NextRequest) {
  const supabase = getServerSupabase(req);
  
  // Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const hdrs = new Headers();
  hdrs.set("cache-control", "no-store");
  hdrs.set("x-build", process.env.VERCEL_GIT_COMMIT_SHA || "local");

  if (authError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" }, 
      { status: 401, headers: hdrs }
    );
  }

  // Parsear body
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON body" }, 
      { status: 400, headers: hdrs }
    );
  }

  // Mapear campos del body a columnas de user_profiles y users
  // NOTA: NO incluir updated_at - esa columna no existe en Supabase REST API para user_profiles
  const userProfilesUpdate: any = {};
  const usersUpdate: any = { updated_at: new Date().toISOString() }; // users SÍ tiene updated_at

  if (body.displayName !== undefined || body.display_name !== undefined) {
    const displayName = body.displayName || body.display_name;
    userProfilesUpdate.display_name = displayName;
    usersUpdate.name = displayName; // También actualizar users.name
  }

  if (body.avatarUrl !== undefined || body.avatar_url !== undefined) {
    const avatarUrl = body.avatarUrl || body.avatar_url;
    userProfilesUpdate.avatar_url = avatarUrl;
    usersUpdate.avatar = avatarUrl; // También actualizar users.avatar
  }

  // FIX CRÍTICO: Usar service role client para bypassear RLS
  // Crear cliente con service role key para actualizaciones de DB
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[API /users/profile PUT] CRITICAL: SUPABASE_SERVICE_ROLE_KEY no está definida');
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500, headers: hdrs }
    );
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log(`[API /users/profile PUT] Actualizando perfil para user ${user.id}`, userProfilesUpdate, usersUpdate);

  // FIX: Actualizar AMBAS tablas para máxima compatibilidad
  // Esto maneja todos los casos: inquilinos, inmobiliarias nuevas, inmobiliarias migradas

  // Actualizar user_profiles (si existe)
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .update(userProfilesUpdate)
    .eq('userId', user.id)
    .select()
    .maybeSingle();

  if (profileError) {
    console.log(`[API /users/profile PUT] user_profiles update: ${profileError.message} (code: ${profileError.code})`);
  } else {
    console.log(`[API /users/profile PUT] user_profiles updated: ${profileData ? '1 row' : '0 rows'}`);
  }

  // Actualizar users (SIEMPRE)
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .update(usersUpdate)
    .eq('id', user.id)
    .select()
    .single();

  if (userError) {
    console.error('[API /users/profile PUT] Error updating users:', userError);
    console.error('[API /users/profile PUT] CRITICAL: Failed to update users table');
    // Si falla users pero profile funcionó, continuar con profile data
    if (!profileData) {
      return NextResponse.json(
        { error: "Failed to update profile", details: userError.message },
        { status: 500, headers: hdrs }
      );
    }
  } else {
    console.log(`[API /users/profile PUT] users updated: ${userData ? '1 row' : '0 rows'}`);
  }

  console.log(`[API /users/profile PUT] Final: user_profiles=${!!profileData}, users=${!!userData}`);

  // Obtener datos combinados para respuesta
  const finalData = profileData ? { ...profileData, ...userData } : userData;

  if (!finalData) {
    return NextResponse.json(
      { error: "Profile not found after update" },
      { status: 404, headers: hdrs }
    );
  }

  // Mapear a CurrentUser
  const profile = mapUserProfile(finalData);

  if (!profile) {
    console.error('[API /users/profile PUT] mapUserProfile returned null');
    return NextResponse.json(
      { error: "Failed to map updated profile data" },
      { status: 500, headers: hdrs }
    );
  }

  return NextResponse.json({ profile }, { headers: hdrs });
}
