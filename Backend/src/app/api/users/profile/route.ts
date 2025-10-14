// src/app/api/users/profile/route.ts
// Force dynamic rendering for Vercel
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

function getServerSupabase() {
  const cookieStore = cookies();
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
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

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

    // STEP 2: Get profile from user_profiles table (optional, contains preferences)
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    // Note: profileError is not critical, user_profiles is optional
    if (profileError) {
      console.warn('Warning fetching user_profiles (non-critical):', profileError);
    }

    // STEP 3: Merge data from both tables and normalize using mapUserProfile
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

    return NextResponse.json({ profile: completeProfile });
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
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    // SAFE-FIX: Parse JSON with error handling
    let raw: any = {};
    try { 
      raw = await req.json(); 
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // SAFE-FIX: Normalizar body - aceptar wrapper { profile: {...} } o JSON plano
    const src = raw?.profile ?? raw;

    // SAFE-FIX: Log para debugging (ROLLBACK hint: remover en producción)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Profile Update] Raw keys:', Object.keys(raw));
      if (raw.profile) {
        console.log('[Profile Update] Nested profile keys:', Object.keys(raw.profile));
      }
    }

    // SAFE-FIX: Normalizar campos con alias comunes
    const normalized = {
      role: src.role,
      city: src.city,
      neighborhood: src.neighborhood ?? null,
      budgetMin: src.budgetMin,
      budgetMax: src.budgetMax,
      bio: src.bio ?? null,
      photos: src.photos ?? null,
      age: src.age ?? null,
      petPref: src.petPref ?? null,
      smokePref: src.smokePref ?? null,
      diet: src.diet ?? null,
      scheduleNotes: src.scheduleNotes ?? null,
      tags: src.tags ?? null,
      acceptsMessages: src.acceptsMessages ?? null,
      highlightedUntil: src.highlightedUntil ?? null,
      isSuspended: src.isSuspended ?? null,
      expiresAt: src.expiresAt ?? null,
      isPaid: src.isPaid ?? null,
      // SAFE-FIX: Aceptar displayName como alias de name
      name: src.name ?? src.displayName,
    };

    // SAFE-FIX: Remover campos undefined para evitar escribir nulls innecesarios
    const cleanedData = Object.fromEntries(
      Object.entries(normalized).filter(([_, v]) => v !== undefined)
    );

    // SAFE-FIX: Validar con Zod usando datos normalizados
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

    // ========================================
    // PROMPT D1: Si se está actualizando el name, aplicar guardas
    // ========================================
    if (validatedData.name !== undefined) {
      console.log('🛡️ [PROFILE_UPDATE] Aplicando guardas de displayName...');
      
      // Obtener datos actuales del usuario
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching current user:', userError);
        return NextResponse.json({ error: "Error fetching user data" }, { status: 500 });
      }

      if (currentUser) {
        // Aplicar guardas con el name existente para no sobrescribirlo si es válido
        const guardResult = applyDisplayNameGuards(
          validatedData.name,
          currentUser.email,
          currentUser.name // existing name - no sobrescribir si es válido
        );

        // Log de auditoría
        logGuardApplication('profile_edit', {
          email: currentUser.email,
          name: guardResult.name,
          source: guardResult.source,
          wasModified: guardResult.wasModified,
          reason: guardResult.reason
        });

        // Actualizar en la tabla users
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            name: guardResult.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user name:', updateError);
          return NextResponse.json({ error: "Error updating name" }, { status: 500 });
        }

        console.log(`✅ [PROFILE_UPDATE] Name updated successfully: "${guardResult.name}"`);
      }
    }

    // ========================================
    // Actualizar user_profiles (preferencias)
    // ========================================
    // Convert camelCase to snake_case for database
    const dbPayload: any = {
      user_id: user.id, // Always include user_id for upsert
    };

    if (validatedData.role !== undefined) dbPayload.role = validatedData.role;
    if (validatedData.city !== undefined) dbPayload.city = validatedData.city;
    if (validatedData.neighborhood !== undefined) dbPayload.neighborhood = validatedData.neighborhood;
    if (validatedData.budgetMin !== undefined) dbPayload.budget_min = validatedData.budgetMin;
    if (validatedData.budgetMax !== undefined) dbPayload.budget_max = validatedData.budgetMax;
    if (validatedData.bio !== undefined) dbPayload.bio = validatedData.bio;
    if (validatedData.photos !== undefined) dbPayload.photos = validatedData.photos;
    if (validatedData.age !== undefined) dbPayload.age = validatedData.age;
    if (validatedData.petPref !== undefined) dbPayload.pet_pref = validatedData.petPref;
    if (validatedData.smokePref !== undefined) dbPayload.smoke_pref = validatedData.smokePref;
    if (validatedData.diet !== undefined) dbPayload.diet = validatedData.diet;
    if (validatedData.scheduleNotes !== undefined) dbPayload.schedule_notes = validatedData.scheduleNotes;
    if (validatedData.tags !== undefined) dbPayload.tags = validatedData.tags;
    if (validatedData.acceptsMessages !== undefined) dbPayload.accepts_messages = validatedData.acceptsMessages;
    if (validatedData.highlightedUntil !== undefined) dbPayload.highlighted_until = validatedData.highlightedUntil;
    if (validatedData.isSuspended !== undefined) dbPayload.is_suspended = validatedData.isSuspended;
    if (validatedData.expiresAt !== undefined) dbPayload.expires_at = validatedData.expiresAt;
    if (validatedData.isPaid !== undefined) dbPayload.is_paid = validatedData.isPaid;

    // Upsert to user_profiles table
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(dbPayload, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert response back to camelCase
    const responsePayload = {
      role: data.role,
      city: data.city,
      neighborhood: data.neighborhood,
      budgetMin: data.budget_min,
      budgetMax: data.budget_max,
      bio: data.bio,
      photos: data.photos,
      age: data.age,
      petPref: data.pet_pref,
      smokePref: data.smoke_pref,
      diet: data.diet,
      scheduleNotes: data.schedule_notes,
      tags: data.tags,
      acceptsMessages: data.accepts_messages,
      highlightedUntil: data.highlighted_until,
      isSuspended: data.is_suspended,
      expiresAt: data.expires_at,
      isPaid: data.is_paid,
      // PROMPT D1: Incluir name actualizado si fue modificado
      ...(validatedData.name !== undefined && { name: validatedData.name })
    };

    // SAFE-FIX: Calcular versión para cache busting
    const v = Math.floor(new Date().getTime() / 1000);

    return NextResponse.json(
      { 
        success: true,
        profile: { ...responsePayload, v }
      }, 
      { 
        status: 200,
        // SAFE-FIX: Headers para evitar caché
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
