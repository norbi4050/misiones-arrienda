import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BUCKET = 'property-images'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchBucketImages(userId: string, propertyId: string, coverImagePath?: string): Promise<string[]> {
  try {
    const prefix = `${userId}/${propertyId}`
    const { data: files, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }, // 🔒 orden determinista
      })

    if (error || !files || files.length === 0) return []

    // solo imágenes soportadas
    const imgs = files
      .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f.name))
      .map(f => {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${prefix}/${f.name}`)
        return data.publicUrl
      })

    if (imgs.length === 0) return []

    // 💡 priorizar imagen de portada especificada o por patrón
    if (coverImagePath) {
      // Si se especificó una imagen de portada, buscarla y moverla al inicio
      const coverIdx = imgs.findIndex(url => url.includes(coverImagePath))
      if (coverIdx > 0) {
        const [cover] = imgs.splice(coverIdx, 1)
        imgs.unshift(cover)
      }
    } else {
      // Comportamiento original: buscar por patrón de nombre
      const coverIdx = imgs.findIndex(u => /(^|\/)(00-|cover|portada|principal)/i.test(u))
      if (coverIdx > 0) {
        const [cover] = imgs.splice(coverIdx, 1)
        imgs.unshift(cover)
      }
    }

    return imgs
  } catch {
    return []
  }
}
