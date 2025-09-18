import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// GET - Obtener perfil del usuario
export async function GET() {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener perfil con avatar_path como SSoT
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        name,
        email,
        phone,
        avatar_path,
        location,
        bio,
        search_type,
        budget_range,
        preferred_areas,
        family_size,
        pet_friendly,
        move_in_date,
        employment_status,
        monthly_income,
        verified,
        created_at,
        updated_at
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({
        error: "Error al obtener perfil: " + profileError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile
    }, { status: 200 });

  } catch (error) {
    console.error('Error in profile GET:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PATCH - Actualizar perfil (incluyendo avatar_path)
export async function PATCH(request: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener datos del request
    const updateData = await request.json();

    // Campos permitidos para actualización
    const allowedFields = [
      'name', 'email', 'phone', 'avatar_path', 'location', 'bio',
      'search_type', 'budget_range', 'preferred_areas', 'family_size',
      'pet_friendly', 'move_in_date', 'employment_status', 'monthly_income'
    ];

    // Filtrar solo campos permitidos
    const filteredData: any = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Agregar timestamp de actualización
    filteredData.updated_at = new Date().toISOString();

    // Actualizar perfil en la base de datos
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(filteredData)
      .eq('id', user.id)
      .select('avatar_path, updated_at')
      .single();

    if (updateError) {
      return NextResponse.json({
        error: "Error al actualizar perfil: " + updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      avatar_path: updatedProfile?.avatar_path || null,
      updated_at: updatedProfile?.updated_at,
      message: "Perfil actualizado correctamente"
    }, { status: 200 });

  } catch (error) {
    console.error('Error in profile PATCH:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar perfil completo
export async function PUT(request: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener datos del request
    const profileData = await request.json();

    // Preparar datos para actualización
    const updateData = {
      name: profileData.name || null,
      email: profileData.email || user.email,
      phone: profileData.phone || null,
      avatar_path: profileData.avatar_path || null,
      location: profileData.location || null,
      bio: profileData.bio || null,
      search_type: profileData.search_type || null,
      budget_range: profileData.budget_range || null,
      preferred_areas: profileData.preferred_areas || null,
      family_size: profileData.family_size || null,
      pet_friendly: profileData.pet_friendly || false,
      move_in_date: profileData.move_in_date || null,
      employment_status: profileData.employment_status || null,
      monthly_income: profileData.monthly_income || null,
      updated_at: new Date().toISOString()
    };

    // Actualizar perfil
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('avatar_path, updated_at')
      .single();

    if (updateError) {
      return NextResponse.json({
        error: "Error al actualizar perfil: " + updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      avatar_path: updatedProfile?.avatar_path || null,
      updated_at: updatedProfile?.updated_at,
      message: "Perfil actualizado correctamente"
    }, { status: 200 });

  } catch (error) {
    console.error('Error in profile PUT:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
