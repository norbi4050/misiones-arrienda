import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
    }

    // 1. Obtener la conversación
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (convError) {
      return NextResponse.json({ 
        error: 'Error fetching conversation', 
        details: convError 
      }, { status: 500 })
    }

    // 2. Obtener los participantes
    const participants = conversation.participants || []
    
    // 3. Obtener los perfiles de los participantes
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url, updated_at')
      .in('id', participants)

    if (profilesError) {
      return NextResponse.json({ 
        error: 'Error fetching profiles', 
        details: profilesError 
      }, { status: 500 })
    }

    // 4. Verificar si los avatares existen en storage
    const avatarChecks = await Promise.all(
      (profiles || []).map(async (profile) => {
        if (!profile.avatar_url) {
          return {
            userId: profile.id,
            displayName: profile.display_name,
            avatarUrl: null,
            exists: false,
            reason: 'No avatar_url in database'
          }
        }

        // Extraer el path del avatar
        const urlParts = profile.avatar_url.split('/avatars/')
        const avatarPath = urlParts[1]

        if (!avatarPath) {
          return {
            userId: profile.id,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
            exists: false,
            reason: 'Invalid avatar URL format'
          }
        }

        // Verificar si existe en storage
        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('avatars')
          .list('', {
            search: avatarPath
          })

        return {
          userId: profile.id,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          avatarPath,
          exists: !fileError && fileData && fileData.length > 0,
          fileError: fileError?.message,
          fileData: fileData
        }
      })
    )

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        participants: conversation.participants,
        created_at: conversation.created_at
      },
      profiles,
      avatarChecks,
      summary: {
        totalParticipants: participants.length,
        profilesFound: profiles?.length || 0,
        avatarsWithUrl: profiles?.filter(p => p.avatar_url).length || 0,
        avatarsExisting: avatarChecks.filter(a => a.exists).length
      }
    })

  } catch (error: any) {
    console.error('Error in debug-conversation-avatars:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}
