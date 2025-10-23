// Force dynamic rendering for Vercel - v2
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

function getServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookies().get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try { cookies().set({ name, value, ...options }) } catch {}
        },
        remove: (name: string, options: CookieOptions) => {
          try { cookies().delete({ name, ...options }) } catch {}
        },
      },
    }
  )
}
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper para generar timestamp epoch
function getTimestampEpoch(): number {
  return Math.floor(Date.now() / 1000)
}

export async function GET(request: NextRequest) {
  try {
    // Usar SERVICE ROLE para bypass RLS - los avatares son públicos
    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Obtener userId del query params (público)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no especificado' }, { status: 400 })
    }

    // Obtener datos de User table (note: table name is capitalized in Supabase)
    const { data: userData } = await supabase
      .from('User')
      .select('id,name,avatar,updatedAt')
      .eq('id', userId)
      .maybeSingle()

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const displayName = userData.name ?? 'User';
    const avatarUrl = userData.avatar ?? null;

    const url = avatarUrl ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&size=200`;

    // Calculate version using updatedAt timestamp
    const v = userData.updatedAt
      ? Math.floor(new Date(userData.updatedAt).getTime() / 1000)
      : 0;

    // Devolver URL cruda sin ?v= - el frontend se encarga del cache-busting
    return NextResponse.json({
      url: url,  // URL cruda sin ?v=
      v: v,
      source: avatarUrl ? 'User.avatar' : 'fallback',
      user_id: userId,
      full_name: displayName
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    })

  } catch (error) {
    console.error('Error in avatar GET:', error)
    return NextResponse.json({ error: 'NO_AVATAR' }, { status: 404 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServerClient()

    // 1) Autenticación por cookies (SSR)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // 2) Archivo
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

    const ext = (file.type?.split('/')?.[1] || 'jpg').toLowerCase()
    const path = `${user.id}/avatar.${ext}`

    // 3) Subir a Storage (bucket: avatars)
    const { error: upErr } = await supabase
      .storage.from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' })

    if (upErr) {
      console.error('upload error:', upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    // 4) URL pública
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = pub.publicUrl
    const v = Math.floor(Date.now() / 1000)

    // 5) FIX CRÍTICO: Usar service role client para bypassear RLS
    // Crear cliente con service role key para actualizaciones de DB
    if (!supabaseServiceKey) {
      console.error('[Avatar POST] CRITICAL: SUPABASE_SERVICE_ROLE_KEY no está definida')
      return NextResponse.json({ error: 'server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey)

    console.log(`[Avatar POST] Guardando avatar para user ${user.id}: ${url}`)

    // Update User table with new avatar
    const { data: userData, error: userUpdateErr } = await supabaseAdmin
      .from('User')
      .update({ avatar: url, updatedAt: new Date().toISOString() })
      .eq('id', user.id)
      .select()

    if (userUpdateErr) {
      console.error('[Avatar POST] Error updating User.avatar:', userUpdateErr)
      return NextResponse.json({
        error: 'failed to save avatar',
        details: userUpdateErr.message
      }, { status: 500 })
    }

    console.log(`[Avatar POST] User.avatar updated: ${userData ? userData.length : 0} rows`)

    return NextResponse.json({ url: `${url}?v=${v}`, v, success: true })
  } catch (e) {
    console.error('avatar POST error:', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener userId del header de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')

    const now = new Date()

    // Remove avatar from User table
    const { data: userRemoveResult, error: userRemoveError } = await supabase
      .from('User')
      .update({
        avatar: null,
        updatedAt: now.toISOString()
      })
      .eq('id', userId)
      .select('updatedAt')
      .single()

    if (userRemoveError) {
      console.error('[Avatar DELETE] Error removing avatar from User:', userRemoveError)
      return NextResponse.json({ error: userRemoveError.message }, { status: 500 })
    }

    const updatedAtEpoch = userRemoveResult?.updatedAt
      ? Math.floor(new Date(userRemoveResult.updatedAt).getTime() / 1000)
      : Math.floor(now.getTime() / 1000)

    return NextResponse.json({
      url: null,
      v: updatedAtEpoch,
      user_id: userId,
      success: true
    })

  } catch (error) {
    console.error('Error in avatar DELETE:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
