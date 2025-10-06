import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/comunidad/messages/[conversationId] - Obtener mensajes de una conversación
export async function GET(
  _req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ conversation: null, messages: [] });

    // Leer la conversación desde la vista y validar pertenencia
    const { data: convRows, error: convErr } = await supabase
      .from('community_conversations_view')
      .select('id,user1_id,user2_id,last_message_at,created_at')
      .eq('id', params.conversationId)
      .limit(1);

    if (convErr) {
      console.error('[community/messages/:id] conv error', convErr);
      return NextResponse.json({ conversation: null, messages: [], error: convErr.message });
    }
    const conv = convRows?.[0];
    if (!conv) return NextResponse.json({ conversation: null, messages: [] });

    if (conv.user1_id !== user.id && conv.user2_id !== user.id) {
      // RLS debería proteger, pero devolvemos vacío para UX predecible
      return NextResponse.json({ conversation: null, messages: [] });
    }

    // Traer mensajes desde la vista (sin joins)
    const { data: msgs, error: msgErr } = await supabase
      .from('community_messages_view')
      .select('id,conversation_id,sender_id,content,created_at,read_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    if (msgErr) {
      console.error('[community/messages/:id] msgs error', msgErr);
      return NextResponse.json({ conversation: null, messages: [], error: msgErr.message });
    }

    const participants = [conv.user1_id, conv.user2_id];
    const otherParticipant = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    const conversation = {
      id: conv.id,
      participants,
      otherParticipant,
      last_message_at: conv.last_message_at,
      created_at: conv.created_at,
      match: null, // compat opcional
    };

    return NextResponse.json({ conversation, messages: msgs ?? [] });
  } catch (e: any) {
    console.error('[community/messages/:id] unexpected', e);
    return NextResponse.json({ conversation: null, messages: [], error: e?.message ?? 'unexpected' });
  }
}
