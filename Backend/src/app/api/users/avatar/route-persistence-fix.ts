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

// POST - Subir avatar con persistencia mejorada
export async function POST(request: NextRequest) {
  const supabase = await getServerSupabase();

  try {
    console.log('🚀 INICIANDO UPLOAD DE AVATAR...');
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Error de autenticación:', authError);
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.log('✅ Usuario autenticado:', user.id);

    // Obtener FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      console.log('❌ No se proporcionó archivo');
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    console.log('📁 Archivo recibido:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);

    // Verificar que el usuario solo puede subir su propio avatar
    if (userId && userId !== user.id) {
      console.log('❌ Usuario no autorizado:', userId, 'vs', user.id);
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Tipo de archivo no permitido:', file.type);
      return NextResponse.json({
        error: "Tipo de archivo no permitido. Use JPEG, PNG o WebP"
      }, { status: 400 });
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log('❌ Archivo muy grande:', file.size);
      return NextResponse.json({
        error: "Archivo muy grande. Máximo 5MB"
      }, { status: 400 });
    }

    // PASO 1: Obtener avatar anterior ANTES de hacer cualquier cambio
    console.log('📋 PASO 1: Obteniendo avatar anterior...');
    let oldAvatarPath = null;
    try {
      const { data: oldUserData, error: oldDataError } = await supabase
        .from('User')
        .select('profile_image')
        .eq('id', user.id)
        .single();

      if (oldDataError) {
        console.log('⚠️ Error obteniendo datos anteriores:', oldDataError);
      } else if (oldUserData?.profile_image) {
        oldAvatarPath = extractAvatarPath(oldUserData.profile_image, user.id);
        console.log('📋 Avatar anterior encontrado:', oldAvatarPath);
      } else {
        console.log('📋 No hay avatar anterior');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener avatar anterior:', error);
    }

    // PASO 2: Generar nombres únicos y subir archivo
    console.log('📤 PASO 2: Subiendo archivo...');
    const fileName = generateAvatarFilename(user.id, file.name);
    const filePath = generateAvatarPath(user.id, fileName);
    
    console.log('📁 Archivo generado:', fileName);
    console.log('📂 Path completo:', filePath);

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
      console.error('❌ Error uploading to storage:', uploadError);
      return NextResponse.json({
        error: "Error al subir archivo: " + uploadError.message
      }, { status: 500 });
    }

    console.log('✅ Archivo subido exitosamente:', uploadData.path);

    // PASO 3: Obtener URL pública
    console.log('🔗 PASO 3: Obteniendo URL pública...');
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.log('❌ Error obteniendo URL pública');
      return NextResponse.json({
        error: "Error al obtener URL pública"
      }, { status: 500 });
    }

    const imageUrl = urlData.publicUrl;
    console.log('🔗 URL pública obtenida:', imageUrl);

    // PASO 4: Actualizar perfil del usuario
    console.log('💾 PASO 4: Actualizando perfil...');
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('User')
      .update({
        profile_image: imageUrl,
        updated_at: now
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating user profile_image:', updateError);
      
      // Si falla la actualización del perfil, eliminar archivo subido
      console.log('🗑️ Eliminando archivo subido por error...');
      await supabase.storage
        .from('avatars')
        .remove([filePath]);

      return NextResponse.json({
        error: "Error al actualizar perfil: " + updateError.message
      }, { status: 500 });
    }

    console.log('✅ Perfil actualizado exitosamente');

    // PASO 5: Verificar que la actualización fue exitosa
    console.log('🔍 PASO 5: Verificando actualización...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('User')
      .select('profile_image, updated_at')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.log('⚠️ Error verificando actualización:', verifyError);
    } else {
      console.log('✅ Verificación exitosa - profile_image:', verifyData.profile_image);
      console.log('✅ updated_at:', verifyData.updated_at);
    }

    // PASO 6: Eliminar avatar anterior SOLO si todo fue exitoso
    if (oldAvatarPath && oldAvatarPath !== filePath) {
      console.log('🗑️ PASO 6: Eliminando avatar anterior...');
      try {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([oldAvatarPath]);
        
        if (deleteError) {
          console.log('⚠️ Error eliminando avatar anterior:', deleteError);
        } else {
          console.log('✅ Avatar anterior eliminado:', oldAvatarPath);
        }
      } catch (error) {
        console.warn('⚠️ Failed to cleanup old avatar:', error);
      }
    } else {
      console.log('📋 No hay avatar anterior para eliminar o es el mismo archivo');
    }

    // PASO 7: Generar URL con cache-busting
    console.log('🔄 PASO 7: Generando URL con cache-busting...');
    const cacheBustedUrl = getAvatarUrl({
      profileImage: verifyData?.profile_image || imageUrl,
      updatedAt: verifyData?.updated_at || now
    });

    console.log('🔗 URL final con cache-busting:', cacheBustedUrl);

    const response = {
      imageUrl: cacheBustedUrl || imageUrl,
      originalUrl: imageUrl,
      message: "Avatar actualizado correctamente",
      cacheBusted: !!cacheBustedUrl,
      debug: {
        filePath,
        oldAvatarPath,
        timestamp: now,
        verified: !!verifyData
      }
    };

    console.log('✅ UPLOAD COMPLETADO EXITOSAMENTE');
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('💥 Unexpected error in avatar upload:', error);
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
    console.log('🗑️ INICIANDO ELIMINACIÓN DE AVATAR...');
    
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

    // Obtener URL actual del avatar
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
          
          console.log('✅ Archivo eliminado del storage:', oldPath);
        }
      } catch (error) {
        console.warn('Failed to delete avatar file:', error);
      }
    }

    // Actualizar perfil del usuario removiendo la URL
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

    console.log('✅ AVATAR ELIMINADO EXITOSAMENTE');
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

    console.log('📋 Avatar actual:', userData?.profile_image);
    console.log('🔗 URL con cache-busting:', cacheBustedUrl);

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
