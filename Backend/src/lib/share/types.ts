// =====================================================
// B5 - SHARE TYPES: TypeScript definitions
// =====================================================

/**
 * Canales de compartir disponibles
 */
export type ShareChannel = 
  | 'whatsapp'
  | 'telegram'
  | 'facebook'
  | 'x'
  | 'email'
  | 'copy'
  | 'direct';

/**
 * Tipo de entidad que se está compartiendo
 */
export type ShareEntityType = 'property' | 'agency';

/**
 * Contexto desde donde se comparte
 */
export type ShareContext = 'card' | 'detail' | 'profile';

/**
 * Parámetros UTM para tracking
 */
export interface UTMParams {
  utm_source: ShareChannel;
  utm_medium: 'share';
  utm_campaign: string; // property_{id} | agency_{id}
  utm_content: ShareContext;
  utm_term?: string;
}

/**
 * Configuración para construir una URL de compartir
 */
export interface ShareUrlConfig {
  entityType: ShareEntityType;
  entityId: string;
  context: ShareContext;
  channel: ShareChannel;
  customParams?: Record<string, string>;
}

/**
 * Resultado de construir una URL de compartir
 */
export interface ShareUrlResult {
  url: string;
  shortUrl?: string;
  utmParams: UTMParams;
}

/**
 * Datos de una entidad para compartir
 */
export interface ShareEntityData {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  city?: string;
  province?: string;
  imageUrl?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

/**
 * Configuración del mensaje de compartir
 */
export interface ShareMessageConfig {
  entity: ShareEntityData;
  channel: ShareChannel;
  url: string;
  locale?: string;
}

/**
 * Resultado de construir un mensaje de compartir
 */
export interface ShareMessageResult {
  subject?: string; // Para email
  body: string;
  url: string;
}

/**
 * Opciones para el helper de share
 */
export interface ShareHelperOptions {
  siteUrl?: string;
  fallbackUrl?: string;
  validateUrl?: boolean;
}
