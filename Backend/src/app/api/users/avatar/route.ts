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
    const supabase = getServerClient()
    
    // Obtener userId del query params (público)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no especificado' }, { status: 400 })
    }

    // Obtener datos de user_profiles y users para construir avatar_url único
    const [{ data: userData }, { data: profile }] = await Promise.all([
      supabase.from('users').select('id,name,profile_image').eq('id', userId).maybeSingle(),
      supabase.from('user_profiles').select('photos,updated_at').eq('user_id', userId).maybeSingle(),
    ])

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const primaryUrl = profile?.photos?.[0] ?? null;
    const deprecatedUrl = userData?.profile_image ?? null; // fallback temporal
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
      source: primaryUrl ? 'photos' : (deprecatedUrl ? 'profile_image_deprecated' : 'fallback'),
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

    // 5) Guardar en user_profiles (¡usar user_id!)
    const { error: updErr } = await supabase
      .from('user_profiles')
      .update({ photos: [url], updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    // Si no existe la fila aún, upsert rápido
    if (updErr?.code === 'PGRST116' /* 0 rows */ || updErr == null) {
      await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, photos: [url], updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    }

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

    // Remover avatar poniendo array vacío
    const now = new Date()
    const { data: removeResult, error: removeError } = await supabase
      .from('user_profiles')
      .update({ 
        photos: [],  // Array vacío para remover avatar
        updated_at: now.toISOString()
      })
      .eq('id', userId)
      .select('updated_at')
      .single()

    if (removeError) {
      console.error('Error removing avatar:', removeError)
      return NextResponse.json({ error: 'Error al eliminar avatar' }, { status: 500 })
    }

    const updatedAtEpoch = removeResult?.updated_at 
      ? Math.floor(new Date(removeResult.updated_at).getTime() / 1000)
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
