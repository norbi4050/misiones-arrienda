import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    console.log('=== DEBUG MESSAGES THREADS ===')
    console.log('User ID:', user.id)
    console.log('User Email:', user.email)

    // Llamar al endpoint real
    const threadsResponse = await fetch(`${request.nextUrl.origin}/api/messages/threads`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    const threadsData = await threadsResponse.json()
    
    console.log('Threads Response Status:', threadsResponse.status)
    console.log('Threads Data:', JSON.stringify(threadsData, null, 2))

    // Verificar UserProfile
    const { data: userProfile, error: profileError } = await supabase
      .from('UserProfile')
      .select('*')
      .eq('userId', user.id)
      .single()

    console.log('UserProfile:', userProfile)
    console.log('UserProfile Error:', profileError)

    // Verificar tabla Conversation
    const { data: conversations, error: convError } = await supabase
      .from('Conversation')
      .select('*')
      .limit(5)

    console.log('Conversations (first 5):', conversations)
    console.log('Conversations Error:', convError)

    // Verificar tabla conversations (lowercase)
    const { data: conversationsLower, error: convLowerError } = await supabase
      .from('conversations')
      .select('*')
      .limit(5)

    console.log('conversations (lowercase, first 5):', conversationsLower)
    console.log('conversations Error:', convLowerError)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      threadsApiResponse: {
        status: threadsResponse.status,
        data: threadsData
      },
      userProfile: {
        data: userProfile,
        error: profileError?.message
      },
      conversationsCheck: {
        Conversation: {
          count: conversations?.length || 0,
          data: conversations,
          error: convError?.message
        },
        conversations: {
          count: conversationsLower?.length || 0,
          data: conversationsLower,
          error: convLowerError?.message
        }
      }
    })

  } catch (error: any) {
    console.error('DEBUG ERROR:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
