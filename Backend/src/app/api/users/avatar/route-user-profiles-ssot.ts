import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { 
  generateAvatarFilename, 
  generateAvatarPath, 
  extractAvatarPath,
  getAvatarUrl 
} from "@/utils/avatar";

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

// POST - Subir avatar (SSoT: user_profiles.photos[0])
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

    // Generar nombre único para el archivo usando utilidades
    const fileName = generateAvatarFilename(user.id, file.name);
    const filePath = generateAvatarPath(user.id, fileName);

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json({
        error: "Error al subir archivo: " + uploadError.message
      }, { status: 500 });
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // SSoT: Actualizar user_profiles.photos[0] (PRIMARY SOURCE)
    const now = new Date().toISOString();
    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        photos: [imageUrl],
        updated_at: now
      }, {
        onConflict: 'user_id'
      });

    if (profileUpdateError) {
      // Si falla la actualización del perfil, eliminar el archivo subido
      await supabase.storage
        .from('avatars')
        .remove([filePath]);
      
      return NextResponse.json({
        error: "Error al actualizar perfil en user_profiles: " + profileUpdateError.message
      }, { status: 500 });
    }

    // Fallback: También actualizar User.avatar para compatibilidad (SECONDARY)
    const { error: userUpdateError } = await supabase
      .from('User')
      .update({
        profile_image: imageUrl,
        updated_at: now
      })
      .eq('id', user.id);

    if (userUpdateError) {
      console.warn('Warning: Failed to update User.avatar fallback:', userUpdateError.message);
      // No fallar la operación si solo falla el fallback
    }

    // Eliminar avatar anterior si existe
    try {
      const { data: oldProfileData } = await supabase
        .from('user_profiles')
        .select('photos')
        .eq('user_id', user.id)
        .single();

      if (oldProfileData?.photos && oldProfileData.photos.length > 0) {
        const oldUrl = oldProfileData.photos[0];
        if (oldUrl && oldUrl !== imageUrl) {
          const oldPath = extractAvatarPath(oldUrl, user.id);
          
          if (oldPath) {
            await supabase.storage
              .from('avatars')
              .remove([oldPath]);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup old avatar:', error);
    }

    // Obtener datos actualizados desde user_profiles (SSoT)
    const { data: updatedProfile } = await supabase
      .from('user_profiles')
      .select('photos, updated_at')
      .eq('user_id', user.id)
      .single();

    // Generar URL con cache-busting desde SSoT
    const cacheBustedUrl = getAvatarUrl({
      photos: updatedProfile?.photos || [imageUrl],
      profileImage: imageUrl, // fallback
      updatedAt: updatedProfile?.updated_at || now
    });

    return NextResponse.json({
      imageUrl: cacheBustedUrl || imageUrl,
      originalUrl: imageUrl,
      message: "Avatar actualizado correctamente",
      cacheBusted: !!cacheBustedUrl,
      source: "user_profiles.photos[0]",
      storagePath: filePath
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in avatar upload:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar avatar (SSoT: user_profiles.photos[0])
export async function DELETE() {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener datos del perfil desde SSoT
    const { data: profileData, error: fetchError } = await supabase
      .from('user_profiles')
      .select('photos')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({
        error: "Error al obtener datos del perfil"
      }, { status: 500 });
    }

    // Eliminar archivo del storage si existe
    if (profileData?.photos && profileData.photos.length > 0) {
      try {
        const avatarUrl = profileData.photos[0];
        const oldPath = extractAvatarPath(avatarUrl, user.id);
        
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        }
      } catch (error) {
        console.warn('Failed to delete avatar file:', error);
      }
    }

    // SSoT: Actualizar user_profiles.photos (PRIMARY SOURCE)
    const now = new Date().toISOString();
    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        photos: [],
        updated_at: now
      }, {
        onConflict: 'user_id'
      });

    if (profileUpdateError) {
      return NextResponse.json({
        error: "Error al actualizar perfil: " + profileUpdateError.message
      }, { status: 500 });
    }

    // Fallback: También actualizar User.avatar (SECONDARY)
    const { error: userUpdateError } = await supabase
      .from('User')
      .update({
        profile_image: null,
        updated_at: now
      })
      .eq('id', user.id);

    if (userUpdateError) {
      console.warn('Warning: Failed to update User.avatar fallback:', userUpdateError.message);
    }

    return NextResponse.json({
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

// GET - Obtener información del avatar actual (SSoT: user_profiles.photos[0])
export async function GET() {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener datos desde SSoT (user_profiles)
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('photos, updated_at')
      .eq('user_id', user.id)
      .single();

    // Obtener datos de fallback (User table)
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('profile_image, name, updated_at')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({
        error: "Error al obtener datos del usuario"
      }, { status: 500 });
    }

    // Generar URL con cache-busting usando SSoT
    const cacheBustedUrl = getAvatarUrl({
      photos: profileData?.photos || [],
      profileImage: userData?.profile_image, // fallback
      updatedAt: profileData?.updated_at || userData?.updated_at
    });

    return NextResponse.json({
      imageUrl: cacheBustedUrl,
      originalUrl: profileData?.photos?.[0] || userData?.profile_image || null,
      name: userData?.name || 'Usuario',
      cacheBusted: !!cacheBustedUrl && !!(profileData?.updated_at || userData?.updated_at),
      source: profileData?.photos?.[0] ? "user_profiles.photos[0]" : "User.avatar (fallback)"
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in avatar fetch:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
