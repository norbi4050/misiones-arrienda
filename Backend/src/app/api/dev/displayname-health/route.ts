/**
 * PROMPT 2: Endpoint de verificación rápida de displayNames
 * ============================================================================
 * Solo para desarrollo - Verifica que todos los displayNames sean válidos
 * 
 * Funcionalidad:
 * - Lista conversaciones del usuario actual
 * - Para cada otherUser devuelve: userId, displayName, avatarUrl, source
 * - Loggea [DisplayNameHealth] por cada item
 * - Nunca retorna UUID como displayName (fallback a "Usuario")
 * 
 * Uso:
 * GET /api/dev/displayname-health
 * 
 * Response:
 * {
 *   success: true,
 *   userId: "current-user-id",
 *   conversations: [
 *     {
 *       threadId: "...",
 *       otherUser: {
 *         userId: "...",
 *         displayName: "Juan",
 *         avatarUrl: "https://...",
 *         source: "User.name"
 *       }
 *     }
 *   ],
 *   summary: {
 *     total: 10,
 *     withValidName: 9,
 *     withFallback: 1,
 *     withAvatar: 7
 *   }
 * }
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getDisplayNameWithSource } from '@/lib/messages/display-name-helper';
import { isUUID } from '@/lib/utils/validation';

function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase();
  
  try {
    // Obtener usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`[DisplayNameHealth] Checking conversations for user: ${user.id}`);

    // Obtener conversaciones del usuario
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        created_at
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (convError) {
      console.error('[DisplayNameHealth] Error fetching conversations:', convError);
      return NextResponse.json(
        { error: 'Error fetching conversations', details: convError.message },
        { status: 500 }
      );
    }

    const results = [];
    let withValidName = 0;
    let withFallback = 0;
    let withAvatar = 0;

    // Para cada conversación, obtener info del otro usuario
    for (const conv of conversations || []) {
      const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;

      // Obtener datos del otro usuario
      const { data: otherUserData } = await supabase
        .from('users')
        .select('id, name, email, avatar')
        .eq('id', otherUserId)
        .single();

      if (otherUserData) {
        // Calcular displayName con source tracking
        const { displayName, source } = getDisplayNameWithSource(
          otherUserData,
          null // No hay userProfile en este caso
        );

        // PROMPT 2: Garantizar que nunca sea UUID
        let finalDisplayName = displayName;
        if (isUUID(displayName)) {
          finalDisplayName = 'Usuario';
          console.warn(`[DisplayNameHealth] UUID detected for user ${otherUserId}, using fallback`);
        }

        // Contar estadísticas
        if (source === 'User.name') {
          withValidName++;
        } else {
          withFallback++;
        }

        if (otherUserData.avatar) {
          withAvatar++;
        }

        // Log por cada item
        console.log(
          `[DisplayNameHealth] threadId=${conv.id}, ` +
          `otherUserId=${otherUserId}, ` +
          `displayName="${finalDisplayName}", ` +
          `source=${source}, ` +
          `hasAvatar=${!!otherUserData.avatar}`
        );

        results.push({
          threadId: conv.id,
          otherUser: {
            userId: otherUserId,
            displayName: finalDisplayName,
            avatarUrl: otherUserData.avatar || null,
            source: source
          }
        });
      }
    }

    const summary = {
      total: results.length,
      withValidName,
      withFallback,
      withAvatar,
      percentageWithAvatar: results.length > 0 
        ? Math.round((withAvatar / results.length) * 100) 
        : 0
    };

    console.log(`[DisplayNameHealth] Summary:`, summary);

    return NextResponse.json({
      success: true,
      userId: user.id,
      userEmail: user.email,
      conversations: results,
      summary
    });

  } catch (error: any) {
    console.error('[DisplayNameHealth] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
