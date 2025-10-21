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
    
    await supabase.from('Message').delete().eq('conversationId', threadId);
    await supabase.from('messages').delete().eq('conversation_id', threadId);

    // 6. Eliminar conversación (ambas tablas)
    console.debug('[DELETE/thread] QUERY', { step: 'delete_conversation', threadId });
    
    await supabase.from('Conversation').delete().eq('id', threadId);
    await supabase.from('conversations').delete().eq('id', threadId);

    const duration = Date.now() - startTime;
    console.debug('[DELETE/thread] deleted', { threadId, duration_ms: duration });

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
