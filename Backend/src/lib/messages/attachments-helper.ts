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
    
    // Obtener adjuntos del mensaje desde tabla PRISMA
    const { data: attachments, error } = await supabase
      .from('MessageAttachment')
      .select('*')
      .eq('messageId', messageId)
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('[Attachments Helper] Error fetching attachments:', error);
      return [];
    }

    if (!attachments || attachments.length === 0) {
      return [];
    }

    // Generar URLs firmadas para cada adjunto
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (att) => {
        const fileName = att.path.split('/').pop() || 'archivo';
        console.log('[Attachments Helper] Generando signed URL para:', att.path);
        
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('message-attachments')
          .createSignedUrl(att.path, 3600, {
            download: fileName  // Forzar descarga con nombre de archivo
          });

        if (urlError) {
          console.error('[Attachments Helper] Error creating signed URL:', urlError);
        }
        
        console.log('[Attachments Helper] Signed URL result:', {
          path: att.path,
          fileName,
          signedUrl: signedUrlData?.signedUrl,
          hasDownloadParam: signedUrlData?.signedUrl?.includes('download='),
          error: urlError
        });

        return {
          id: att.id,
          url: signedUrlData?.signedUrl || '',
          mime: att.mime,
          sizeBytes: att.sizeBytes,
          width: att.width,
          height: att.height,
          fileName,
          createdAt: att.createdAt
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
    
    // Obtener todos los adjuntos de una vez desde tabla PRISMA
    const { data: attachments, error } = await supabase
      .from('MessageAttachment')
      .select('*')
      .in('messageId', messageIds)
      .order('createdAt', { ascending: true});

    if (error || !attachments) {
      console.error('[Attachments Helper] Batch error:', error);
      return new Map();
    }

    // Agrupar por message_id
    const attachmentsByMessage = new Map<string, Attachment[]>();

    for (const att of attachments) {
      const fileName = att.path.split('/').pop() || 'archivo';
      console.log('[Attachments Helper BATCH] Generando signed URL para:', att.path);
      
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('message-attachments')
        .createSignedUrl(att.path, 3600, {
          download: fileName  // Forzar descarga con nombre de archivo
        });

      if (urlError) {
        console.error('[Attachments Helper BATCH] Error creating signed URL:', urlError);
      }
      
      console.log('[Attachments Helper BATCH] Signed URL result:', {
        path: att.path,
        fileName,
        signedUrl: signedUrlData?.signedUrl,
        hasDownloadParam: signedUrlData?.signedUrl?.includes('download='),
        error: urlError
      });

      const attachment: Attachment = {
        id: att.id,
        url: signedUrlData?.signedUrl || '',
        mime: att.mime,
        sizeBytes: att.sizeBytes,
        width: att.width,
        height: att.height,
        fileName,
        createdAt: att.createdAt
      };

      const existing = attachmentsByMessage.get(att.messageId) || [];
      existing.push(attachment);
      attachmentsByMessage.set(att.messageId, existing);
    }

    return attachmentsByMessage;
  } catch (error) {
    console.error('[Attachments Helper] Batch exception:', error);
    return new Map();
  }
}
