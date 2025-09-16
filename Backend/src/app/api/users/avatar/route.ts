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

    // Generar nombre único para el archivo usando estructura de carpetas por usuario
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `avatar-${Date.now()}.${fileExtension}`;
    const filePath = `${user.id}/${fileName}`;

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

    // Actualizar perfil del usuario con la nueva URL
    const { error: updateError } = await supabase
      .from('User')
      .update({ 
        avatar: imageUrl,
        updatedAt: new Date()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      
      // Intentar eliminar el archivo subido si falla la actualización
      await supabase.storage
        .from('avatars')
        .remove([filePath]);
      
      return NextResponse.json({ 
        error: "Error al actualizar perfil: " + updateError.message 
      }, { status: 500 });
    }

    // Eliminar avatar anterior si existe
    try {
      const { data: userData } = await supabase
        .from('User')
        .select('avatar')
        .eq('id', user.id)
        .single();

      if (userData?.avatar && userData.avatar !== imageUrl) {
        // Extraer path del avatar anterior
        const oldUrl = userData.avatar;
        
        // Manejar tanto el formato antiguo como el nuevo
        let oldPath = '';
        if (oldUrl.includes('/avatars/')) {
          // Formato antiguo: .../avatars/avatar-userid-timestamp.jpg
          oldPath = oldUrl.split('/avatars/')[1];
        } else if (oldUrl.includes(`/${user.id}/`)) {
          // Formato nuevo: .../userid/avatar-timestamp.jpg
          oldPath = `${user.id}/${oldUrl.split(`/${user.id}/`)[1]}`;
        }
        
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        }
      }
    } catch (error) {
      // No es crítico si falla la eliminación del avatar anterior
      console.warn('Could not delete old avatar:', error);
    }

    return NextResponse.json({ 
      imageUrl,
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

    // Obtener URL actual del avatar
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('avatar')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ 
        error: "Error al obtener datos del usuario" 
      }, { status: 500 });
    }

    // Eliminar archivo del storage si existe
    if (userData?.avatar) {
      try {
        const oldUrl = userData.avatar;
        
        // Manejar tanto el formato antiguo como el nuevo
        let oldPath = '';
        if (oldUrl.includes('/avatars/')) {
          // Formato antiguo: .../avatars/avatar-userid-timestamp.jpg
          oldPath = oldUrl.split('/avatars/')[1];
        } else if (oldUrl.includes(`/${user.id}/`)) {
          // Formato nuevo: .../userid/avatar-timestamp.jpg
          oldPath = `${user.id}/${oldUrl.split(`/${user.id}/`)[1]}`;
        }
        
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        }
      } catch (error) {
        console.warn('Could not delete avatar file:', error);
      }
    }

    // Actualizar perfil del usuario removiendo la URL
    const { error: updateError } = await supabase
      .from('User')
      .update({ 
        avatar: null,
        updatedAt: new Date()
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

    // Obtener URL actual del avatar
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('avatar, name')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ 
        error: "Error al obtener datos del usuario" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      imageUrl: userData?.avatar || null,
      name: userData?.name || 'Usuario'
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in avatar fetch:', error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
