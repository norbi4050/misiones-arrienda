// =====================================================
// B5 - CANONICAL RESOLVER
// Resuelve URLs canónicas con cache en memoria
// =====================================================

import { getCanonicalUrl } from './index';
import type { ShareEntityType } from './types';

/**
 * Cache en memoria para URLs canónicas
 * TTL: 5 minutos
 */
interface CacheEntry {
  url: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos en ms

/**
 * Limpia entradas expiradas del cache
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

/**
 * Obtiene URL canónica de una propiedad con cache
 */
export async function getPropertyCanonicalUrl(propertyId: string): Promise<string> {
  const cacheKey = `property:${propertyId}`;
  
  // Verificar cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  // Generar URL canónica
  const url = getCanonicalUrl('property', propertyId);

  // Guardar en cache
  cache.set(cacheKey, {
    url,
    timestamp: Date.now(),
  });

  // Limpiar cache expirado (cada 100 requests)
  if (Math.random() < 0.01) {
    cleanExpiredCache();
  }

  return url;
}

/**
 * Obtiene URL canónica de una inmobiliaria con cache
 */
export async function getAgencyCanonicalUrl(agencyId: string): Promise<string> {
  const cacheKey = `agency:${agencyId}`;
  
  // Verificar cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  // Generar URL canónica
  const url = getCanonicalUrl('agency', agencyId);

  // Guardar en cache
  cache.set(cacheKey, {
    url,
    timestamp: Date.now(),
  });

  // Limpiar cache expirado
  if (Math.random() < 0.01) {
    cleanExpiredCache();
  }

  return url;
}

/**
 * Invalida cache de una entidad específica
 */
export function invalidateCanonicalCache(entityType: ShareEntityType, entityId: string): void {
  const cacheKey = `${entityType}:${entityId}`;
  cache.delete(cacheKey);
}

/**
 * Limpia todo el cache
 */
export function clearCanonicalCache(): void {
  cache.clear();
}

/**
 * Obtiene estadísticas del cache (para debugging)
 */
export function getCanonicalCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number }>;
} {
  const now = Date.now();
  const entries = Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    age: Math.floor((now - entry.timestamp) / 1000), // edad en segundos
  }));

  return {
    size: cache.size,
    entries,
  };
}

/**
 * Pre-carga URLs canónicas (útil para SSR)
 */
export async function preloadCanonicalUrls(
  entities: Array<{ type: ShareEntityType; id: string }>
): Promise<void> {
  const promises = entities.map(({ type, id }) => {
    if (type === 'property') {
      return getPropertyCanonicalUrl(id);
    } else {
      return getAgencyCanonicalUrl(id);
    }
  });

  await Promise.all(promises);
}

export default {
  getPropertyCanonicalUrl,
  getAgencyCanonicalUrl,
  invalidateCanonicalCache,
  clearCanonicalCache,
  getCanonicalCacheStats,
  preloadCanonicalUrls,
};
