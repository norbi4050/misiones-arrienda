/**
 * 🖼️ HELPER PARA URLs PÚBLICAS DE ROOMMATES
 * 
 * Sistema para generar URLs públicas desde bucket roommate-images
 * Sin placeholders - solo URLs reales o null
 */

export function getPublicRoommateUrl(key: string | null | undefined): string | null {
  if (!key) return null
  
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${base}/storage/v1/object/public/${key}`  // key ya viene con 'roommate-images/...'
}

export function keysToPublicUrls(keys: string[] | null | undefined): string[] {
  return (keys ?? [])
    .map(k => k.startsWith('http') ? k : getPublicRoommateUrl(k))
    .filter(Boolean) as string[]
}
