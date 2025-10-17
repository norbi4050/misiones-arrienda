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

  // Construir objeto de actualización solo con campos permitidos
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  // Mapear campos del body a columnas de user_profiles
  if (body.displayName !== undefined) {
    updateData.display_name = body.displayName;
  }
  if (body.avatarUrl !== undefined) {
    updateData.avatar_url = body.avatarUrl;
  }
  if (body.display_name !== undefined) {
    updateData.display_name = body.display_name;
  }
  if (body.avatar_url !== undefined) {
    updateData.avatar_url = body.avatar_url;
  }

  // Actualizar en user_profiles usando userId (no id)
  const { data: updatedData, error: updateError } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('userId', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('[API /users/profile PUT] Error updating profile:', updateError);
    return NextResponse.json(
      { error: "Failed to update profile", details: updateError.message }, 
      { status: 500, headers: hdrs }
    );
  }

  if (!updatedData) {
    return NextResponse.json(
      { error: "Profile not found after update" }, 
      { status: 404, headers: hdrs }
    );
  }

  // Mapear a CurrentUser
  const profile = mapUserProfile(updatedData);

  if (!profile) {
    console.error('[API /users/profile PUT] mapUserProfile returned null');
    return NextResponse.json(
      { error: "Failed to map updated profile data" }, 
      { status: 500, headers: hdrs }
    );
  }

  return NextResponse.json({ profile }, { headers: hdrs });
}
