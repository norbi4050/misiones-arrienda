/**
 * Configuración centralizada de URLs y entornos
 */

/**
 * Obtiene la URL base del sitio
 * Prioridad:
 * 1. NEXT_PUBLIC_SITE_URL (variable preferida)
 * 2. NEXT_PUBLIC_BASE_URL (fallback)
 * 3. VERCEL_URL (en despliegues de Vercel)
 * 4. localhost:3000 (desarrollo local)
 */
export function getSiteUrl(): string {
  // 1. Intentar NEXT_PUBLIC_SITE_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // 2. Intentar NEXT_PUBLIC_BASE_URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // 3. Si estamos en Vercel, usar VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 4. Fallback a localhost en desarrollo
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // 5. En producción sin variables configuradas, lanzar error para detectar el problema
  console.error('[Config] ⚠️ CRÍTICO: No se encontró ninguna variable de entorno para SITE_URL en producción');
  console.error('[Config] Disponibles:', {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    NODE_ENV: process.env.NODE_ENV
  });

  // Retornar localhost como último recurso, pero loguear el error
  return 'http://localhost:3000';
}

/**
 * Obtiene la URL de la API
 */
export function getApiUrl(): string {
  const siteUrl = getSiteUrl();
  return `${siteUrl}/api`;
}

/**
 * Verifica si estamos en producción
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Verifica si estamos en desarrollo
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
