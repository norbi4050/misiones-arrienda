import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Forzar dynamic rendering para evitar caché
export const dynamic = 'force-dynamic';

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

    // Obtener perfil completo del usuario (usando tabla 'users' con snake_case)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        avatar,
        bio,
        verified,
        created_at,
        updated_at
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
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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

    // Preparar datos para actualización (usando snake_case)
    const updateData = {
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone || null,
      avatar: profileData.avatar || profileData.profileImage || null,
      bio: profileData.bio || null,
      updated_at: new Date().toISOString()
    };

    // Actualizar perfil en la base de datos
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
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
    const body = await request.json();

    // Validar que se envíen datos
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({
        error: "No se proporcionaron datos para actualizar"
      }, { status: 400 });
    }

    // Validación básica con límites de caracteres
    const errors: string[] = [];
    
    if (body.firstName && (typeof body.firstName !== 'string' || body.firstName.length > 60)) {
      errors.push('Nombre debe ser texto y máximo 60 caracteres');
    }
    
    if (body.lastName && (typeof body.lastName !== 'string' || body.lastName.length > 60)) {
      errors.push('Apellido debe ser texto y máximo 60 caracteres');
    }
    
    if (body.phone && (typeof body.phone !== 'string' || body.phone.length > 20)) {
      errors.push('Teléfono debe ser texto y máximo 20 caracteres');
    }
    
    if (body.bio && (typeof body.bio !== 'string' || body.bio.length > 500)) {
      errors.push('Biografía debe ser texto y máximo 500 caracteres');
    }

    if (errors.length > 0) {
      return NextResponse.json({
        error: "Datos inválidos",
        details: errors
      }, { status: 400 });
    }

    // Mapear firstName + lastName a name
    const updateData: any = {};
    
    if (body.firstName || body.lastName) {
      const firstName = (body.firstName || '').trim();
      const lastName = (body.lastName || '').trim();
      const name = `${firstName} ${lastName}`.trim();
      
      if (name) {
        updateData.name = name;
      }
    }
    
    if (body.phone !== undefined) {
      updateData.phone = body.phone ? body.phone.trim() : null;
    }
    
    if (body.bio !== undefined) {
      updateData.bio = body.bio ? body.bio.trim() : null;
    }

    // Ignorar campos fantasma que no existen en BD
    const ignoredFields = [
      'search_type', 'budget_range', 'preferred_areas', 'family_size',
      'pet_friendly', 'move_in_date', 'employment_status', 'monthly_income'
    ];
    
    // Log de campos ignorados para debugging
    const ignored = Object.keys(body).filter(key => ignoredFields.includes(key));
    if (ignored.length > 0) {
      console.log('Campos ignorados (no existen en BD):', ignored);
    }

    // Verificar que hay campos válidos para actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        error: "No se proporcionaron campos válidos para actualizar"
      }, { status: 400 });
    }

    // Agregar timestamp de actualización
    updateData.updated_at = new Date().toISOString();

    // Actualizar perfil en la base de datos
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select('id, name, email, phone, bio, updated_at')
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
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
