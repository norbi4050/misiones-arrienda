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

// GET - Obtener perfil completo del usuario
export async function GET() {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener perfil completo del usuario (solo campos básicos que existen)
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select(`
        id,
        name,
        email,
        phone,
        avatar,
        bio,
        verified,
        createdAt,
        updatedAt
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({
        error: "Error al obtener perfil del usuario",
        details: profileError.message
      }, { status: 500 });
    }

    // Si no existe perfil, crear uno básico
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('User')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json({
          error: "Error al crear perfil del usuario",
          details: createError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        profile: newProfile,
        message: "Perfil creado exitosamente"
      }, { status: 201 });
    }

    return NextResponse.json({
      profile,
      message: "Perfil obtenido exitosamente"
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in profile fetch:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar perfil completo (reemplaza todos los campos)
export async function PUT(request: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener datos del cuerpo de la petición
    const profileData = await request.json();

    // Validar campos requeridos
    if (!profileData.name || !profileData.email) {
      return NextResponse.json({
        error: "Nombre y email son requeridos"
      }, { status: 400 });
    }

    // Preparar datos para actualización (solo campos básicos que existen)
    const updateData = {
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone || null,
      avatar: profileData.avatar || profileData.profileImage || null,
      bio: profileData.bio || null,
      updatedAt: new Date().toISOString()
    };

    // Actualizar perfil en la base de datos
    const { data: updatedProfile, error: updateError } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({
        error: "Error al actualizar perfil",
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      profile: updatedProfile,
      message: "Perfil actualizado exitosamente"
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in profile update:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PATCH - Actualizar campos específicos del perfil
export async function PATCH(request: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener datos del cuerpo de la petición
    const partialData = await request.json();

    // Validar que se envíen datos
    if (!partialData || Object.keys(partialData).length === 0) {
      return NextResponse.json({
        error: "No se proporcionaron datos para actualizar"
      }, { status: 400 });
    }

    // Campos permitidos para actualización (solo campos básicos que existen)
    const allowedFields = [
      'name', 'email', 'phone', 'avatar', 'profileImage', 'bio'
    ];

    // Filtrar solo campos permitidos y normalizar nombres
    const updateData: any = {};
    for (const [key, value] of Object.entries(partialData)) {
      if (allowedFields.includes(key)) {
        // Normalizar profileImage → avatar
        if (key === 'profileImage') {
          updateData.avatar = value;
        } else {
          updateData[key] = value;
        }
      }
    }

    // Agregar timestamp de actualización
    updateData.updatedAt = new Date().toISOString();

    // Verificar que hay campos válidos para actualizar
    if (Object.keys(updateData).length <= 1) { // Solo updatedAt
      return NextResponse.json({
        error: "No se proporcionaron campos válidos para actualizar"
      }, { status: 400 });
    }

    // Actualizar perfil en la base de datos
    const { data: updatedProfile, error: updateError } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({
        error: "Error al actualizar perfil",
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      profile: updatedProfile,
      message: "Perfil actualizado exitosamente",
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in profile patch:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar perfil (soft delete)
export async function DELETE() {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Marcar perfil como eliminado (soft delete)
    const { error: deleteError } = await supabase
      .from('User')
      .update({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', user.id);

    if (deleteError) {
      console.error('Error deleting profile:', deleteError);
      return NextResponse.json({
        error: "Error al eliminar perfil",
        details: deleteError.message
      }, { status: 500 });
    }

    // Cerrar sesión del usuario
    await supabase.auth.signOut();

    return NextResponse.json({
      message: "Perfil eliminado exitosamente"
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in profile deletion:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
