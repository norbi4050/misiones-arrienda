// src/app/api/users/profile/route.ts
// PROMPT 1: Endpoint robusto con soporte cookies + Bearer + needsOnboarding
export const runtime = 'edge'
export const revalidate = 0
export const dynamic = 'force-dynamic'

import { NextResponse, NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { mapUserProfile } from "@/lib/auth/mapUserProfile";
// PROMPT D1: Importar guardas de displayName
import { applyDisplayNameGuards, logGuardApplication } from '@/lib/displayname-guards';

// Zod schema for user_profiles validation
const UserProfileSchema = z.object({
  role: z.enum(['BUSCO', 'OFREZCO', 'TENANT', 'OWNER', 'AGENCY']).optional(),
  city: z.string().min(1).optional(),
  neighborhood: z.string().nullable().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  bio: z.string().nullable().optional(),
  photos: z.array(z.string()).nullable().optional(),
  age: z.number().min(0).max(120).nullable().optional(),
  petPref: z.enum(['SI_PET', 'NO_PET', 'INDIFERENTE']).nullable().optional(),
  smokePref: z.enum(['FUMADOR', 'NO_FUMADOR', 'INDIFERENTE']).nullable().optional(),
  diet: z.enum(['NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO']).nullable().optional(),
  scheduleNotes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  acceptsMessages: z.boolean().nullable().optional(),
  highlightedUntil: z.string().nullable().optional(),
  isSuspended: z.boolean().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isPaid: z.boolean().nullable().optional(),
  // PROMPT D1: Agregar soporte para actualizar name en users table
  name: z.string().min(1).max(80).optional(),
});

// PROMPT 1: Función que soporta cookies O Bearer token
function getServerSupabase(request: NextRequest) {
  const cookieStore = cookies();
  const authz = request.headers.get('authorization'); // "Bearer <token>" si el cliente lo manda

  // Si hay Bearer token, usarlo (fallback para inmobiliarias)
  if (authz) {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authz } },
        cookies: { 
          get() { return undefined; }, 
          set() {}, 
          remove() {} 
        }
      }
    );
  }

  // Caso normal: usar cookies (inquilinos, dueños directos)
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
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

export async function GET(req: NextRequest) {
  // PROMPT 1: Usar función mejorada que soporta Bearer token
  const supabase = getServerSupabase(req);
  
  // 2) Autenticar
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (!user || uerr) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // [FIX-400] Soporte para query param ?id=userId para consultar otros perfiles
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('id') || user.id;
    
    console.debug('[Profile API] Fetching profile for user:', targetUserId);

    // STEP 1: Get user data from users table (contains is_company, user_type, etc.)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, phone, user_type, is_company, company_name, license_number, property_count, verified, email_verified, created_at, updated_at')
      .eq('id', targetUserId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: "Error fetching user data" }, { status: 500 });
    }

    // [DEBUG] Log datos crudos de la BD
    console.log('[Profile API] Raw userData from DB:', {
      id: userData?.id,
      email: userData?.email,
      user_type: userData?.user_type,
      is_company: userData?.is_company,
      company_name: userData?.company_name
    });

    // 3) Traer perfil de UserProfile (puede NO existir si es la 1ra vez con "inmobiliaria")
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    // PROMPT 1: Si error real (distinto de "no rows"), devolver error
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user_profiles:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 4) PROMPT 1: Si no hay perfil, devolver 200 con needsOnboarding
    if (!profileData) {
      const userType = userData?.user_type ?? (user.user_metadata as any)?.userType ?? null;
      return NextResponse.json({
        user: { id: user.id, email: user.email, userType },
        profile: null,
        needsOnboarding: true
      });
    }

    // 5) Perfil ok - Merge data from both tables and normalize
    // IMPORTANTE: Priorizar user_type de users sobre role de user_profiles
    const mergedData = {
      ...profileData,  // Primero profileData
      ...userData,     // Luego userData (sobrescribe)
      // Forzar que user_type y is_company de users table tengan prioridad absoluta
      user_type: userData?.user_type,
      is_company: userData?.is_company,
      // NO usar role de profileData, solo user_type de users
      role: undefined,  // Eliminar role de profileData para evitar conflictos
    };

    // Normalizar usando mapUserProfile para consistencia
    const normalizedProfile = mapUserProfile(mergedData);

    if (!normalizedProfile) {
      return NextResponse.json({ error: "Failed to normalize profile" }, { status: 500 });
    }

    // Agregar campos adicionales que no están en mapUserProfile
    const completeProfile = {
      ...normalizedProfile,
      // Campos adicionales de user_profiles
      role: profileData?.role || 'BUSCO',
      city: profileData?.city || '',
      neighborhood: profileData?.neighborhood || null,
      budgetMin: profileData?.budget_min || null,
      budgetMax: profileData?.budget_max || null,
      photos: profileData?.photos || null,
      petPref: profileData?.pet_pref || null,
      smokePref: profileData?.smoke_pref || null,
      diet: profileData?.diet || null,
      scheduleNotes: profileData?.schedule_notes || null,
      tags: profileData?.tags || null,
      acceptsMessages: profileData?.accepts_messages !== undefined ? profileData.accepts_messages : true,
      highlightedUntil: profileData?.highlighted_until || null,
      isSuspended: profileData?.is_suspended || false,
      expiresAt: profileData?.expires_at || null,
      isPaid: profileData?.is_paid || false,
      propertyCount: userData?.property_count,
      isVerified: userData?.verified || false,
      emailVerified: userData?.email_verified || false,
      created_at: userData?.created_at,
      updated_at: userData?.updated_at,
    };

    // PROMPT 1: Siempre devolver 200 con needsOnboarding: false cuando hay perfil
    return NextResponse.json({
      user: { 
        id: user.id, 
        email: user.email, 
        userType: completeProfile.userType ?? userData?.user_type ?? (user.user_metadata as any)?.userType ?? null 
      },
      profile: completeProfile,
      needsOnboarding: false
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return handleProfileUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleProfileUpdate(req);
}

async function handleProfileUpdate(req: NextRequest) {
  // PROMPT 1: Usar función mejorada que soporta Bearer token
  const supabase = getServerSupabase(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    // ====================== SAFE-FIX NORMALIZACIÓN BODY ======================
    // ROLLBACK hint: restaurar al bloque original si es necesario
    
    // Helper: convierte "" y null → undefined
    const toNonEmpty = (v: unknown) => {
      if (typeof v === 'string') {
        const s = v.trim();
        return s.length ? s : undefined;   // "" -> undefined
      }
      return v === null ? undefined : v;   // null -> undefined
    };
    
    // Helper: valida números o devuelve undefined
    const toNumberOrUndef = (v: unknown) =>
      typeof v === 'number' && Number.isFinite(v) ? v : undefined;

    let raw: any = {};
    try { 
      raw = await req.json(); 
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // SAFE-FIX: aceptar wrapper { profile: {...} } o JSON plano
    const src = raw?.profile ?? raw;

    // SAFE-FIX: Log para debugging (ROLLBACK hint: remover en producción)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Profile Update] Raw keys:', Object.keys(raw));
      if (raw.profile) {
        console.log('[Profile Update] Nested profile keys:', Object.keys(raw.profile));
      }
    }

    // SAFE-FIX: normalizar campos ("" / null -> undefined)
    const normalized = {
      name: toNonEmpty(src.name ?? src.displayName),
      role: toNonEmpty(src.role),
      city: toNonEmpty(src.city),
      neighborhood: src.neighborhood ?? null,
      bio: src.bio ?? null,
      budgetMin: toNumberOrUndef(src.budgetMin),
      budgetMax: toNumberOrUndef(src.budgetMax),
      age: src.age ?? null,
      petPref: toNonEmpty(src.petPref),
      smokePref: toNonEmpty(src.smokePref),
      diet: toNonEmpty(src.diet),
      scheduleNotes: src.scheduleNotes ?? null,
      tags: Array.isArray(src.tags) ? src.tags : null,
      acceptsMessages: typeof src.acceptsMessages === 'boolean' ? src.acceptsMessages : null,
      highlightedUntil: src.highlightedUntil ?? null,
      isSuspended: typeof src.isSuspended === 'boolean' ? src.isSuspended : null,
      expiresAt: src.expiresAt ?? null,
      isPaid: typeof src.isPaid === 'boolean' ? src.isPaid : null,
      photos: Array.isArray(src.photos) ? src.photos : null,
    };

    // SAFE-FIX: limpiar undefined
    const cleanedData = Object.fromEntries(
      Object.entries(normalized).filter(([_, v]) => v !== undefined)
    );

    // SAFE-FIX: validar con Zod actual
    const validation = UserProfileSchema.safeParse(cleanedData);
    if (!validation.success) {
      // SAFE-FIX: Log detallado en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.error('[Profile Update] Validation failed:', validation.error.flatten());
      }
      return NextResponse.json({ 
        error: "Validation failed", 
        issues: validation.error.flatten()
      }, { status: 400 });
    }

    const validatedData = validation.data;

    // ====================== SAFE-FIX (WRITE v1: columnas reales) ======================
    // ROLLBACK hint: restaurar al bloque de upsert anterior si es necesario
    
    // Construir patch SOLO con columnas que existen hoy: display_name, updated_at
    const patch: any = { updated_at: new Date().toISOString() };

    // Si el payload incluye "name", mapear a display_name
    if (validatedData.name !== undefined) {
      patch.display_name = validatedData.name;
    }

    // Hacemos UPDATE por id (auth.uid()) y seleccionamos SOLO columnas reales
    let row;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(patch)
        .eq('id', user.id)
        .select('id, display_name, avatar_url, updated_at')
        .single();

      if (error) {
        // Si no hay fila (0 rows), intentar insert mínimo y reintentar el update
        // ROLLBACK hint: eliminar este bloque si no se desea auto-insertar
        if ((error as any)?.code === 'PGRST116') {
          const { error: insErr } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              display_name: patch.display_name ?? null,
              updated_at: patch.updated_at,
            });
          if (insErr) throw insErr;

          const { data: data2, error: err2 } = await supabase
            .from('user_profiles')
            .update(patch)
            .eq('id', user.id)
            .select('id, display_name, avatar_url, updated_at')
            .single();
          if (err2) throw err2;
          row = data2;
        } else {
          throw error;
        }
      } else {
        row = data;
      }
    } catch (e: any) {
      console.error('[users/profile] DB error:', e?.message || e);
      return NextResponse.json({ error: e?.message ?? 'DB error' }, { status: 500 });
    }

    // Armar respuesta en camelCase + versión cache-busting
    const v = Math.floor(new Date(row.updated_at).getTime() / 1000);
    const responsePayload = {
      id: row.id,
      name: row.display_name ?? null,
      avatarUrl: row.avatar_url ?? null,
      v,
    };

    // Cache-Control estricto
    return NextResponse.json(
      { success: true, profile: responsePayload },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
    // ====================== /SAFE-FIX =================================================
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
