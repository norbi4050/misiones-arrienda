// =====================================================
// B6 - API: List Message Attachments
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Attachment } from '@/types/messages';

/**
 * GET /api/messages/[conversationId]/attachments?messageId=xxx
 * Lista todos los adjuntos de un mensaje específico o de toda la conversación
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // 1. Autenticación usando cookies (mismo patrón que otros endpoints)
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const conversationId = params.conversationId;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    console.log('[ATTACHMENTS] List request:', {
      userId: user.id,
      conversationId,
      messageId
    });

    // Si se proporciona messageId, buscar adjuntos de ese mensaje específico
    // Si no, buscar todos los adjuntos de la conversación
    if (!messageId) {
      return NextResponse.json(
        { error: 'Se requiere messageId', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // 2. Intentar primero con esquema PRISMA (tabla MessageAttachment)
    let attachments: any[] | null = null
    let schema = 'UNKNOWN'

    const { data: prismaAttachments, error: prismaError } = await supabase
      .from('MessageAttachment')
      .select('*')
      .eq('messageId', messageId)
      .order('createdAt', { ascending: true });

    console.log('[ATTACHMENTS] PRISMA query result:', {
      hasData: !!prismaAttachments,
      dataLength: prismaAttachments?.length || 0,
      hasError: !!prismaError,
      errorCode: prismaError?.code,
      errorMessage: prismaError?.message
    });

    if (!prismaError && prismaAttachments && prismaAttachments.length > 0) {
      attachments = prismaAttachments
      schema = 'PRISMA'
      console.log('[ATTACHMENTS] ✅ Found in PRISMA schema:', prismaAttachments.length)
    }

    // 3. Si no se encontró en PRISMA, intentar con esquema SUPABASE (tabla message_attachments)
    if (!attachments || attachments.length === 0) {
      console.log('[ATTACHMENTS] Trying SUPABASE schema (message_attachments)...')

      const { data: supabaseAttachments, error: supabaseError } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      console.log('[ATTACHMENTS] SUPABASE query result:', {
        hasData: !!supabaseAttachments,
        dataLength: supabaseAttachments?.length || 0,
        hasError: !!supabaseError,
        errorCode: supabaseError?.code,
        errorMessage: supabaseError?.message
      });

      if (supabaseError) {
        console.error('[ATTACHMENTS] ❌ Error fetching from SUPABASE schema:', supabaseError);
        return NextResponse.json(
          { error: 'Error al obtener adjuntos', code: 'DB_ERROR', details: supabaseError.message },
          { status: 500 }
        );
      }

      attachments = supabaseAttachments || []
      schema = 'SUPABASE'
      console.log('[ATTACHMENTS] ✅ Found in SUPABASE schema:', attachments.length)
    }

    // 4. Generar URLs firmadas para cada adjunto
    const attachmentsWithUrls: Attachment[] = await Promise.all(
      (attachments || []).map(async (att) => {
        // Determinar campos según esquema
        const storagePath = schema === 'PRISMA' ? att.storagePath : att.storage_path
        const mimeType = schema === 'PRISMA' ? att.mimeType : att.mime_type
        const fileSize = schema === 'PRISMA' ? att.fileSize : att.file_size
        const createdAt = schema === 'PRISMA' ? att.createdAt : att.created_at

        const { data: signedUrlData } = await supabase.storage
          .from('message-attachments')
          .createSignedUrl(storagePath, 3600); // 1 hora

        const fileName = storagePath.split('/').pop() || 'archivo';

        return {
          id: att.id,
          storageUrl: signedUrlData?.signedUrl || '',
          mimeType: mimeType,
          fileSize: fileSize,
          width: att.width,
          height: att.height,
          fileName,
          createdAt: createdAt
        };
      })
    );

    console.log('[ATTACHMENTS] List success:', {
      userId: user.id,
      conversationId,
      messageId,
      schema,
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
