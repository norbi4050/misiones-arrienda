// =====================================================
// B6 - API: Message Attachment Operations
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/messages/attachments/[id]
 * Descarga un adjunto con headers correctos para forzar descarga
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const attachmentId = params.id;

    console.log('[ATTACHMENTS] Download request:', {
      userId: user.id,
      attachmentId
    });

    // 2. Obtener adjunto - Intentar primero con tabla Prisma, luego snake_case
    let attachment: any = null;
    let fetchError: any = null;
    
    // Intentar con MessageAttachment (Prisma/PascalCase)
    const { data: attachmentPrisma, error: errorPrisma } = await supabase
      .from('MessageAttachment')
      .select('*')
      .eq('id', attachmentId)
      .single();
    
    if (!errorPrisma && attachmentPrisma) {
      attachment = attachmentPrisma;
    } else {
      // Fallback: Intentar con message_attachments (snake_case)
      const { data: attachmentSnake, error: errorSnake } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();
      
      if (!errorSnake && attachmentSnake) {
        attachment = attachmentSnake;
      } else {
        fetchError = errorPrisma || errorSnake;
      }
    }

    if (fetchError || !attachment) {
      console.log('[ATTACHMENTS] Attachment not found:', attachmentId);
      return NextResponse.json(
        { error: 'Adjunto no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Normalizar campos (Prisma usa camelCase, Supabase usa snake_case)
    const normalizedAttachment = {
      id: attachment.id,
      path: attachment.path,
      bucket: attachment.bucket || 'message-attachments',
      file_name: attachment.fileName || attachment.file_name || 'download',
      mime: attachment.mime
    };

    // 4. Generar URL firmada con transformación para descarga
    const { data: signedData, error: signedError } = await supabase.storage
      .from(normalizedAttachment.bucket)
      .createSignedUrl(normalizedAttachment.path, 3600, {
        download: normalizedAttachment.file_name // Forzar descarga con nombre original
      });

    if (signedError || !signedData?.signedUrl) {
      console.error('[ATTACHMENTS] Error generating signed URL:', signedError);
      return NextResponse.json(
        { error: 'Error al generar URL de descarga', code: 'STORAGE_ERROR' },
        { status: 500 }
      );
    }

    console.log('[ATTACHMENTS] Download URL generated:', {
      userId: user.id,
      attachmentId,
      fileName: normalizedAttachment.file_name,
      tableName: attachmentPrisma ? 'MessageAttachment' : 'message_attachments'
    });

    // 5. Redirigir a la URL firmada con headers de descarga
    return NextResponse.redirect(signedData.signedUrl);

  } catch (error) {
    console.error('[ATTACHMENTS] Download exception:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/messages/attachments/[id]
 * Elimina un adjunto (solo el autor puede eliminarlo)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const attachmentId = params.id;

    console.log('[ATTACHMENTS] Delete request:', {
      userId: user.id,
      attachmentId
    });

    // 2. Obtener adjunto - Intentar primero con tabla Prisma, luego snake_case
    let attachment: any = null;
    let fetchError: any = null;
    
    // Intentar con MessageAttachment (Prisma/PascalCase)
    const { data: attachmentPrisma, error: errorPrisma } = await supabase
      .from('MessageAttachment')
      .select('*')
      .eq('id', attachmentId)
      .single();
    
    if (!errorPrisma && attachmentPrisma) {
      attachment = attachmentPrisma;
    } else {
      // Fallback: Intentar con message_attachments (snake_case)
      const { data: attachmentSnake, error: errorSnake } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();
      
      if (!errorSnake && attachmentSnake) {
        attachment = attachmentSnake;
      } else {
        fetchError = errorPrisma || errorSnake;
      }
    }

    if (fetchError || !attachment) {
      console.log('[ATTACHMENTS] Attachment not found:', attachmentId);
      return NextResponse.json(
        { error: 'Adjunto no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Validar ownership
    if (attachment.user_id !== user.id) {
      console.log('[ATTACHMENTS] User not owner:', user.id, '!=', attachment.user_id);
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este adjunto', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 4. Eliminar de storage
    const { error: storageError } = await supabase.storage
      .from('message-attachments')
      .remove([attachment.path]);

    if (storageError) {
      console.error('[ATTACHMENTS] Storage delete error:', storageError);
      // Continuar con la eliminación de DB aunque falle storage
    }

    // 5. Eliminar de DB (el trigger se encargará de limpiar storage si no se hizo arriba)
    const { error: deleteError } = await supabase
      .from('message_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      console.error('[ATTACHMENTS] DB delete error:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el adjunto', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    console.log('[ATTACHMENTS] DELETED', {
      userId: user.id,
      attachmentId,
      path: attachment.path
    });

    return NextResponse.json({ 
      success: true,
      message: 'Adjunto eliminado correctamente'
    });

  } catch (error) {
    console.error('[ATTACHMENTS] Delete exception:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
