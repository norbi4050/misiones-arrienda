import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('UserProfile')
      .select('id, userId')
      .eq('userId', user.id)
      .single()

    // Test 1: Can we read MessageAttachment table?
    const { data: allAttachments, error: allError } = await supabase
      .from('MessageAttachment')
      .select('*')
      .limit(5)

    // Test 2: Can we read attachments for specific message IDs?
    const testMessageIds = [
      '3f161588-9253-4e16-bfe8-236c272b2741',
      '5c13fcf0-5c6a-4704-bb5d-62f3a01d8c2a'
    ]
    
    const { data: specificAttachments, error: specificError } = await supabase
      .from('MessageAttachment')
      .select('*')
      .in('messageId', testMessageIds)

    // Test 3: Can we read with userId filter?
    const { data: userAttachments, error: userError } = await supabase
      .from('MessageAttachment')
      .select('*')
      .eq('userId', userProfile?.id || user.id)
      .limit(5)

    return NextResponse.json({
      user: {
        authId: user.id,
        profileId: userProfile?.id || null
      },
      tests: {
        allAttachments: {
          success: !allError,
          error: allError?.message || null,
          count: allAttachments?.length || 0,
          data: allAttachments || []
        },
        specificAttachments: {
          success: !specificError,
          error: specificError?.message || null,
          count: specificAttachments?.length || 0,
          data: specificAttachments || []
        },
        userAttachments: {
          success: !userError,
          error: userError?.message || null,
          count: userAttachments?.length || 0,
          data: userAttachments || []
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
