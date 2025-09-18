import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { 
  generateAvatarFilename, 
  generateAvatarPath, 
  isValidAvatarPath,
  getAvatarUrl,
  setUserAvatarPath
} from "@/utils/avatar-ssot";

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

// POST - Subir avatar con avatar_path SSoT
export async function POST(request: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    // Verificar que el usuario solo puede subir su propio avatar
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: "Tipo de archivo no permitido. Use JPEG, PNG o WebP"
      }, { status: 400 });
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: "Archivo muy grande. Máximo 5MB"
      }, { status: 400 });
    }

    // Generar nombre único y path usando utilidades
    const fileName = generateAvatarFilename(user.id, file.name);
    const avatarPath = generateAvatarPath(user.id, fileName);

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(avatarPath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json({
        error: "Error al subir archivo: " + uploadError.message
      }, { status: 500 });
    }

    // Eliminar avatar anterior si existe
    try {
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('avatar_path')
        .eq('id', user.id)
        .single();

      if (userData?.avatar_path && userData.avatar_path !== avatarPath) {
        // Validar que el path anterior pertenece al usuario
        if (isValidAvatarPath(userData.avatar_path, user.id)) {
          await supabase.storage
            .from('avatars')
            .remove([userData.avatar_path]);
        }
      }
    } catch (error) {
      // No es crítico si falla la eliminación del avatar anterior
      console.warn('Failed to cleanup old avatar:', error);
    }

    // Actualizar avatar_path en user_profiles (SSoT)
    const now = new Date().toISOString();
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        avatar_path: avatarPath,
        updated_at: now
      })
      .eq('id', user.id)
      .select('avatar_path, updated_at')
      .single();

    if (updateError) {
      // Si falla la actualización del perfil, eliminar archivo subido
      await supabase.storage
        .from('avatars')
        .remove([avatarPath]);

      return NextResponse.json({
        error: "Error al actualizar perfil: " + updateError.message
      }, { status: 500 });
    }

    // Generar URL con cache-busting
    const cacheBustedUrl = getAvatarUrl(
      updatedProfile?.avatar_path || avatarPath,
      updatedProfile?.updated_at || now
    );

    return NextResponse.json({
      ok: true,
      avatar_path: updatedProfile?.avatar_path || avatarPath,
      imageUrl: cacheBustedUrl,
      updated_at: updatedProfile?.updated_at || now,
      message: "Avatar actualizado correctamente"
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in avatar upload:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar avatar
export async function DELETE() {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener avatar_path actual
    const { data: userData, error: fetchError } = await supabase
      .from('user_profiles')
      .select('avatar_path')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json({
        error: "Error al obtener datos del usuario"
      }, { status: 500 });
    }

    // Eliminar archivo del storage si existe
    if (userData?.avatar_path) {
      try {
        // Validar que el path pertenece al usuario
        if (isValidAvatarPath(userData.avatar_path, user.id)) {
          await supabase.storage
            .from('avatars')
            .remove([userData.avatar_path]);
        }
      } catch (error) {
        console.warn('Failed to delete avatar file:', error);
      }
    }

    // Actualizar perfil removiendo avatar_path (SSoT)
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        avatar_path: null,
        updated_at: now
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({
        error: "Error al actualizar perfil: " + updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Avatar eliminado correctamente"
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in avatar deletion:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// GET - Obtener información del avatar actual
export async function GET() {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener avatar_path y datos para cache-busting
    const { data: userData, error: fetchError } = await supabase
      .from('user_profiles')
      .select('avatar_path, name, updated_at')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json({
        error: "Error al obtener datos del usuario"
      }, { status: 500 });
    }

    // Generar URL con cache-busting si existe avatar_path
    const cacheBustedUrl = getAvatarUrl(
      userData?.avatar_path,
      userData?.updated_at
    );

    return NextResponse.json({
      ok: true,
      avatar_path: userData?.avatar_path || null,
      imageUrl: cacheBustedUrl,
      name: userData?.name || 'Usuario',
      updated_at: userData?.updated_at,
      cacheBusted: !!cacheBustedUrl && !!userData?.updated_at
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in avatar fetch:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
