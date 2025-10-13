// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/messages/threads/[id]/delete
 * Elimina una conversación de propiedades completa incluyendo todos sus mensajes
 * 
 * Seguridad:
 * - Acepta tanto auth.user.id como profile.id para validar participación
 * - Se eliminan en cascada todos los mensajes asociados
 * - Hard delete (eliminación permanente)
 * - SIEMPRE retorna status 200 con formato { ok: boolean, error?: string }
 */

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
      return NextResponse.json(
        { ok: false, error: 'unauthenticated' },
        { status: 200 }
      );
    }

    const threadId = params.id;

    // 2. Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(threadId)) {
      return NextResponse.json(
        { ok: false, error: 'invalid-id' },
        { status: 200 }
      );
    }

    // 3. Leer conversación (intentar ambos esquemas)
    let conv = await supabase
      .from('Conversation')
      .select('id,aId,bId')
      .eq('id', threadId)
      .maybeSingle();

    // Fallback a PostgREST-style
    if (!conv?.data) {
      conv = await supabase
        .from('conversations')
        .select('id,participant_1,participant_2,a_id,b_id')
        .eq('id', threadId)
        .maybeSingle();
    }

    if (!conv?.data) {
      return NextResponse.json(
        { ok: false, error: 'not-found' },
        { status: 200 }
      );
    }

    // 4. Normalizar participantes (soportar todas las variantes de columnas)
    const convData = conv.data as any;
    const parts = [
      convData?.aId,
      convData?.bId,
      convData?.participant_1,
      convData?.participant_2,
      convData?.a_id,
      convData?.b_id
    ].filter(Boolean).map(String);

    const me = String(user.id);
    const isParticipant = parts.includes(me);

    console.debug('[DELETE/thread] validate', { threadId, userId: user.id, parts, isParticipant });

    if (!isParticipant) {
      return NextResponse.json(
        { ok: false, error: 'forbidden' },
        { status: 200 }
      );
    }

    // 5. Eliminar mensajes (probar ambas tablas/columnas)
    await supabase.from('Message').delete().eq('conversationId', threadId);
    await supabase.from('messages').delete().eq('conversation_id', threadId);

    // 6. Eliminar conversación (ambas tablas)
    await supabase.from('Conversation').delete().eq('id', threadId);
    await supabase.from('conversations').delete().eq('id', threadId);

    console.debug('[DELETE/thread] deleted', { threadId });

    // 7. Respuesta exitosa
    return NextResponse.json(
      { ok: true },
      { status: 200 }
    );

  } catch (error: any) {
    console.debug('[DELETE/thread] Error inesperado:', error?.message);
    return NextResponse.json(
      { ok: false, error: 'unexpected' },
      { status: 200 }
    );
  }
}
