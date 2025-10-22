/**
 * Helper para normalizar URLs de redes sociales
 * Convierte nombres de usuario o URLs parciales en URLs completas y válidas
 */

/**
 * Normaliza una URL de Facebook
 * @param input - Puede ser: @usuario, usuario, https://facebook.com/usuario, etc.
 * @returns URL completa de Facebook o null si el input está vacío
 */
export function normalizeFacebookUrl(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return null;

  const cleaned = input.trim();

  // Si ya es una URL completa y válida de Facebook, devolverla
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      const url = new URL(cleaned);
      if (url.hostname.includes('facebook.com') || url.hostname.includes('fb.com')) {
        return cleaned;
      }
    } catch {
      // Si no es una URL válida, continuar con el procesamiento
    }
  }

  // Remover @ si existe
  const username = cleaned.replace(/^@/, '');

  // Si está vacío después de limpiar, retornar null
  if (!username) return null;

  // Construir URL completa
  return `https://facebook.com/${username}`;
}

/**
 * Normaliza una URL de Instagram
 * @param input - Puede ser: @usuario, usuario, https://instagram.com/usuario, etc.
 * @returns URL completa de Instagram o null si el input está vacío
 */
export function normalizeInstagramUrl(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return null;

  const cleaned = input.trim();

  // Si ya es una URL completa y válida de Instagram, devolverla
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      const url = new URL(cleaned);
      if (url.hostname.includes('instagram.com')) {
        return cleaned;
      }
    } catch {
      // Si no es una URL válida, continuar con el procesamiento
    }
  }

  // Remover @ si existe
  const username = cleaned.replace(/^@/, '');

  // Si está vacío después de limpiar, retornar null
  if (!username) return null;

  // Construir URL completa
  return `https://instagram.com/${username}`;
}

/**
 * Normaliza una URL de TikTok
 * @param input - Puede ser: @usuario, usuario, https://tiktok.com/@usuario, etc.
 * @returns URL completa de TikTok o null si el input está vacío
 */
export function normalizeTikTokUrl(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return null;

  const cleaned = input.trim();

  // Si ya es una URL completa y válida de TikTok, devolverla
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      const url = new URL(cleaned);
      if (url.hostname.includes('tiktok.com')) {
        return cleaned;
      }
    } catch {
      // Si no es una URL válida, continuar con el procesamiento
    }
  }

  // Remover @ si existe
  const username = cleaned.replace(/^@/, '');

  // Si está vacío después de limpiar, retornar null
  if (!username) return null;

  // TikTok usa @ en las URLs, así que lo agregamos de vuelta
  return `https://tiktok.com/@${username}`;
}
