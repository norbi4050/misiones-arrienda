import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint de debugging para ver en tiempo real qué datos tiene el usuario
 * y qué displayName se está calculando
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener datos del usuario actual
    const { data: currentUser } = await supabase
      .from('User')
      .select('id, email, name, companyName, user_type')
      .eq('id', user.id)
      .single()

    // Obtener UserProfile si existe
    const { data: currentProfile } = await supabase
      .from('UserProfile')
      .select('id, userId, full_name')
      .eq('userId', user.id)
      .single()

    // Obtener todas las conversaciones
    const { data: conversations } = await supabase
      .from('Conversation')
      .select('id, aId, bId')
      .or(`aId.eq.${currentProfile?.id},bId.eq.${currentProfile?.id}`)

    // Para cada conversación, obtener datos del otro usuario
    const threadsDebug = []
    for (const conv of conversations || []) {
      const otherProfileId = conv.aId === currentProfile?.id ? conv.bId : conv.aId

      const { data: otherProfile } = await supabase
        .from('UserProfile')
        .select('id, userId, full_name')
        .eq('id', otherProfileId)
        .single()

      const { data: otherUser } = await supabase
        .from('User')
        .select('id, email, name, companyName, user_type')
        .eq('id', otherProfile?.userId)
        .single()

      threadsDebug.push({
        conversationId: conv.id,
        otherUser: {
          id: otherUser?.id,
          email: otherUser?.email,
          name: otherUser?.name,
          companyName: otherUser?.companyName,
          user_type: otherUser?.user_type,
          full_name: otherProfile?.full_name
        },
        calculatedDisplayName: otherUser?.name || otherUser?.companyName || otherUser?.email?.split('@')[0] || 'Usuario'
      })
    }

    return NextResponse.json({
      currentUser: {
        id: currentUser?.id,
        email: currentUser?.email,
        name: currentUser?.name,
        companyName: currentUser?.companyName,
        user_type: currentUser?.user_type
      },
      currentProfile: {
        id: currentProfile?.id,
        userId: currentProfile?.userId,
        full_name: currentProfile?.full_name
      },
      threads: threadsDebug,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Error en debugging',
      details: error.message 
    }, { status: 500 })
  }
}
