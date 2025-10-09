// =====================================================
// B6 - API: Delete Message Attachment
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    // 2. Obtener adjunto
    const { data: attachment, error: fetchError } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

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
