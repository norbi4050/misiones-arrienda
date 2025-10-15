/**
 * Endpoint de diagnóstico para ver exactamente qué datos
 * está recibiendo el frontend del perfil
 */

export const dynamic = 'force-dynamic';

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

export async function GET(req: NextRequest) {
  const supabase = getServerSupabase(req);
  
  // 1. Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({
      error: "Not authenticated",
      authError: authError?.message
    }, { status: 401 });
  }

  // 2. Obtener perfil de user_profiles
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 3. Mapear perfil
  const mappedProfile = profileData ? mapUserProfile(profileData) : null;

  // 4. Retornar diagnóstico completo
  return NextResponse.json({
    diagnostic: {
      step1_auth_user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
      step2_user_profiles_raw: profileData || { error: profileError?.message },
      step3_mapped_profile: mappedProfile,
      step4_analysis: {
        has_userType_in_metadata: !!user.user_metadata?.userType,
        has_companyName_in_metadata: !!user.user_metadata?.companyName,
        has_name_in_metadata: !!user.user_metadata?.name,
        has_display_name_in_profiles: !!profileData?.display_name,
        mapped_userType: mappedProfile?.userType,
        mapped_name: mappedProfile?.name,
        mapped_companyName: mappedProfile?.companyName,
        mapped_isCompany: mappedProfile?.isCompany,
        is_agency_detected: mappedProfile?.userType === 'inmobiliaria',
      }
    }
  });
}
