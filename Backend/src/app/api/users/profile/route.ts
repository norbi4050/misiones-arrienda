// src/app/api/users/profile/route.ts
// PROMPTS 1-12: SSR Auth con cookies + Bearer + needsOnboarding
// Runtime nodejs para soporte completo de cookies
export const runtime = 'nodejs'
export const revalidate = 0
export const dynamic = 'force-dynamic'

import { NextResponse, NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { mapUserProfile } from "@/lib/auth/mapUserProfile";
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

// FIX-401: Helper para reconstruir cookies chunkeadas (base + .0, .1, .2...)
function getChunkAware(cookieStore: ReturnType<typeof cookies>, baseName: string): string | undefined {
  const base = cookieStore.get(baseName)?.value;
  if (base) return base;
  
  const parts: string[] = [];
  for (let i = 0; i < 12; i++) { // límite de seguridad
    const v = cookieStore.get(`${baseName}.${i}`)?.value;
    if (!v) break;
    parts.push(v);
  }
  return parts.length ? parts.join("") : undefined;
}

// PROMPT 1: Función SSR que soporta cookies Y Bearer token simultáneamente
function getServerSupabase(request: NextRequest) {
  const cookieStore = cookies();
  const authHeader = request.headers.get("authorization") ?? undefined;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Si viene Authorization: Bearer ..., que Supabase lo use
      global: authHeader ? { headers: { Authorization: authHeader } } : undefined,

      // ¡CLAVE! Supabase leerá cookies usando ESTE get (reconstruye chunks)
      cookies: {
        get: (name: string) => getChunkAware(cookieStore, name),
        set: (name, value, options) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Cookies solo se pueden modificar en Route Handlers
          }
        },
        remove: (name, options) => {
          try {
            cookieStore.set({ name, value: "", expires: new Date(0), ...options });
          } catch {
            // Cookies solo se pueden modificar en Route Handlers
          }
        },
      },
    }
  );
}

// PROMPT 2: Helper getJoinColumn - determina columna correcta por tabla
function getJoinColumn(table: string): string {
  return table === 'UserProfile' ? 'userId' : 'id';
}

// PROMPT 2: Helper safeSelectByUserId - usa columna correcta y maneja errores
async function safeSelectByUserId(
  supabase: any, 
  table: 'UserProfile' | 'user_profiles', 
  userId: string
) {
  const col = getJoinColumn(table);
  
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(col, userId)
      .maybeSingle();
    
    // PGRST116 = no rows (no es error)
    if (error && error.code !== 'PGRST116') {
      console.warn(`[profiles] read ${table} error`, { code: error.code });
      return null;
    }
    
    return data ?? null;
  } catch (err) {
    console.warn(`[profiles] ${table} exception:`, err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const supabase = getServerSupabase(req);
  
  // PROMPT 7: Logging mínimo (solo en dev)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[profile:get]', {
      hasAuthHeader: !!req.headers.get('Authorization'),
      hasCookie0: !!cookies().get('misiones-arrienda-auth.0'),
    });
  }
  
  // PROMPT 1: Usar getUser() en lugar de getSession() para auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // PROMPT 1: Devolver 401 SOLO si no hay usuario
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Not authenticated' }, 
      { 
        status: 401,
        headers: { 'Cache-Control': 'no-store' } // PROMPT 8
      }
    );
  }

  const userId = user.id;
  const userType = user.user_metadata?.userType ?? null;

  try {
    // PROMPT 3: Intentar leer perfil con fallback
    let profile: any = null;
    
    if (userType === 'inmobiliaria') {
      // 1) Primero intentar perfil de inmobiliaria
      profile = await safeSelectByUserId(supabase, 'user_profiles', userId);
      
      // 2) Fallback opcional a agency_profiles si existe
      if (!profile) {
        try {
          const { data } = await supabase
            .from('agency_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          profile = data;
        } catch {
          // Ignorar si agency_profiles no existe
        }
      }
    } else {
      // PROMPT 3: inquilino / dueño_directo - intentar UserProfile primero
      profile = await safeSelectByUserId(supabase, 'UserProfile', userId);
      
      // PROMPT 3: Fallback a user_profiles por id
      if (!profile) {
        profile = await safeSelectByUserId(supabase, 'user_profiles', userId);
      }
    }

    // PROMPT 3: Devolver respuesta con needsOnboarding
    // IMPORTANTE: 200 con needsOnboarding: true (NO 401)
    return NextResponse.json(
      {
        user: { 
          id: userId, 
          email: user.email, 
          userType 
        },
        profile,
        needsOnboarding: !profile  // PROMPT 3: boolean flag
      },
      {
        headers: { 'Cache-Control': 'no-store' } // PROMPT 1 & 8
      }
    );
  } catch (error) {
    // PROMPT 7: Try/catch para errores no-críticos
    console.error('[profile:get] error:', error);
    
    // Devolver null + needsOnboarding en lugar de 500
    return NextResponse.json(
      {
        user: { 
          id: userId, 
          email: user.email, 
          userType 
        },
        profile: null,
        needsOnboarding: true
      },
      {
        headers: { 'Cache-Control': 'no-store' }
      }
    );
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
