'use client';

/**
 * Helpers puros para imágenes de propiedades (CLIENT-ONLY)
 * Sin dependencias de Supabase server
 */

/**
 * Validar si una URL de imagen es válida
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Verificar que sea una URL válida
  try {
    new URL(url);
    return true;
  } catch {
    // Si no es URL absoluta, verificar que sea path relativo válido
    return url.startsWith('/') && url.length > 1;
  }
}

/**
 * Obtener placeholder por tipo de propiedad
 */
export function getPlaceholderImage(propertyType?: string): string {
  switch (propertyType?.toLowerCase()) {
    case 'house':
    case 'casa':
      return '/placeholder-house-1.jpg';
    case 'apartment':
    case 'departamento':
      return '/placeholder-apartment-1.jpg';
    default:
      return '/placeholder-apartment-1.jpg';
  }
}

/**
 * Filtrar URLs válidas de una lista
 */
export function filterValidImageUrls(urls: (string | null | undefined)[]): string[] {
  return urls
    .filter((url): url is string => Boolean(url))
    .filter(isValidImageUrl);
}

/**
 * Obtener la primera imagen válida o placeholder
 */
export function getFirstValidImage(
  images: (string | null | undefined)[], 
  fallback?: string
): string {
  const validImages = filterValidImageUrls(images);
  return validImages[0] || fallback || '/placeholder-apartment-1.jpg';
}
