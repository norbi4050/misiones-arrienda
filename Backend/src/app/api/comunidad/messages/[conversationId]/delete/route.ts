import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


/**
 * DELETE /api/comunidad/messages/[conversationId]/delete
 * Elimina una conversación completa incluyendo todos sus mensajes
 * 
 * Seguridad:
 * - Solo el usuario que es participante de la conversación puede eliminarla
 * - Se eliminan en cascada todos los mensajes asociados
 * - Se valida la pertenencia antes de eliminar
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createClient();
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const conversationId = params.conversationId;

    // 2. Validar que el conversationId sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return NextResponse.json(
        { error: 'ID de conversación inválido' },
        { status: 400 }
      );
    }

    // 3. Verificar que la conversación existe y el usuario es participante
    const { data: conversation, error: convError } = await supabase
      .from('community_conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // 4. Validar que el usuario es participante de la conversación
    const isParticipant = 
      conversation.user1_id === user.id || 
      conversation.user2_id === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta conversación' },
        { status: 403 }
      );
    }

    // 5. Eliminar todos los mensajes de la conversación primero
    const { error: messagesDeleteError } = await supabase
      .from('community_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesDeleteError) {
      console.error('[DELETE conversation] Error eliminando mensajes:', messagesDeleteError);
      return NextResponse.json(
        { 
          error: 'Error al eliminar los mensajes de la conversación',
          details: messagesDeleteError.message 
        },
        { status: 500 }
      );
    }

    // 6. Eliminar la conversación
    const { error: conversationDeleteError } = await supabase
      .from('community_conversations')
      .delete()
      .eq('id', conversationId);

    if (conversationDeleteError) {
      console.error('[DELETE conversation] Error eliminando conversación:', conversationDeleteError);
      return NextResponse.json(
        { 
          error: 'Error al eliminar la conversación',
          details: conversationDeleteError.message 
        },
        { status: 500 }
      );
    }

    // 7. Respuesta exitosa
    return NextResponse.json(
      { 
        success: true,
        message: 'Conversación eliminada exitosamente',
        deletedConversationId: conversationId
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[DELETE conversation] Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error?.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
