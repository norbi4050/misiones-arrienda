// =====================================================
// B6 - API: List Message Attachments
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Attachment } from '@/types/messages';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/messages/[conversationId]/attachments
 * Lista todos los adjuntos de un mensaje
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
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

    const messageId = params.conversationId;

    console.log('[ATTACHMENTS] List request:', {
      userId: user.id,
      messageId
    });

    // 2. Verificar que el mensaje existe y el usuario tiene acceso
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        conversations!inner (
          participant_1,
          participant_2
        )
      `)
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      console.log('[ATTACHMENTS] Message not found:', messageId);
      return NextResponse.json(
        { error: 'Mensaje no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Verificar acceso (RLS se encargará, pero validamos explícitamente)
    const conversation = message.conversations as any;
    if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
      console.log('[ATTACHMENTS] User not participant:', user.id);
      return NextResponse.json(
        { error: 'No tienes acceso a este mensaje', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 4. Obtener adjuntos (RLS se encarga de la seguridad)
    const { data: attachments, error: attachmentsError } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (attachmentsError) {
      console.error('[ATTACHMENTS] List error:', attachmentsError);
      return NextResponse.json(
        { error: 'Error al obtener adjuntos', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // 5. Generar URLs firmadas para cada adjunto
    const attachmentsWithUrls: Attachment[] = await Promise.all(
      (attachments || []).map(async (att) => {
        const { data: signedUrlData } = await supabase.storage
          .from('message-attachments')
          .createSignedUrl(att.path, 3600); // 1 hora

        const fileName = att.path.split('/').pop() || 'archivo';

        return {
          id: att.id,
          url: signedUrlData?.signedUrl || '',
          mime: att.mime,
          sizeBytes: att.size_bytes,
          width: att.width,
          height: att.height,
          fileName,
          createdAt: att.created_at
        };
      })
    );

    console.log('[ATTACHMENTS] List success:', {
      userId: user.id,
      messageId,
      count: attachmentsWithUrls.length
    });

    return NextResponse.json({
      success: true,
      attachments: attachmentsWithUrls,
      count: attachmentsWithUrls.length
    });

  } catch (error) {
    console.error('[ATTACHMENTS] List exception:', error);
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
