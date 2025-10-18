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

    // Obtener datos de user_profiles y users para construir avatar_url único
    // NOTA: user_profiles usa 'userId' como FK, no 'id'
    const [{ data: userData }, { data: profile }] = await Promise.all([
      supabase.from('users').select('id,name,profile_image,avatar,logo_url').eq('id', userId).maybeSingle(),
      supabase.from('user_profiles').select('avatar_url,updated_at').eq('userId', userId).maybeSingle(),
    ])

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const primaryUrl = profile?.avatar_url ?? null;
    const deprecatedUrl = userData?.profile_image ?? userData?.avatar ?? userData?.logo_url ?? null; // fallback temporal
    const displayName = userData?.name ?? 'User';

    const url =
      primaryUrl ??
      deprecatedUrl ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&size=200`;

    const v = primaryUrl && profile?.updated_at
      ? Math.floor(new Date(profile.updated_at).getTime() / 1000)
      : 0;

    // Devolver URL cruda sin ?v= - el frontend se encarga del cache-busting
    return NextResponse.json({
      url: url,  // URL cruda sin ?v=
      v: v,
      source: primaryUrl ? 'user_profiles.avatar_url' : (deprecatedUrl ? 'users_deprecated' : 'fallback'),
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

    // 6) FIX: Guardar avatar en ambas tablas para máxima compatibilidad
    // Esto maneja 3 casos:
    // - Inquilinos: tienen user_profiles ✅
    // - Inmobiliarias nuevas: NO tienen user_profiles, usan users.avatar ✅
    // - Inmobiliarias migradas: tienen user_profiles, actualizar ambas ✅

    // 6a) Intentar actualizar user_profiles.avatar_url (si existe)
    // NOTA: NO actualizar updated_at manualmente - esa columna no existe en Supabase REST API
    const { data: profileData, error: profileUpdateErr } = await supabaseAdmin
      .from('user_profiles')
      .update({ avatar_url: url })
      .eq('userId', user.id)
      .select()

    if (profileUpdateErr) {
      console.log(`[Avatar POST] user_profiles update: ${profileUpdateErr.message} (code: ${profileUpdateErr.code})`)
    } else {
      console.log(`[Avatar POST] user_profiles updated: ${profileData ? profileData.length : 0} rows`)
    }

    // 6b) SIEMPRE actualizar users.avatar como fallback
    // Esto garantiza que el avatar esté disponible para todos los usuarios
    const { data: userData, error: userUpdateErr } = await supabaseAdmin
      .from('users')
      .update({ avatar: url, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()

    if (userUpdateErr) {
      console.error('[Avatar POST] Error updating users.avatar:', userUpdateErr)
      console.error('[Avatar POST] CRITICAL: Failed to save avatar to database')
      // Si ambas tablas fallan, es un error crítico
      if (profileUpdateErr) {
        return NextResponse.json({
          error: 'failed to save avatar',
          details: userUpdateErr.message
        }, { status: 500 })
      }
    } else {
      console.log(`[Avatar POST] users.avatar updated: ${userData ? userData.length : 0} rows`)
    }

    console.log(`[Avatar POST] Final: user_profiles=${!profileUpdateErr}, users=${!userUpdateErr}`)

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

    // FIX: Remover avatar de AMBAS tablas para máxima compatibilidad
    const now = new Date()

    // Remover de user_profiles (si existe)
    const { error: profileRemoveError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: null,
        updated_at: now.toISOString()
      })
      .eq('userId', userId)

    // Remover de users.avatar
    const { data: userRemoveResult, error: userRemoveError } = await supabase
      .from('users')
      .update({
        avatar: null,
        updated_at: now.toISOString()
      })
      .eq('id', userId)
      .select('updated_at')
      .single()

    if (userRemoveError) {
      console.error('Error removing avatar from users:', userRemoveError)
      // No fallar si solo falla users, puede que user_profiles haya funcionado
    }

    console.log(`[Avatar DELETE] Removed from user_profiles: ${!profileRemoveError}, users: ${!userRemoveError}`)

    const updatedAtEpoch = userRemoveResult?.updated_at
      ? Math.floor(new Date(userRemoveResult.updated_at).getTime() / 1000)
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
