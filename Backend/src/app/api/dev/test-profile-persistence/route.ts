// Test endpoint para validar persistencia en user_profiles
import { NextResponse, NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

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
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ 
        error: "Not authenticated",
        test: "FAIL",
        step: "auth_check"
      }, { status: 401 });
    }

    // Test 1: Verificar que user_profiles table existe y es accesible
    const { data: tableTest, error: tableError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (tableError) {
      return NextResponse.json({
        error: "user_profiles table not accessible",
        test: "FAIL",
        step: "table_access",
        details: tableError.message
      }, { status: 500 });
    }

    // Test 2: Buscar perfil del usuario actual
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({
        error: "Error fetching user profile",
        test: "FAIL", 
        step: "profile_fetch",
        details: profileError.message
      }, { status: 500 });
    }

    // Test 3: Crear perfil de prueba si no existe
    if (!profile) {
      const testProfile = {
        user_id: user.id,
        role: 'BUSCO',
        city: 'Test City',
        neighborhood: 'Test Neighborhood',
        budget_min: 50000,
        budget_max: 150000,
        bio: 'Test bio for profile persistence',
        age: 25,
        pet_pref: 'INDIFERENTE',
        smoke_pref: 'NO_FUMADOR',
        diet: 'NINGUNA',
        schedule_notes: 'Test schedule',
        tags: ['test', 'profile'],
        accepts_messages: true,
        is_suspended: false,
        is_paid: false
      };

      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .upsert(testProfile, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (createError) {
        return NextResponse.json({
          error: "Error creating test profile",
          test: "FAIL",
          step: "profile_create",
          details: createError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        test: "PASS",
        message: "Profile created successfully",
        user_id: user.id,
        profile: newProfile,
        steps_completed: ["auth_check", "table_access", "profile_create"]
      });
    }

    // Test 4: Actualizar perfil existente
    const updateData = {
      bio: `Updated bio at ${new Date().toISOString()}`,
      budget_min: 60000,
      budget_max: 180000
    };

    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({
        error: "Error updating profile",
        test: "FAIL",
        step: "profile_update", 
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      test: "PASS",
      message: "Profile updated successfully",
      user_id: user.id,
      profile: updatedProfile,
      steps_completed: ["auth_check", "table_access", "profile_fetch", "profile_update"]
    });

  } catch (error) {
    return NextResponse.json({
      error: "Unexpected error",
      test: "FAIL",
      step: "exception",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getServerSupabase();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    
    // Test enum validation
    const validRoles = ['BUSCO', 'OFREZCO', 'TENANT', 'OWNER', 'AGENCY'];
    const validPetPrefs = ['SI_PET', 'NO_PET', 'INDIFERENTE'];
    const validSmokePrefs = ['FUMADOR', 'NO_FUMADOR', 'INDIFERENTE'];
    const validDiets = ['NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO'];

    if (body.role && !validRoles.includes(body.role)) {
      return NextResponse.json({
        error: "Invalid role enum",
        test: "PASS", // Expected behavior
        valid_values: validRoles
      }, { status: 400 });
    }

    if (body.petPref && !validPetPrefs.includes(body.petPref)) {
      return NextResponse.json({
        error: "Invalid petPref enum", 
        test: "PASS", // Expected behavior
        valid_values: validPetPrefs
      }, { status: 400 });
    }

    // Test successful upsert
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ user_id: user.id, ...body }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({
        error: "Upsert failed",
        test: "FAIL",
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      test: "PASS",
      message: "Upsert successful",
      profile: data
    });

  } catch (error) {
    return NextResponse.json({
      error: "Unexpected error",
      test: "FAIL", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
