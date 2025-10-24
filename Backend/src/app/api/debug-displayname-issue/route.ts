// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint de diagnóstico para investigar el problema de displayName
 * mostrando email en lugar de nombre comercial de inmobiliaria
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    console.log(`[DEBUG] Usuario actual: ${user.id}`)

    // Obtener todas las conversaciones del usuario
    const { data: userProfile } = await supabase
      .from('UserProfile')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ 
        error: 'NO_PROFILE',
        message: 'Usuario no tiene UserProfile'
      }, { status: 404 })
    }

    const profileId = userProfile.id

    // Obtener conversaciones
    const { data: conversations } = await supabase
      .from('Conversation')
      .select('id, aId, bId')
      .or(`aId.eq.${profileId},bId.eq.${profileId}`)
      .eq('isActive', true)
      .limit(5)

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        message: 'No hay conversaciones',
        myProfileId: profileId
      })
    }

    // Para cada conversación, obtener datos del otro usuario
    const conversationsDebug = []

    for (const conv of conversations) {
      const otherProfileId = conv.aId === profileId ? conv.bId : conv.aId

      // Obtener UserProfile del otro usuario
      const { data: otherProfile } = await supabase
        .from('UserProfile')
        .select('id, userId')
        .eq('id', otherProfileId)
        .single()

      // Obtener User del otro usuario
      let otherUserData: any = null
      let userDataError: any = null
      if (otherProfile?.userId) {
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('id, name, email, avatar, company_name, userType')
          .eq('id', otherProfile.userId)
          .single()
        otherUserData = userData
        userDataError = userError
      }

      conversationsDebug.push({
        conversationId: conv.id,
        otherProfileId,
        otherUserId: otherProfile?.userId,
        otherUserData: {
          id: otherUserData?.id,
          name: otherUserData?.name,
          email: otherUserData?.email,
          companyName: otherUserData?.company_name,
          userType: otherUserData?.user_type,
          avatar: otherUserData?.avatar
        },
        userDataError: userDataError ? {
          message: userDataError.message,
          code: userDataError.code,
          details: userDataError.details
        } : null,
        analysis: {
          hasName: !!otherUserData?.name,
          hasCompanyName: !!otherUserData?.company_name,
          userType: otherUserData?.user_type,
          whatWouldBeDisplayed: otherUserData?.name || otherUserData?.company_name || otherUserData?.email?.split('@')[0] || 'Usuario'
        }
      })
    }

    return NextResponse.json({
      success: true,
      myUserId: user.id,
      myProfileId: profileId,
      conversationsCount: conversations.length,
      conversations: conversationsDebug,
      diagnosis: {
        message: 'Revisa el campo "whatWouldBeDisplayed" para ver qué se mostraría según la lógica actual',
        priority: 'name > company_name > emailLocal > fallback'
      }
    })

  } catch (error: any) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR',
      details: error.message 
    }, { status: 500 })
  }
}
