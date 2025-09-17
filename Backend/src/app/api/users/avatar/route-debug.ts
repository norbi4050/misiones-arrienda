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

// POST - Subir avatar con logging detallado
export async function POST(request: NextRequest) {
  const supabase = await getServerSupabase();
  
  console.log('🚀 INICIO - Avatar upload API');

  try {
    // Verificar autenticación
    console.log('🔐 Verificando autenticación...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Error autenticación:', authError?.message || 'Usuario no encontrado');
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.log('✅ Usuario autenticado:', user.id);

    // Obtener FormData
    console.log('📄 Obteniendo FormData...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      console.log('❌ No se proporcionó archivo');
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    console.log('✅ Archivo recibido:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Verificar autorización
    if (userId && userId !== user.id) {
      console.log('❌ Usuario no autorizado:', { userId, actualUserId: user.id });
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Validaciones
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Tipo de archivo no permitido:', file.type);
      return NextResponse.json({
        error: "Tipo de archivo no permitido. Use JPEG, PNG o WebP"
      }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log('❌ Archivo muy grande:', file.size);
      return NextResponse.json({
        error: "Archivo muy grande. Máximo 5MB"
      }, { status: 400 });
    }

    console.log('✅ Validaciones pasadas');

    // PASO 1: Obtener avatar anterior ANTES de cualquier cambio
    console.log('📋 PASO 1: Obteniendo avatar anterior...');
    let oldAvatarPath = null;
    let oldProfileImage = null;
    
    try {
      const { data: oldUserData, error: oldUserError } = await supabase
        .from('User')
        .select('profile_image')
        .eq('id', user.id)
        .single();

      if (oldUserError) {
        console.log('⚠️  Error obteniendo usuario anterior:', oldUserError.message);
      } else {
        oldProfileImage = oldUserData?.profile_image;
        if (oldProfileImage) {
          oldAvatarPath = extractAvatarPath(oldProfileImage, user.id);
          console.log('📋 Avatar anterior encontrado:', oldProfileImage);
          console.log('📋 Path anterior:', oldAvatarPath);
        } else {
          console.log('📋 No hay avatar anterior');
        }
      }
    } catch (error) {
      console.log('⚠️  Error obteniendo avatar anterior:', error);
    }

    // PASO 2: Generar nombres y rutas
    console.log('📝 PASO 2: Generando nombres únicos...');
    const fileName = generateAvatarFilename(user.id, file.name);
    const filePath = generateAvatarPath(user.id, fileName);
    
    console.log('📝 Archivo generado:', {
      fileName,
      filePath
    });

    // PASO 3: Subir archivo
    console.log('☁️  PASO 3: Subiendo archivo a Supabase Storage...');
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.log('❌ Error subiendo archivo:', uploadError.message);
      return NextResponse.json({
        error: "Error al subir archivo: " + uploadError.message
      }, { status: 500 });
    }

    console.log('✅ Archivo subido exitosamente:', uploadData?.path);

    // PASO 4: Obtener URL pública
    console.log('🔗 PASO 4: Obteniendo URL pública...');
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
    console.log('✅ URL pública obtenida:', imageUrl);

    // PASO 5: Actualizar base de datos
    console.log('💾 PASO 5: Actualizando base de datos...');
    const now = new Date().toISOString();
    
    console.log('💾 Datos a actualizar:', {
      userId: user.id,
      profile_image: imageUrl,
      updated_at: now
    });

    const { data: updateData, error: updateError } = await supabase
      .from('User')
      .update({
        profile_image: imageUrl,
        updated_at: now
      })
      .eq('id', user.id)
      .select('id, profile_image, updated_at');

    if (updateError) {
      console.log('❌ ERROR CRÍTICO actualizando BD:', updateError.message);
      console.log('❌ Detalles error:', updateError);
      
      // Limpiar archivo subido si falla la actualización
      await supabase.storage
        .from('avatars')
        .remove([filePath]);
      
      console.log('🧹 Archivo limpiado por error BD');

      return NextResponse.json({
        error: "Error al actualizar perfil: " + updateError.message,
        details: updateError
      }, { status: 500 });
    }

    console.log('✅ Base de datos actualizada exitosamente');
    console.log('✅ Datos actualizados:', updateData);

    // PASO 6: Verificar que la actualización persistió
    console.log('🔍 PASO 6: Verificando persistencia...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('User')
      .select('profile_image, updated_at')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.log('❌ Error verificando persistencia:', verifyError.message);
    } else {
      console.log('✅ Verificación persistencia:', {
        profile_image: verifyData.profile_image,
        updated_at: verifyData.updated_at,
        matches_new_url: verifyData.profile_image === imageUrl
      });
      
      if (verifyData.profile_image !== imageUrl) {
        console.log('🚨 PROBLEMA: La imagen no persistió correctamente!');
        console.log('   Esperado:', imageUrl);
        console.log('   Actual:', verifyData.profile_image);
      }
    }

    // PASO 7: Limpiar avatar anterior
    if (oldAvatarPath && oldAvatarPath !== filePath) {
      console.log('🧹 PASO 7: Limpiando avatar anterior...');
      try {
        await supabase.storage
          .from('avatars')
          .remove([oldAvatarPath]);
        
        console.log('✅ Avatar anterior eliminado:', oldAvatarPath);
      } catch (error) {
        console.log('⚠️  Error limpiando avatar anterior:', error);
      }
    } else {
      console.log('📋 No hay avatar anterior que limpiar');
    }

    // PASO 8: Generar respuesta con cache-busting
    console.log('🎯 PASO 8: Generando respuesta final...');
    const cacheBustedUrl = getAvatarUrl({
      profileImage: imageUrl,
      updatedAt: now
    });

    const response = {
      imageUrl: cacheBustedUrl || imageUrl,
      originalUrl: imageUrl,
      message: "Avatar actualizado correctamente",
      cacheBusted: !!cacheBustedUrl,
      debug: {
        filePath,
        oldAvatarPath,
        timestamp: now,
        userId: user.id
      }
    };

    console.log('✅ Respuesta generada:', response);
    console.log('🏁 FIN - Avatar upload API exitoso');

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.log('💥 ERROR CRÍTICO en avatar upload:', error);
    console.log('💥 Stack trace:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET - Obtener información del avatar actual con debugging
export async function GET() {
  const supabase = await getServerSupabase();
  
  console.log('🔍 INICIO - Avatar GET API');

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Error autenticación GET:', authError?.message);
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.log('✅ Usuario autenticado GET:', user.id);

    // Obtener datos del usuario
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('profile_image, name, updated_at')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.log('❌ Error obteniendo datos usuario:', fetchError.message);
      return NextResponse.json({
        error: "Error al obtener datos del usuario",
        details: fetchError.message
      }, { status: 500 });
    }

    console.log('✅ Datos usuario obtenidos:', {
      profile_image: userData?.profile_image || 'null',
      updated_at: userData?.updated_at || 'null',
      name: userData?.name || 'null'
    });

    // Generar URL con cache-busting
    const cacheBustedUrl = getAvatarUrl({
      profileImage: userData?.profile_image,
      updatedAt: userData?.updated_at
    });

    const response = {
      imageUrl: cacheBustedUrl,
      originalUrl: userData?.profile_image || null,
      name: userData?.name || 'Usuario',
      cacheBusted: !!cacheBustedUrl && !!userData?.updated_at,
      debug: {
        hasProfileImage: !!userData?.profile_image,
        hasUpdatedAt: !!userData?.updated_at,
        userId: user.id
      }
    };

    console.log('✅ Respuesta GET generada:', response);
    console.log('🏁 FIN - Avatar GET API');

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.log('💥 ERROR CRÍTICO en avatar GET:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE con debugging
export async function DELETE(request: NextRequest) {
  const supabase = await getServerSupabase();
  
  console.log('🗑️  INICIO - Avatar DELETE API');

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Error autenticación DELETE:', authError?.message);
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.log('✅ Usuario autenticado DELETE:', user.id);

    const { userId } = await request.json();

    if (userId && userId !== user.id) {
      console.log('❌ Usuario no autorizado DELETE:', { userId, actualUserId: user.id });
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener avatar actual
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('profile_image')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.log('❌ Error obteniendo datos para DELETE:', fetchError.message);
      return NextResponse.json({
        error: "Error al obtener datos del usuario"
      }, { status: 500 });
    }

    console.log('📋 Avatar actual a eliminar:', userData?.profile_image);

    // Eliminar archivo del storage
    if (userData?.profile_image) {
      const oldPath = extractAvatarPath(userData.profile_image, user.id);
      
      if (oldPath) {
        console.log('🗑️  Eliminando archivo storage:', oldPath);
        await supabase.storage
          .from('avatars')
          .remove([oldPath]);
        console.log('✅ Archivo eliminado del storage');
      }
    }

    // Actualizar BD
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('User')
      .update({
        profile_image: null,
        updated_at: now
      })
      .eq('id', user.id);

    if (updateError) {
      console.log('❌ Error actualizando BD en DELETE:', updateError.message);
      return NextResponse.json({
        error: "Error al actualizar perfil: " + updateError.message
      }, { status: 500 });
    }

    console.log('✅ Avatar eliminado exitosamente');
    console.log('🏁 FIN - Avatar DELETE API');

    return NextResponse.json({
      message: "Avatar eliminado correctamente"
    }, { status: 200 });

  } catch (error) {
    console.log('💥 ERROR CRÍTICO en avatar DELETE:', error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
