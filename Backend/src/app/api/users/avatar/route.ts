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

// POST - Subir avatar
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
      console.error('Error uploading to storage:', uploadError);
      return NextResponse.json({
        error: "Error al subir archivo: " + uploadError.message
      }, { status: 500 });
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return NextResponse.json({
        error: "Error al obtener URL pública"
      }, { status: 500 });
    }

    const imageUrl = urlData.publicUrl;

    // Actualizar tanto User.avatar como UserProfile.photos[0] (fuente de verdad)
    const now = new Date().toISOString();
    
    // 1. Actualizar User.avatar para compatibilidad
    const { error: userUpdateError } = await supabase
      .from('User')
      .update({
        avatar: imageUrl,
        updatedAt: now
      })
      .eq('id', user.id);

    if (userUpdateError) {
      console.error('Error updating user avatar:', userUpdateError);
    }

    // 2. Actualizar UserProfile.photos[0] (fuente de verdad)
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('UserProfile')
      .select('photos')
      .eq('userId', user.id)
      .single();

    if (!profileFetchError && existingProfile) {
      // Actualizar photos array poniendo el nuevo avatar al inicio
      const updatedPhotos = [imageUrl, ...(existingProfile.photos || []).filter((p: string) => p !== imageUrl)];
      
      const { error: profileUpdateError } = await supabase
        .from('UserProfile')
        .update({
          photos: updatedPhotos,
          updated_at: now
        })
        .eq('userId', user.id);

      if (profileUpdateError) {
        console.error('Error updating user profile photos:', profileUpdateError);
        
        // Si falla la actualización del perfil, eliminar archivo subido
        await supabase.storage
          .from('avatars')
          .remove([filePath]);

        return NextResponse.json({
          error: "Error al actualizar perfil: " + profileUpdateError.message
        }, { status: 500 });
      }
    } else {
      // Si no existe UserProfile, crear uno básico
      const { error: createProfileError } = await supabase
        .from('UserProfile')
        .insert({
          userId: user.id,
          role: 'BUSCO', // Default role
          city: 'Posadas', // Default city
          budgetMin: 0,
          budgetMax: 100000,
          photos: [imageUrl],
          created_at: now,
          updated_at: now
        });

      if (createProfileError) {
        console.error('Error creating user profile:', createProfileError);
        
        // Si falla la creación del perfil, eliminar archivo subido
        await supabase.storage
          .from('avatars')
          .remove([filePath]);

        return NextResponse.json({
          error: "Error al crear perfil: " + createProfileError.message
        }, { status: 500 });
      }
    }

    // Eliminar avatar anterior si existe (buscar en ambas fuentes)
    try {
      // Buscar avatar anterior en User.avatar
      const { data: userData } = await supabase
        .from('User')
        .select('avatar')
        .eq('id', user.id)
        .single();

      // Buscar avatar anterior en UserProfile.photos[0]
      const { data: profileData } = await supabase
        .from('UserProfile')
        .select('photos')
        .eq('userId', user.id)
        .single();

      const oldAvatars = [];
      
      // Agregar avatar de User si existe y es diferente
      if (userData?.avatar && userData.avatar !== imageUrl) {
        oldAvatars.push(userData.avatar);
      }
      
      // Agregar photos[0] si existe y es diferente
      if (profileData?.photos && profileData.photos.length > 0 && profileData.photos[0] !== imageUrl) {
        oldAvatars.push(profileData.photos[0]);
      }

      // Eliminar archivos antiguos únicos
      const uniqueOldAvatars = [...new Set(oldAvatars)];
      for (const oldAvatar of uniqueOldAvatars) {
        const oldPath = extractAvatarPath(oldAvatar, user.id);
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        }
      }
    } catch (error) {
      // No es crítico si falla la eliminación del avatar anterior
      console.warn('Failed to cleanup old avatar:', error);
    }

    // Obtener datos actualizados para cache-busting (priorizar UserProfile)
    const { data: updatedProfile } = await supabase
      .from('UserProfile')
      .select('photos, updated_at')
      .eq('userId', user.id)
      .single();

    const { data: updatedUser } = await supabase
      .from('User')
      .select('avatar, updatedAt')
      .eq('id', user.id)
      .single();

    // Generar URL con cache-busting usando photos[0] como fuente de verdad
    const cacheBustedUrl = getAvatarUrl({
      photos: updatedProfile?.photos || null,
      profileImage: updatedUser?.avatar || imageUrl,
      updatedAt: updatedProfile?.updated_at || updatedUser?.updatedAt || now
    });

    return NextResponse.json({
      imageUrl: cacheBustedUrl || imageUrl,
      originalUrl: imageUrl,
      message: "Avatar actualizado correctamente",
      cacheBusted: !!cacheBustedUrl,
      source: updatedProfile?.photos?.[0] ? 'user_profiles.photos[0]' : 'user.avatar'
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
export async function DELETE(request: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { userId } = await request.json();

    // Verificar que el usuario solo puede eliminar su propio avatar
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener URL actual del avatar (usando campo normalizado)
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('profile_image')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json({
        error: "Error al obtener datos del usuario"
      }, { status: 500 });
    }

    // Eliminar archivo del storage si existe
    if (userData?.profile_image) {
      try {
        const oldPath = extractAvatarPath(userData.profile_image, user.id);
        
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        }
      } catch (error) {
        console.warn('Failed to delete avatar file:', error);
      }
    }

    // Actualizar perfil del usuario removiendo la URL (usando campo normalizado)
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('User')
      .update({
        profile_image: null,
        updated_at: now
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({
        error: "Error al actualizar perfil: " + updateError.message
      }, { status: 500 });
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

// GET - Obtener información del avatar actual
export async function GET() {
  const supabase = await getServerSupabase();

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener URL actual del avatar con datos para cache-busting
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('profile_image, name, updated_at')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json({
        error: "Error al obtener datos del usuario"
      }, { status: 500 });
    }

    // Generar URL con cache-busting si existe imagen
    const cacheBustedUrl = getAvatarUrl({
      profileImage: userData?.profile_image,
      updatedAt: userData?.updated_at
    });

    return NextResponse.json({
      imageUrl: cacheBustedUrl,
      originalUrl: userData?.profile_image || null,
      name: userData?.name || 'Usuario',
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
