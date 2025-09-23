/**
 * 🖼️ HELPER UNIFICADO PARA URLs PÚBLICAS DE COMMUNITY-IMAGES
 * 
 * Bucket único para todas las imágenes de comunidad (roommates, etc.)
 * Sin signed URLs - solo URLs públicas directas
 */

export const COMMUNITY_PUBLIC_BASE = 
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/community-images/`;

export const keyToPublicUrl = (k: string | null | undefined): string | null => {
  if (!k) return null;
  return k.startsWith('http') ? k : `${COMMUNITY_PUBLIC_BASE}${k}`;
};

export const keysToPublicUrls = (keys: string[] = []): string[] => {
  return keys.map(keyToPublicUrl).filter(Boolean) as string[];
};
