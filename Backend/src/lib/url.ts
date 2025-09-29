/**
 * Helper para agregar versioning a URLs evitando duplicación de parámetros ?v=
 */
export function withVersion(rawUrl: string, v?: number | null): string {
  if (!rawUrl) return ''
  if (!v || v <= 0) return rawUrl
  
  try {
    const u = new URL(rawUrl)
    u.searchParams.set('v', String(v)) // sustituye si ya existe
    return u.toString()
  } catch {
    // si es ruta relativa o URL malformada
    return rawUrl + (rawUrl.includes('?') ? '&' : '?') + `v=${v}`
  }
}
