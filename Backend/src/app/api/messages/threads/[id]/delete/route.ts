import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/messages/threads/[id]/delete
 * Elimina una conversación de propiedades completa incluyendo todos sus mensajes
 * 
 * Seguridad:
 * - Solo el usuario que es participante de la conversación puede eliminarla
 * - Se eliminan en cascada todos los mensajes asociados
 * - Se valida la pertenencia antes de eliminar
 * - SIEMPRE retorna status 200 con formato { ok: boolean, error?: string }
 * - Detecta automáticamente el esquema (Prisma vs Supabase)
 */

// Detectar esquema de base de datos
async function detectSchema(supabase: any): Promise<'PRISMA' | 'SUPABASE'> {
  // Intentar tabla Conversation (Prisma - PascalCase)
  try {
    const { error } = await supabase
      .from('Conversation')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (!error) {
      return 'PRISMA';
    }
  } catch {}

  // Fallback a conversations (Supabase - snake_case)
  return 'SUPABASE';
}

export async function DELETE(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const params = context.params;
  
  try {
    const supabase = await createClient();
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[threads/delete] No autenticado:', authError?.message);
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 200 }
      );
    }

    const threadId = params.id;

    // 2. Validar que el threadId sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(threadId)) {
      console.error('[threads/delete] UUID inválido:', threadId);
      return NextResponse.json(
        { ok: false, error: 'invalid-id' },
        { status: 200 }
      );
    }

    // 3. Detectar esquema de base de datos
    const schema = await detectSchema(supabase);
    console.log(`[threads/delete] Esquema detectado: ${schema}`);

    // ============================================
    // RAMA PRISMA: Conversation con aId/bId
    // ============================================
    if (schema === 'PRISMA') {
      // Obtener UserProfile del usuario actual
      const { data: userProfile } = await supabase
        .from('UserProfile')
        .select('id')
        .eq('userId', user.id)
        .maybeSingle();

      if (!userProfile) {
        console.error('[threads/delete] UserProfile no encontrado para usuario:', user.id);
        return NextResponse.json(
          { ok: false, error: 'not-found' },
          { status: 200 }
        );
      }

      const profileId = userProfile.id;

      // Buscar conversación
      const { data: conv, error: convError } = await supabase
        .from('Conversation')
        .select('id, aId, bId')
        .eq('id', threadId)
        .maybeSingle();

      if (convError) {
        console.error('[threads/delete] Error consultando conversación:', convError);
        return NextResponse.json(
          { ok: false, error: 'unexpected' },
          { status: 200 }
        );
      }

      if (!conv) {
        console.error('[threads/delete] Conversación no encontrada:', threadId);
        return NextResponse.json(
          { ok: false, error: 'not-found' },
          { status: 200 }
        );
      }

      // Validar participación
      const isParticipant = conv.aId === profileId || conv.bId === profileId;

      if (!isParticipant) {
        console.error('[threads/delete] Usuario no es participante:', profileId, 'thread:', threadId);
        return NextResponse.json(
          { ok: false, error: 'not-found' },
          { status: 200 }
        );
      }

      // Eliminar mensajes primero
      const { error: messagesDeleteError } = await supabase
        .from('Message')
        .delete()
        .eq('conversationId', threadId);

      if (messagesDeleteError) {
        console.error('[threads/delete] Error eliminando mensajes:', messagesDeleteError);
        return NextResponse.json(
          { ok: false, error: 'unexpected' },
          { status: 200 }
        );
      }

      // Eliminar conversación
      const { error: conversationDeleteError } = await supabase
        .from('Conversation')
        .delete()
        .eq('id', threadId);

      if (conversationDeleteError) {
        console.error('[threads/delete] Error eliminando conversación:', conversationDeleteError);
        return NextResponse.json(
          { ok: false, error: 'unexpected' },
          { status: 200 }
        );
      }
    }

    // ============================================
    // RAMA SUPABASE: conversations con sender_id/receiver_id
    // ============================================
    else {
      // Buscar conversación
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('id, sender_id, receiver_id')
        .eq('id', threadId)
        .maybeSingle();

      if (convError) {
        console.error('[threads/delete] Error consultando conversación:', convError);
        return NextResponse.json(
          { ok: false, error: 'unexpected' },
          { status: 200 }
        );
      }

      if (!conv) {
        console.error('[threads/delete] Conversación no encontrada:', threadId);
        return NextResponse.json(
          { ok: false, error: 'not-found' },
          { status: 200 }
        );
      }

      // Validar participación
      const isParticipant = conv.sender_id === user.id || conv.receiver_id === user.id;

      if (!isParticipant) {
        console.error('[threads/delete] Usuario no es participante:', user.id, 'thread:', threadId);
        return NextResponse.json(
          { ok: false, error: 'not-found' },
          { status: 200 }
        );
      }

      // Eliminar mensajes primero
      const { error: messagesDeleteError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', threadId);

      if (messagesDeleteError) {
        console.error('[threads/delete] Error eliminando mensajes:', messagesDeleteError);
        return NextResponse.json(
          { ok: false, error: 'unexpected' },
          { status: 200 }
        );
      }

      // Eliminar conversación
      const { error: conversationDeleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', threadId);

      if (conversationDeleteError) {
        console.error('[threads/delete] Error eliminando conversación:', conversationDeleteError);
        return NextResponse.json(
          { ok: false, error: 'unexpected' },
          { status: 200 }
        );
      }
    }

    // Respuesta exitosa
    console.log('[threads/delete] Conversación eliminada exitosamente:', threadId, 'esquema:', schema);
    return NextResponse.json(
      { ok: true },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[threads/delete] Error inesperado:', error);
    return NextResponse.json(
      { ok: false, error: 'unexpected' },
      { status: 200 }
    );
  }
}
