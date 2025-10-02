// =====================================================
// B5 - SHARE MESSAGE: Optimized copy/caption builder
// =====================================================

import type { ShareEntityData, ShareChannel } from './types';
import { sanitizeShareText } from './index';

/**
 * Obtiene CTA apropiado según el canal
 */
function getCTAForChannel(channel: ShareChannel): string {
  switch (channel) {
    case 'whatsapp':
    case 'telegram':
      return 'Pedime más info por acá 👇';
    
    case 'facebook':
    case 'x':
      return 'Más información en el link 👇';
    
    case 'email':
      return 'Ver detalles completos:';
    
    case 'copy':
    case 'direct':
      return 'Más información:';
    
    default:
      return 'Más información:';
  }
}

/**
 * Trunca mensaje a longitud máxima, cortando en el último espacio
 */
function truncateMessage(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Recortar en el último espacio antes del límite
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // Si el último espacio está muy cerca del límite (>80%), cortar ahí
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  // Si no, cortar en el límite y agregar ellipsis
  return truncated + '...';
}

/**
 * Formatea precio con localización
 */
function formatPrice(price: number, currency: string = 'ARS', locale: string = 'es-AR'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  } catch (error) {
    // Fallback si falla Intl
    return `${currency} ${price.toLocaleString()}`;
  }
}

/**
 * Construye snippet automático para compartir
 */
export function buildShareMessage(
  entity: ShareEntityData,
  channel: ShareChannel,
  url: string,
  locale: string = 'es-AR'
): { subject?: string; body: string } {
  
  // 1. Título sanitizado
  const title = sanitizeShareText(entity.title || 'Propiedad en Misiones Arrienda');
  
  // 2. Construir snippet con detalles
  const snippetParts: string[] = [];
  
  // Precio
  if (entity.price) {
    const formattedPrice = formatPrice(entity.price, entity.currency || 'ARS', locale);
    snippetParts.push(`${formattedPrice}/mes`);
  }
  
  // Detalles de la propiedad
  const details: string[] = [];
  
  if (entity.bedrooms) {
    details.push(`${entity.bedrooms} dorm`);
  }
  
  if (entity.bathrooms) {
    details.push(`${entity.bathrooms} baños`);
  }
  
  if (entity.area) {
    details.push(`${entity.area}m²`);
  }
  
  if (details.length > 0) {
    snippetParts.push(details.join(', '));
  }
  
  // Ubicación
  if (entity.city) {
    let location = entity.city;
    if (entity.province) {
      location += `, ${entity.province}`;
    }
    snippetParts.push(location);
  }
  
  const snippet = snippetParts.join(' • ');
  
  // 3. CTA según canal
  const cta = getCTAForChannel(channel);
  
  // 4. Construir mensaje completo
  let body = title;
  
  if (snippet) {
    body += `\n\n${snippet}`;
  }
  
  if (cta) {
    body += `\n\n${cta}`;
  }
  
  // 5. Truncar a 180-220 caracteres (sin contar la URL que se agrega después)
  const truncatedBody = truncateMessage(body, 220);
  
  // 6. Subject para email
  const subject = channel === 'email'
    ? `Propiedad en Misiones: ${title.substring(0, 50)}`
    : undefined;
  
  return {
    subject,
    body: truncatedBody
  };
}

/**
 * Construye mensaje para inmobiliaria/agencia
 */
export function buildAgencyShareMessage(
  entity: ShareEntityData,
  channel: ShareChannel,
  url: string,
  locale: string = 'es-AR'
): { subject?: string; body: string } {
  
  const title = sanitizeShareText(entity.title || 'Inmobiliaria en Misiones');
  
  const snippetParts: string[] = [];
  
  // Descripción corta si existe
  if (entity.description) {
    const shortDesc = sanitizeShareText(entity.description).substring(0, 100);
    snippetParts.push(shortDesc);
  }
  
  // Ubicación
  if (entity.city) {
    let location = `Inmobiliaria en ${entity.city}`;
    if (entity.province) {
      location += `, ${entity.province}`;
    }
    snippetParts.push(location);
  }
  
  const snippet = snippetParts.join(' • ');
  
  const cta = channel === 'email' 
    ? 'Ver perfil completo:' 
    : 'Conocé más sobre nosotros 👇';
  
  let body = title;
  
  if (snippet) {
    body += `\n\n${snippet}`;
  }
  
  if (cta) {
    body += `\n\n${cta}`;
  }
  
  const truncatedBody = truncateMessage(body, 220);
  
  const subject = channel === 'email'
    ? `Inmobiliaria en Misiones: ${title.substring(0, 50)}`
    : undefined;
  
  return {
    subject,
    body: truncatedBody
  };
}

/**
 * Ejemplo de mensaje generado para WhatsApp:
 * 
 * Casa 3 dorm - Posadas
 * 
 * ARS 150.000/mes • 3 dorm, 2 baños, 120m² • Posadas, Misiones
 * 
 * Pedime más info por acá 👇
 */

/**
 * Ejemplo de mensaje generado para Email:
 * 
 * Subject: Propiedad en Misiones: Casa 3 dorm - Posadas
 * 
 * Body:
 * Casa 3 dorm - Posadas
 * 
 * ARS 150.000/mes • 3 dorm, 2 baños, 120m² • Posadas, Misiones
 * 
 * Ver detalles completos:
 */
