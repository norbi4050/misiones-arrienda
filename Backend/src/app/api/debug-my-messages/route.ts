import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET() {
  try {
    const supabase = createClient()

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Llamar al endpoint de threads
    const threadsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/messages/threads`, {
      headers: {
        'Cookie': `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    })

    const threadsData = await threadsResponse.json()

    // Verificar UserProfile
    const { data: userProfile } = await supabase
      .from('UserProfile')
      .select('*')
      .eq('userId', user.id)
      .single()

    // Verificar User
    const { data: userData } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single()

    // Verificar conversaciones directamente
    let conversationsDirect = null
    if (userProfile) {
      const { data } = await supabase
        .from('Conversation')
        .select('*')
        .or(`aId.eq.${userProfile.id},bId.eq.${userProfile.id}`)
      conversationsDirect = data
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      userData,
      userProfile,
      threadsApiResponse: {
        status: threadsResponse.status,
        data: threadsData
      },
      conversationsDirect,
      diagnosis: {
        hasUser: !!userData,
        hasUserProfile: !!userProfile,
        threadsCount: threadsData.threads?.length || 0,
        conversationsCount: conversationsDirect?.length || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
