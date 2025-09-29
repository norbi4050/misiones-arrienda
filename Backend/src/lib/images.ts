const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export function toPublicUrl(pathOrUrl: string): string {
  // Si ya es http(s), devolverlo
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  // Si viene como "property-images/uid/pid/file.jpg" o con prefijo/leading slash
  return `${SUPABASE_URL}/storage/v1/object/public/${String(pathOrUrl).replace(/^\/+/, '')}`
}

export function normalizeImages(images: unknown): string[] {
  try {
    if (Array.isArray(images)) return images.filter(Boolean).map(String)
    if (typeof images === 'string') {
      const arr = JSON.parse(images)
      return Array.isArray(arr) ? arr.filter(Boolean).map(String) : []
    }
    return []
  } catch {
    return []
  }
}
