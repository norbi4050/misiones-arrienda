// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/comunidad/messages - Obtener conversaciones del usuario
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ conversations: [], count: 0 });

    const { data, error } = await supabase
      .from('community_conversations_view')
      .select('id,user1_id,user2_id,last_message_at,created_at')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('[community/messages] list error', error);
      return NextResponse.json({ conversations: [], error: error.message });
    }

    const conversations = (data ?? []).map((c) => {
      const participants = [c.user1_id, c.user2_id];
      const otherParticipant = c.user1_id === user.id ? c.user2_id : c.user1_id;
      return {
        id: c.id,
        participants,
        otherParticipant,
        last_message_at: c.last_message_at,
        created_at: c.created_at,
        // compat opcional:
        match: null,
      };
    });

    return NextResponse.json({ conversations, count: conversations.length });
  } catch (e: any) {
    console.error('[community/messages] unexpected', e);
    return NextResponse.json({ conversations: [], error: e?.message ?? 'unexpected' });
  }
}
