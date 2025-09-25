// src/app/api/users/profile/route.ts
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
          // Next 13/14: set acepta objeto con name/value/opciones
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // eliminar = set con maxAge pasado
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

  // Obtener datos de users y user_profiles para construir avatar_url único
  const [usersResult, profilesResult] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_profiles").select("photos, updated_at").eq("id", user.id).maybeSingle()
  ]);

  if (usersResult.error) return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
  if (!usersResult.data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const userData = usersResult.data;
  const userProfile = profilesResult.data;

  // Construir avatar_url con fuente única: photos[0] → profile_image (DEPRECATED) → fallback
  const avatarUrl = 
    userProfile?.photos?.[0] ??
    userData.profile_image ??  // DEPRECATED fallback temporal
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=0D8ABC&color=fff&size=200`;

  // Calcular v = epoch de user_profiles.updated_at
  const v = userProfile?.updated_at 
    ? Math.floor(new Date(userProfile.updated_at).getTime() / 1000)
    : 0;

  // Construir respuesta con avatar_url único y v para cache-busting
  const profileWithAvatar = {
    ...userData,
    avatar_url: avatarUrl,
    v: v
  };

  return NextResponse.json({ profile: profileWithAvatar }, { status: 200 });
}

export async function PUT(req: NextRequest) {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}

  // Transform data types to match database schema
  const transformedBody: any = { ...body };

  // Convert familySize to integer
  if (transformedBody.familySize !== undefined) {
    if (transformedBody.familySize === "") {
      transformedBody.family_size = null;
    } else {
      const familySizeNum = parseInt(transformedBody.familySize);
      transformedBody.family_size = isNaN(familySizeNum) ? null : familySizeNum;
    }
    delete transformedBody.familySize;
  }

  // Convert petFriendly to boolean
  if (transformedBody.petFriendly !== undefined) {
    transformedBody.pet_friendly = transformedBody.petFriendly === "true" || transformedBody.petFriendly === true;
    delete transformedBody.petFriendly;
  }

  // Convert moveInDate to date or null
  if (transformedBody.moveInDate !== undefined) {
    if (transformedBody.moveInDate === "" || transformedBody.moveInDate === "flexible") {
      transformedBody.move_in_date = null;
    } else {
      // Try to parse the date, if it fails, set to null
      const date = new Date(transformedBody.moveInDate);
      transformedBody.move_in_date = isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }
    delete transformedBody.moveInDate;
  }

  // Convert monthlyIncome to numeric
  if (transformedBody.monthlyIncome !== undefined) {
    if (transformedBody.monthlyIncome === "") {
      transformedBody.monthly_income = null;
    } else {
      // Remove any non-numeric characters except decimal point
      const cleanIncome = transformedBody.monthlyIncome.toString().replace(/[^\d.]/g, '');
      const incomeNum = parseFloat(cleanIncome);
      transformedBody.monthly_income = isNaN(incomeNum) ? null : incomeNum;
    }
    delete transformedBody.monthlyIncome;
  }

  // Rename camelCase fields to snake_case
  if (transformedBody.searchType !== undefined) {
    transformedBody.search_type = transformedBody.searchType;
    delete transformedBody.searchType;
  }

  if (transformedBody.budgetRange !== undefined) {
    transformedBody.budget_range = transformedBody.budgetRange;
    delete transformedBody.budgetRange;
  }

  if (transformedBody.profileImage !== undefined) {
    transformedBody.profile_image = transformedBody.profileImage;
    delete transformedBody.profileImage;
  }

  if (transformedBody.preferredAreas !== undefined) {
    transformedBody.preferred_areas = transformedBody.preferredAreas;
    delete transformedBody.preferredAreas;
  }

  if (transformedBody.employmentStatus !== undefined) {
    transformedBody.employment_status = transformedBody.employmentStatus;
    delete transformedBody.employmentStatus;
  }

  const payload = { id: user.id, ...transformedBody };

  const { data, error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}

  // Transform data types to match database schema
  const transformedBody: any = { ...body };

  // Convert familySize to integer
  if (transformedBody.familySize !== undefined) {
    if (transformedBody.familySize === "") {
      transformedBody.family_size = null;
    } else {
      const familySizeNum = parseInt(transformedBody.familySize);
      transformedBody.family_size = isNaN(familySizeNum) ? null : familySizeNum;
    }
    delete transformedBody.familySize;
  }

  // Convert petFriendly to boolean
  if (transformedBody.petFriendly !== undefined) {
    transformedBody.pet_friendly = transformedBody.petFriendly === "true" || transformedBody.petFriendly === true;
    delete transformedBody.petFriendly;
  }

  // Convert moveInDate to date or null
  if (transformedBody.moveInDate !== undefined) {
    if (transformedBody.moveInDate === "" || transformedBody.moveInDate === "flexible") {
      transformedBody.move_in_date = null;
    } else {
      // Try to parse the date, if it fails, set to null
      const date = new Date(transformedBody.moveInDate);
      transformedBody.move_in_date = isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }
    delete transformedBody.moveInDate;
  }

  // Convert monthlyIncome to numeric
  if (transformedBody.monthlyIncome !== undefined) {
    if (transformedBody.monthlyIncome === "") {
      transformedBody.monthly_income = null;
    } else {
      // Remove any non-numeric characters except decimal point
      const cleanIncome = transformedBody.monthlyIncome.toString().replace(/[^\d.]/g, '');
      const incomeNum = parseFloat(cleanIncome);
      transformedBody.monthly_income = isNaN(incomeNum) ? null : incomeNum;
    }
    delete transformedBody.monthlyIncome;
  }

  // Rename camelCase fields to snake_case
  if (transformedBody.searchType !== undefined) {
    transformedBody.search_type = transformedBody.searchType;
    delete transformedBody.searchType;
  }

  if (transformedBody.budgetRange !== undefined) {
    transformedBody.budget_range = transformedBody.budgetRange;
    delete transformedBody.budgetRange;
  }

  if (transformedBody.profileImage !== undefined) {
    transformedBody.profile_image = transformedBody.profileImage;
    delete transformedBody.profileImage;
  }

  if (transformedBody.preferredAreas !== undefined) {
    transformedBody.preferred_areas = transformedBody.preferredAreas;
    delete transformedBody.preferredAreas;
  }

  if (transformedBody.employmentStatus !== undefined) {
    transformedBody.employment_status = transformedBody.employmentStatus;
    delete transformedBody.employmentStatus;
  }

  const payload = { id: user.id, ...transformedBody };

  const { data, error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Profile patch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data }, { status: 200 });
}
