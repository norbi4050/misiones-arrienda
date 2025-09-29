import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    // Bloquear en producción
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Verificar variables de entorno requeridas
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DEV_SMOKETEST_SECRET',
    ] as const
    
    for (const k of required) {
      if (!process.env[k]) {
        return NextResponse.json({ 
          success: false, 
          step: 'env', 
          error: `Missing env var ${k}` 
        }, { status: 500 })
      }
    }

    // Obtener parámetros de query
    const url = new URL(req.url)
    const userId = url.searchParams.get('user')
    const secret = url.searchParams.get('secret')

    // Validar secret
    if (!secret || secret !== process.env.DEV_SMOKETEST_SECRET) {
      return NextResponse.json({ 
        success: false, 
        step: 'env', 
        error: 'Invalid secret' 
      }, { status: 403 })
    }

    // Validar userId
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        step: 'env', 
        error: 'Missing user' 
      }, { status: 400 })
    }

    // Generar PNG 1x1 en memoria (base64 decoded)
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
      'base64'
    )
    
    const ts = Date.now()
    const path = `${userId}/avatar-smoketest-${ts}.png`

    // 1) Upload al bucket avatars usando service_role
    const uploadResult = await supabaseAdmin.storage
      .from('avatars')
      .upload(path, png1x1, { 
        contentType: 'image/png', 
        upsert: true 
      })

    if (uploadResult.error) {
      return NextResponse.json({ 
        success: false, 
        step: 'upload', 
        error: uploadResult.error.message 
      }, { status: 500 })
    }

    // 2) Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(path)
    
    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      return NextResponse.json({ 
        success: false, 
        step: 'getPublicUrl', 
        error: 'No public URL generated' 
      }, { status: 500 })
    }

    // 3) Garantizar que existe una fila en user_profiles
    const existingProfile = await supabaseAdmin
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    // Si no existe, crear fila con defaults
    if (!existingProfile.data) {
      const insertResult = await supabaseAdmin
        .from('user_profiles')
        .insert({ 
          user_id: userId, 
          role: 'BUSCO', 
          photos: [] 
        })
      
      // Ignorar errores de "ya existe" (race condition)
      if (insertResult.error && !insertResult.error.message.includes('duplicate')) {
        return NextResponse.json({ 
          success: false, 
          step: 'insert', 
          error: insertResult.error.message 
        }, { status: 500 })
      }
    }

    // 4) Actualizar photos - SIN .single() para evitar errores
    const updateResult = await supabaseAdmin
      .from('user_profiles')
      .update({ photos: [publicUrl] })
      .eq('user_id', userId)
      .select('updated_at')  // SIN .single()

    if (updateResult.error) {
      return NextResponse.json({ 
        success: false, 
        step: 'update', 
        error: updateResult.error.message 
      }, { status: 500 })
    }

    const rows = updateResult.data || []
    
    // Si no devolvió filas, hacer SELECT aparte como fallback
    if (rows.length === 0) {
      const selectResult = await supabaseAdmin
        .from('user_profiles')
        .select('updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (selectResult.error || !selectResult.data?.length) {
        return NextResponse.json({ 
          success: false, 
          step: 'update', 
          error: selectResult.error?.message || 'no rows found' 
        }, { status: 500 })
      }

      const v = Math.floor(new Date(selectResult.data[0].updated_at).getTime() / 1000)
      return NextResponse.json({
        success: true,
        user_id: userId,
        url: publicUrl,
        v: v
      })
    }

    // Si devolvió 1 o más filas, tomar la primera
    const latest = rows[0]
    const v = Math.floor(new Date(latest.updated_at).getTime() / 1000)

    return NextResponse.json({
      success: true,
      user_id: userId,
      url: publicUrl,
      v: v
    })

  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      step: 'unknown', 
      error: err?.message || 'Unknown error' 
    }, { status: 500 })
  }
}
