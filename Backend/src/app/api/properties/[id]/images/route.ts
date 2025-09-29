import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Validación de MIME types permitidos
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Tipo de archivo no permitido: ${file.type}. Solo se permiten: ${ALLOWED_MIME_TYPES.join(', ')}` }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Archivo muy grande: ${Math.round(file.size / 1024 / 1024)}MB. Máximo permitido: 2MB` }
  }
  
  return { valid: true }
}

function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  return `${timestamp}-${random}.${ext}`
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Verificar ownership
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .select('id,user_id,updated_at')
      .eq('id', params.id)
      .maybeSingle()

    if (propErr) return NextResponse.json({ error: propErr.message }, { status: 500 })
    if (!property || property.user_id !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    // Listar archivos del bucket
    const { data: files, error: listErr } = await supabase
      .storage
      .from('property-images')
      .list(`${user.id}/${params.id}`, {
        limit: 20,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

    // Generar URLs públicas con cache-busting
    const v = Math.floor(new Date(property.updated_at).getTime() / 1000)
    const images = (files || []).map(file => {
      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(`${user.id}/${params.id}/${file.name}`)
      return `${data.publicUrl}?v=${v}`
    })

    return NextResponse.json({ images, version: v })
  } catch (error) {
    console.error('Error in GET /api/properties/[id]/images:', error)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Verificar ownership
    const { data: property, error: findErr } = await supabase
      .from('properties')
      .select('id,user_id')
      .eq('id', params.id)
      .maybeSingle()

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })
    if (!property || property.user_id !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const form = await req.formData()
    const files = form.getAll('files') as File[]
    if (!files?.length) return NextResponse.json({ error: 'no files provided' }, { status: 400 })

    const uploadedUrls: string[] = []
    const errors: string[] = []

    // Procesar cada archivo
    for (const file of files) {
      const validation = validateFile(file)
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`)
        continue
      }

      const fileName = generateUniqueFileName(file.name)
      const path = `${user.id}/${params.id}/${fileName}`

      const { error: upErr } = await supabase
        .storage
        .from('property-images')
        .upload(path, file, { 
          cacheControl: '3600', 
          upsert: false // No sobrescribir archivos existentes
        })

      if (upErr) {
        errors.push(`${file.name}: ${upErr.message}`)
        continue
      }

      const { data: pub } = supabase.storage
        .from('property-images')
        .getPublicUrl(path)
      
      uploadedUrls.push(pub.publicUrl)
    }

    // Actualizar updated_at para cache-busting
    const now = new Date().toISOString()
    const { error: updateErr } = await supabase
      .from('properties')
      .update({ updated_at: now })
      .eq('id', params.id)

    if (updateErr) {
      console.error('Error updating property timestamp:', updateErr)
    }

    const v = Math.floor(new Date(now).getTime() / 1000)
    const imagesWithVersion = uploadedUrls.map(url => `${url}?v=${v}`)

    return NextResponse.json({ 
      images: imagesWithVersion,
      uploaded: uploadedUrls.length,
      errors: errors.length > 0 ? errors : undefined,
      version: v
    })

  } catch (error) {
    console.error('Error in POST /api/properties/[id]/images:', error)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { key } = await req.json()
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

    // Verificar ownership
    const { data: property, error: findErr } = await supabase
      .from('properties')
      .select('id,user_id')
      .eq('id', params.id)
      .maybeSingle()

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })
    if (!property || property.user_id !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    // Validar que el key pertenece al usuario/propiedad
    const expectedPrefix = `${user.id}/${params.id}/`
    if (!key.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: 'invalid key' }, { status: 400 })
    }

    // Eliminar archivo del storage
    const { error: delErr } = await supabase
      .storage
      .from('property-images')
      .remove([key])

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    // Actualizar updated_at para cache-busting
    const now = new Date().toISOString()
    const { error: updateErr } = await supabase
      .from('properties')
      .update({ updated_at: now })
      .eq('id', params.id)

    if (updateErr) {
      console.error('Error updating property timestamp:', updateErr)
    }

    const v = Math.floor(new Date(now).getTime() / 1000)

    return NextResponse.json({ 
      success: true, 
      deleted: key,
      version: v
    })

  } catch (error) {
    console.error('Error in DELETE /api/properties/[id]/images:', error)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
