// =====================================================
// B6 - ATTACHMENTS HELPER
// Helper functions para obtener adjuntos de mensajes
// =====================================================

import { createClient } from '@/lib/supabase/server';
import type { Attachment } from '@/types/messages';

/**
 * Obtiene los adjuntos de un mensaje con URLs firmadas
 */
export async function getMessageAttachments(messageId: string): Promise<Attachment[]> {
  try {
    const supabase = createClient();

    // Obtener adjuntos del mensaje - usar nombre correcto de tabla PostgreSQL
    const { data: attachments, error } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Attachments Helper] No se pudieron cargar adjuntos (404 esperado si no existen):', error);
      return [];
    }

    if (!attachments || attachments.length === 0) {
      return [];
    }

    // Generar URLs firmadas para cada adjunto
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (att) => {
        const fileName = att.storage_path.split('/').pop() || 'archivo';
        console.log('[Attachments Helper] Generando signed URL para:', att.storage_path);

        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('message-attachments')
          .createSignedUrl(att.storage_path, 3600, {
            download: fileName  // Forzar descarga con nombre de archivo
          });

        if (urlError) {
          console.error('[Attachments Helper] Error creating signed URL:', urlError);
        }

        console.log('[Attachments Helper] Signed URL result:', {
          path: att.storage_path,
          fileName,
          signedUrl: signedUrlData?.signedUrl,
          hasDownloadParam: signedUrlData?.signedUrl?.includes('download='),
          error: urlError
        });

        return {
          id: att.id,
          storageUrl: signedUrlData?.signedUrl || '',
          mimeType: att.mime_type,
          fileSize: att.file_size,
          width: att.width,
          height: att.height,
          fileName,
          createdAt: att.created_at
        };
      })
    );

    return attachmentsWithUrls;
  } catch (error) {
    console.error('[Attachments Helper] Exception:', error);
    return [];
  }
}

/**
 * Obtiene adjuntos para múltiples mensajes (batch)
 */
export async function getMessagesAttachments(
  messageIds: string[]
): Promise<Map<string, Attachment[]>> {
  try {
    if (messageIds.length === 0) {
      return new Map();
    }

    const supabase = createClient();

    // Obtener todos los adjuntos de una vez - usar nombre correcto de tabla PostgreSQL
    const { data: attachments, error } = await supabase
      .from('message_attachments')
      .select('*')
      .in('message_id', messageIds)
      .order('created_at', { ascending: true});

    if (error || !attachments) {
      console.warn('[Attachments Helper] Batch - No se pudieron cargar adjuntos (404 esperado si no existen):', error);
      return new Map();
    }

    // Agrupar por message_id
    const attachmentsByMessage = new Map<string, Attachment[]>();

    for (const att of attachments) {
      const fileName = att.storage_path.split('/').pop() || 'archivo';
      console.log('[Attachments Helper BATCH] Generando signed URL para:', att.storage_path);

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('message-attachments')
        .createSignedUrl(att.storage_path, 3600, {
          download: fileName  // Forzar descarga con nombre de archivo
        });

      if (urlError) {
        console.error('[Attachments Helper BATCH] Error creating signed URL:', urlError);
      }

      console.log('[Attachments Helper BATCH] Signed URL result:', {
        path: att.storage_path,
        fileName,
        signedUrl: signedUrlData?.signedUrl,
        hasDownloadParam: signedUrlData?.signedUrl?.includes('download='),
        error: urlError
      });

      const attachment: Attachment = {
        id: att.id,
        storageUrl: signedUrlData?.signedUrl || '',
        mimeType: att.mime_type,
        fileSize: att.file_size,
        width: att.width,
        height: att.height,
        fileName,
        createdAt: att.created_at
      };

      const existing = attachmentsByMessage.get(att.message_id) || [];
      existing.push(attachment);
      attachmentsByMessage.set(att.message_id, existing);
    }

    return attachmentsByMessage;
  } catch (error) {
    console.error('[Attachments Helper] Batch exception:', error);
    return new Map();
  }
}
