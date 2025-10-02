// =====================================================
// B5 - SHARE HELPER: Main share functionality
// =====================================================

import type {
  ShareChannel,
  ShareEntityType,
  ShareContext,
  UTMParams,
  ShareUrlConfig,
  ShareUrlResult,
  ShareHelperOptions,
} from './types';

/**
 * Feature flag para habilitar/deshabilitar compartir
 */
const FEATURE_SHARE = process.env.NEXT_PUBLIC_FEATURE_SHARE === 'true' || process.env.FEATURE_SHARE === 'true';

/**
 * URL base del sitio
 */
const getSiteUrl = (options?: ShareHelperOptions): string => {
  // 1. Intentar desde options
  if (options?.siteUrl) {
    return options.siteUrl;
  }

  // 2. Intentar desde env vars
  const envUrl = 
    process.env.NEXT_PUBLIC_SITE_URL || 
    process.env.NEXT_PUBLIC_BASE_URL || 
    process.env.NEXT_PUBLIC_APP_URL;

  if (envUrl) {
    return envUrl;
  }

  // 3. Fallback a localhost con warning
  const fallback = options?.fallbackUrl || 'http://localhost:3000';
  
  if (typeof window === 'undefined') {
    // Server-side
    console.warn(
      '[Share Helper] NEXT_PUBLIC_SITE_URL no está configurado. Usando fallback:',
      fallback
    );
  }

  return fallback;
};

/**
 * Construye parámetros UTM para tracking
 */
export function buildUTMParams(config: ShareUrlConfig): UTMParams {
  const { entityType, entityId, context, channel } = config;

  // Construir campaign según tipo de entidad
  const campaign = entityType === 'property' 
    ? `property_${entityId}`
    : `agency_${entityId}`;

  return {
    utm_source: channel,
    utm_medium: 'share',
    utm_campaign: campaign,
    utm_content: context,
  };
}

/**
 * Convierte parámetros UTM a query string
 */
export function utmParamsToQueryString(params: UTMParams): string {
  const entries = Object.entries(params).filter(([_, value]) => value !== undefined);
  return new URLSearchParams(entries as [string, string][]).toString();
}

/**
 * Construye la URL canónica de una entidad
 */
export function getCanonicalUrl(
  entityType: ShareEntityType,
  entityId: string,
  options?: ShareHelperOptions
): string {
  const baseUrl = getSiteUrl(options);
  
  // Remover trailing slash
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // Construir path según tipo
  const path = entityType === 'property'
    ? `/properties/${entityId}`
    : `/inmobiliaria/${entityId}`;

  return `${cleanBaseUrl}${path}`;
}

/**
 * Construye una URL completa para compartir con UTM params
 */
export function buildShareUrl(config: ShareUrlConfig, options?: ShareHelperOptions): ShareUrlResult {
  const { entityType, entityId, customParams } = config;

  // 1. Obtener URL canónica
  const canonicalUrl = getCanonicalUrl(entityType, entityId, options);

  // 2. Construir UTM params
  const utmParams = buildUTMParams(config);

  // 3. Combinar con custom params si existen
  const allParams = {
    ...utmParams,
    ...customParams,
  };

  // 4. Construir query string
  const queryString = utmParamsToQueryString(allParams);

  // 5. URL final
  const url = `${canonicalUrl}?${queryString}`;

  // 6. Validar URL si está habilitado
  if (options?.validateUrl) {
    try {
      new URL(url);
    } catch (error) {
      console.error('[Share Helper] URL inválida generada:', url, error);
      throw new Error(`URL inválida: ${url}`);
    }
  }

  return {
    url,
    utmParams,
  };
}

/**
 * Sanitiza texto para compartir (remueve HTML, caracteres especiales)
 */
export function sanitizeShareText(text: string): string {
  if (!text) return '';

  return text
    // Remover HTML tags
    .replace(/<[^>]*>/g, '')
    // Remover múltiples espacios
    .replace(/\s+/g, ' ')
    // Remover caracteres especiales problemáticos
    .replace(/[<>{}[\]]/g, '')
    // Trim
    .trim();
}

/**
 * Normaliza título para compartir (recorta si es muy largo)
 */
export function normalizeShareTitle(title: string, maxLength: number = 100): string {
  const sanitized = sanitizeShareText(title);
  
  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  // Recortar y agregar ellipsis
  return sanitized.substring(0, maxLength - 3) + '...';
}

/**
 * Normaliza descripción para compartir
 */
export function normalizeShareDescription(description: string, maxLength: number = 200): string {
  const sanitized = sanitizeShareText(description);
  
  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  // Recortar en el último espacio antes del límite
  const truncated = sanitized.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Verifica si la feature de compartir está habilitada
 */
export function isShareFeatureEnabled(): boolean {
  return FEATURE_SHARE;
}

/**
 * Log de advertencia si la feature está deshabilitada
 */
export function warnIfShareDisabled(): void {
  if (!FEATURE_SHARE && typeof window === 'undefined') {
    console.warn(
      '[Share Helper] FEATURE_SHARE está deshabilitado. ' +
      'Configura FEATURE_SHARE=true en .env para habilitar compartir.'
    );
  }
}

/**
 * Construye deeplink para WhatsApp
 */
export function buildWhatsAppLink(text: string, url: string): string {
  const message = `${text}\n\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Construye deeplink para Telegram
 */
export function buildTelegramLink(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * Construye deeplink para Facebook
 */
export function buildFacebookLink(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/**
 * Construye deeplink para X/Twitter
 */
export function buildTwitterLink(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * Construye mailto link para Email
 */
export function buildEmailLink(subject: string, body: string, url: string): string {
  const fullBody = `${body}\n\n${url}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
}

/**
 * Obtiene el deeplink correcto según el canal
 */
export function getDeepLink(
  channel: ShareChannel,
  text: string,
  url: string,
  subject?: string
): string {
  switch (channel) {
    case 'whatsapp':
      return buildWhatsAppLink(text, url);
    
    case 'telegram':
      return buildTelegramLink(text, url);
    
    case 'facebook':
      return buildFacebookLink(url);
    
    case 'x':
      return buildTwitterLink(text, url);
    
    case 'email':
      return buildEmailLink(subject || 'Propiedad en Misiones Arrienda', text, url);
    
    case 'copy':
    case 'direct':
      return url;
    
    default:
      return url;
  }
}

/**
 * Exportar todo como default también
 */
export default {
  buildUTMParams,
  utmParamsToQueryString,
  getCanonicalUrl,
  buildShareUrl,
  sanitizeShareText,
  normalizeShareTitle,
  normalizeShareDescription,
  isShareFeatureEnabled,
  warnIfShareDisabled,
  buildWhatsAppLink,
  buildTelegramLink,
  buildFacebookLink,
  buildTwitterLink,
  buildEmailLink,
  getDeepLink,
};
