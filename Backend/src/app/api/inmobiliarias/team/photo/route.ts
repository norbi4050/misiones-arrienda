import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * API: Upload/Delete Fotos del Equipo
 * 
 * POST /api/inmobiliarias/team/photo
 * - Sube foto de miembro del equipo a Supabase Storage
 * - Bucket: team-photos
 * - Ruta: {user_id}/{timestamp}.{ext}
 * 
 * DELETE /api/inmobiliarias/team/photo
 * - Elimina foto del equipo de Supabase Storage
 * 
 * Uso: TeamPhotoUploader component
 */

// POST: Subir foto
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que sea inmobiliaria
    const { data: userProfile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.user_type !== 'inmobiliaria') {
      return NextResponse.json(
        { error: 'Solo inmobiliarias pueden subir fotos del equipo' },
        { status: 403 }
      );
    }

    // Obtener archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Usa JPG, PNG o WEBP' },
        { status: 400 }
      );
    }

    // Validar tamaño (máx 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo no debe superar 2MB' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    console.log('[Team Photo] Uploading:', fileName);

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('team-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('[Team Photo] Upload error:', uploadError);
      return NextResponse.json(
        { 
          error: 'Error al subir archivo',
          details: uploadError.message 
        },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('team-photos')
      .getPublicUrl(uploadData.path);

    console.log('[Team Photo] Upload successful:', publicUrl);

    return NextResponse.json({
      success: true,
      photoUrl: publicUrl,
      path: uploadData.path
    });

  } catch (error: any) {
    console.error('[Team Photo] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar foto
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que sea inmobiliaria
    const { data: userProfile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.user_type !== 'inmobiliaria') {
      return NextResponse.json(
        { error: 'Solo inmobiliarias pueden eliminar fotos del equipo' },
        { status: 403 }
      );
    }

    // Obtener URL de la foto a eliminar
    const { photoUrl } = await request.json();

    if (!photoUrl) {
      return NextResponse.json(
        { error: 'URL de foto requerida' },
        { status: 400 }
      );
    }

    // Extraer path del URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/team-photos/{path}
    const urlParts = photoUrl.split('/team-photos/');
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: 'URL de foto inválida' },
        { status: 400 }
      );
    }

    const filePath = urlParts[1];

    // Verificar que el archivo pertenece al usuario actual
    if (!filePath.startsWith(user.id)) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta foto' },
        { status: 403 }
      );
    }

    console.log('[Team Photo] Deleting:', filePath);

    // Eliminar de Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('team-photos')
      .remove([filePath]);

    if (deleteError) {
      console.error('[Team Photo] Delete error:', deleteError);
      return NextResponse.json(
        {
          error: 'Error al eliminar archivo',
          details: deleteError.message
        },
        { status: 500 }
      );
    }

    console.log('[Team Photo] Delete successful');

    return NextResponse.json({
      success: true,
      message: 'Foto eliminada correctamente'
    });

  } catch (error: any) {
    console.error('[Team Photo] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}
