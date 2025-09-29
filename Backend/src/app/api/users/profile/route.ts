// src/app/api/users/profile/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

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

export async function GET(_req: NextRequest) {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    // Get profile from user_profiles table
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: "Error fetching profile" }, { status: 500 });
    }

    // If no profile found, return empty profile ready for editing
    if (!profile) {
      return NextResponse.json({ 
        profile: {
          role: 'BUSCO',
          city: '',
          neighborhood: null,
          budgetMin: null,
          budgetMax: null,
          bio: null,
          photos: null,
          age: null,
          petPref: null,
          smokePref: null,
          diet: null,
          scheduleNotes: null,
          tags: null,
          acceptsMessages: true,
          highlightedUntil: null,
          isSuspended: false,
          expiresAt: null,
          isPaid: false,
        }
      });
    }

    // Convert snake_case to camelCase for frontend
    const payload = {
      role: profile.role,
      city: profile.city,
      neighborhood: profile.neighborhood,
      budgetMin: profile.budget_min,
      budgetMax: profile.budget_max,
      bio: profile.bio,
      photos: profile.photos,
      age: profile.age,
      petPref: profile.pet_pref,
      smokePref: profile.smoke_pref,
      diet: profile.diet,
      scheduleNotes: profile.schedule_notes,
      tags: profile.tags,
      acceptsMessages: profile.accepts_messages,
      highlightedUntil: profile.highlighted_until,
      isSuspended: profile.is_suspended,
      expiresAt: profile.expires_at,
      isPaid: profile.is_paid,
    };

    return NextResponse.json({ profile: payload });
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
    let body: any = {};
    try { 
      body = await req.json(); 
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Validate with Zod
    const validation = UserProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const validatedData = validation.data;

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
    };

    return NextResponse.json({ profile: responsePayload }, { status: 200 });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
