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
  const startTime = Date.now();
  
  try {
    // PROMPT C: Log de inicio
    console.debug('[DELETE/thread] START', { 
      threadId: params.id, 
      ts: new Date().toISOString() 
    });

    const supabase = await createClient();
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.debug('[DELETE/thread] unauthenticated', { error: authError?.message });
      return NextResponse.json(
        { ok: false, reason: 'unauthenticated' },
        { status: 200 }
      );
    }

    console.debug('[DELETE/thread] authenticated', { userId: user.id });

    const threadId = params.id;

    // 2. Validar formato de ID (UUID o CUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cuidRegex = /^c[a-z0-9]{24,}$/i;

    if (!uuidRegex.test(threadId) && !cuidRegex.test(threadId)) {
      console.debug('[DELETE/thread] invalid-id', { threadId });
      return NextResponse.json(
        { ok: false, reason: 'invalid-id' },
        { status: 200 }
      );
    }

    // PROMPT B: Obtener profileId de user_profiles
    // NOTA: En user_profiles, user_id es la FK a auth.users.id
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const profileId = userProfile?.id || null;
    
    if (profileError) {
      console.debug('[DELETE/thread] profile lookup error', { 
        error: profileError.message, 
        userId: user.id 
      });
    }

    console.debug('[DELETE/thread] profile resolved', { 
      userId: user.id, 
      profileId,
      hasProfile: !!profileId
    });

    // 3. Leer conversación (intentar ambos esquemas)
    console.debug('[DELETE/thread] QUERY', { step: 'fetch_conversation', threadId });
    
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
      console.debug('[DELETE/thread] not-found', { threadId });
      return NextResponse.json(
        { ok: false, reason: 'not-found' },
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

    // PROMPT B: Crear Set con userId + profileId para validación robusta
    const validIds = new Set<string>();
    validIds.add(String(user.id));
    if (profileId) {
      validIds.add(String(profileId));
    }

    // PROMPT B: Validar participación con ambos IDs
    const isParticipant = parts.some(p => validIds.has(String(p)));

    // PROMPT B & C: Log detallado de validación
    console.debug('[DELETE/thread] validate', { 
      threadId, 
      userId: String(user.id), 
      profileId: profileId ? String(profileId) : null,
      parts, 
      isParticipant 
    });

    if (!isParticipant) {
      console.debug('[DELETE/thread] forbidden - not a participant', { 
        threadId, 
        userId: user.id,
        profileId,
        parts
      });
      return NextResponse.json(
        { ok: false, reason: 'not-participant' },
        { status: 200 }
      );
    }

    // 5. Eliminar mensajes (probar ambas tablas/columnas)
    console.debug('[DELETE/thread] QUERY', { step: 'delete_messages', threadId });

    const { error: msgError1 } = await supabase.from('Message').delete().eq('conversationId', threadId);
    if (msgError1) {
      console.debug('[DELETE/thread] Message delete error (can be ignored if table empty):', msgError1.message);
    }

    const { error: msgError2 } = await supabase.from('messages').delete().eq('conversation_id', threadId);
    if (msgError2) {
      console.debug('[DELETE/thread] messages delete error (can be ignored if table empty):', msgError2.message);
    }

    // 6. Eliminar conversación (ambas tablas)
    console.debug('[DELETE/thread] QUERY', { step: 'delete_conversation', threadId });

    const { data: delData1, error: convError1 } = await supabase.from('Conversation').delete().eq('id', threadId).select();
    if (convError1) {
      console.debug('[DELETE/thread] Conversation delete error:', convError1.message);
    } else {
      console.debug('[DELETE/thread] Conversation deleted rows:', delData1?.length || 0);
    }

    const { data: delData2, error: convError2 } = await supabase.from('conversations').delete().eq('id', threadId).select();
    if (convError2) {
      console.debug('[DELETE/thread] conversations delete error:', convError2.message);
    } else {
      console.debug('[DELETE/thread] conversations deleted rows:', delData2?.length || 0);
    }

    // Verificar que al menos una eliminación fue exitosa
    const totalDeleted = (delData1?.length || 0) + (delData2?.length || 0);
    if (totalDeleted === 0) {
      console.warn('[DELETE/thread] WARNING: No rows were deleted from any table');
      return NextResponse.json(
        { ok: false, reason: 'delete-failed', details: 'No rows affected' },
        { status: 200 }
      );
    }

    const duration = Date.now() - startTime;
    console.debug('[DELETE/thread] deleted', { threadId, totalDeleted, duration_ms: duration });

    // 7. Respuesta exitosa
    return NextResponse.json(
      { ok: true },
      { status: 200 }
    );

  } catch (error: any) {
    // PROMPT C: Log de error estructurado
    console.error('[DELETE/thread] ERROR', { 
      step: 'unexpected',
      message: error?.message, 
      code: error?.code,
      threadId: params.id
    });
    
    return NextResponse.json(
      { ok: false, reason: 'unexpected' },
      { status: 200 }
    );
  }
}
