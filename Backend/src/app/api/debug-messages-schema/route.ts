import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const results: any = {
      user_auth: {
        id: user.id,
        email: user.email
      },
      tables_check: {},
      user_profile_check: null,
      sample_data: {}
    }

    // 1. Verificar si existe la tabla UserProfile
    try {
      const { data: userProfiles, error: userProfileError } = await supabase
        .from('UserProfile')
        .select('*')
        .limit(1)

      results.tables_check.UserProfile = {
        exists: !userProfileError,
        error: userProfileError?.message,
        sample_count: userProfiles?.length || 0
      }

      // Verificar si el usuario actual tiene UserProfile
      if (!userProfileError) {
        const { data: currentUserProfile, error: currentProfileError } = await supabase
          .from('UserProfile')
          .select('*')
          .eq('userId', user.id)
          .single()

        results.user_profile_check = {
          exists: !currentProfileError,
          error: currentProfileError?.message,
          data: currentUserProfile
        }
      }
    } catch (error: any) {
      results.tables_check.UserProfile = {
        exists: false,
        error: error.message
      }
    }

    // 2. Verificar tabla Conversation
    try {
      const { data: conversations, error: conversationError } = await supabase
        .from('Conversation')
        .select('*')
        .limit(1)

      results.tables_check.Conversation = {
        exists: !conversationError,
        error: conversationError?.message,
        sample_count: conversations?.length || 0
      }

      if (conversations && conversations.length > 0) {
        results.sample_data.conversation = conversations[0]
      }
    } catch (error: any) {
      results.tables_check.Conversation = {
        exists: false,
        error: error.message
      }
    }

    // 3. Verificar tabla Message
    try {
      const { data: messages, error: messageError } = await supabase
        .from('Message')
        .select('*')
        .limit(1)

      results.tables_check.Message = {
        exists: !messageError,
        error: messageError?.message,
        sample_count: messages?.length || 0
      }

      if (messages && messages.length > 0) {
        results.sample_data.message = messages[0]
      }
    } catch (error: any) {
      results.tables_check.Message = {
        exists: false,
        error: error.message
      }
    }

    // 4. Verificar tablas con nombres en minúsculas (legacy)
    try {
      const { data: legacyConversations, error: legacyConvError } = await supabase
        .from('conversations')
        .select('*')
        .limit(1)

      results.tables_check.conversations_legacy = {
        exists: !legacyConvError,
        error: legacyConvError?.message,
        sample_count: legacyConversations?.length || 0
      }
    } catch (error: any) {
      results.tables_check.conversations_legacy = {
        exists: false,
        error: error.message
      }
    }

    try {
      const { data: legacyMessages, error: legacyMsgError } = await supabase
        .from('messages')
        .select('*')
        .limit(1)

      results.tables_check.messages_legacy = {
        exists: !legacyMsgError,
        error: legacyMsgError?.message,
        sample_count: legacyMessages?.length || 0
      }
    } catch (error: any) {
      results.tables_check.messages_legacy = {
        exists: false,
        error: error.message
      }
    }

    // 5. Verificar estructura de la base de datos
    try {
      const { data: tableInfo, error: tableInfoError } = await supabase
        .rpc('get_table_info', { table_name: 'Conversation' })

      results.table_structure = {
        Conversation: tableInfo,
        error: tableInfoError?.message
      }
    } catch (error: any) {
      results.table_structure = {
        error: error.message
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Error in debug messages schema:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: (error as Error).message },
      { status: 500 }
    )
  }
}
