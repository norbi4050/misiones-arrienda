import { NextResponse, NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

// Helper to get local-part from email
function getEmailLocalPart(email: string): string {
  return email.split('@')[0] || 'usuario'
}

// Helper to get epoch seconds for cache busting
function getEpochSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ profile: null })
    }

    // Try to get existing profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url, updated_at')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create it with email local-part as display_name
    if (profileError || !profile) {
      const defaultDisplayName = getEmailLocalPart(user.email || '')
      
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          display_name: defaultDisplayName,
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .select('id, display_name, avatar_url, updated_at')
        .single()

      if (insertError) {
        console.error('[users/profile] insert error', insertError)
        return NextResponse.json({ 
          profile: null, 
          error: insertError.message 
        })
      }

      return NextResponse.json({
        id: newProfile.id,
        display_name: newProfile.display_name,
        avatar_url: newProfile.avatar_url,
        updated_at: newProfile.updated_at,
        v: getEpochSeconds()
      })
    }

    // Return existing profile
    return NextResponse.json({
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      updated_at: profile.updated_at,
      v: getEpochSeconds()
    })
  } catch (e: any) {
    console.error('[users/profile] unexpected error', e)
    return NextResponse.json({ 
      profile: null, 
      error: e?.message ?? 'unexpected' 
    })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'no-session' })
    }

    // Parse request body
    let body: { display_name?: string; avatar_url?: string } = {}
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'invalid-json' })
    }

    // Build update payload with only present fields
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (body.display_name !== undefined) {
      updatePayload.display_name = body.display_name
    }

    if (body.avatar_url !== undefined) {
      updatePayload.avatar_url = body.avatar_url
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', user.id)
      .select('id, display_name, avatar_url, updated_at')
      .single()

    if (updateError) {
      console.error('[users/profile] update error', updateError)
      return NextResponse.json({ error: updateError.message })
    }

    // Return updated profile with cache-busting v
    return NextResponse.json({
      id: updatedProfile.id,
      display_name: updatedProfile.display_name,
      avatar_url: updatedProfile.avatar_url,
      updated_at: updatedProfile.updated_at,
      v: getEpochSeconds()
    })
  } catch (e: any) {
    console.error('[users/profile] unexpected error', e)
    return NextResponse.json({ error: e?.message ?? 'unexpected' })
  }
}
