import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Image Upload Endpoint
 *
 * Requisitos de Supabase Storage:
 * 1. Crear bucket "images" en Supabase Storage
 * 2. Configurar permisos públicos para lectura (read)
 * 3. Configurar política de escritura (write) para usuarios autenticados
 *
 * Políticas requeridas:
 * - SELECT (read): PUBLIC access
 * - INSERT (write): authenticated users (user.id = folder name)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const type = formData.get('type') as string; // 'hero_background', 'logo', etc.

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Verify user owns this profile
    if (user.id !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no puede superar los 5MB' }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${userId}/${type}_${timestamp}.${fileExt}`;
    const filePath = `inmobiliarias/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    console.log('[Upload] Attempting to upload file:', { filePath, type: file.type, size: file.size });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Upload] Error uploading file:', {
        error: uploadError,
        message: uploadError.message,
        status: (uploadError as any).status,
        statusCode: (uploadError as any).statusCode,
      });

      // Provide more specific error messages
      if (uploadError.message?.includes('Bucket not found')) {
        return NextResponse.json({
          error: 'Error de configuración: Bucket de almacenamiento no encontrado'
        }, { status: 500 });
      }

      if (uploadError.message?.includes('Policy')) {
        return NextResponse.json({
          error: 'Error de configuración: Permisos de almacenamiento insuficientes'
        }, { status: 500 });
      }

      return NextResponse.json({
        error: `Error al subir la imagen: ${uploadError.message}`
      }, { status: 500 });
    }

    console.log('[Upload] File uploaded successfully:', { path: uploadData.path });

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('images').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error('[Upload] Error in image upload endpoint:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
