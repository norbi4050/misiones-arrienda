/**
 * Configuración centralizada de la oferta fundadores
 *
 * INSTRUCCIONES:
 * - Cambiar `isActive` a false cuando se agoten los lugares o finalice la promo
 * - Actualizar `spotsTaken` manualmente cuando se sume un fundador
 * - `endDate` es opcional, sirve para poner fecha límite
 */

export const FOUNDER_OFFER_CONFIG = {
  // ⚠️ CAMBIAR A false PARA DESACTIVAR LA OFERTA EN TODA LA PLATAFORMA
  isActive: true,

  // Lugares disponibles
  spotsTotal: 15,
  spotsTaken: 3, // ⬆️ ACTUALIZAR MANUALMENTE cuando se sumen fundadores

  // Fecha límite (opcional)
  endDate: '2025-03-31', // YYYY-MM-DD

  // Beneficios
  freeMonths: 12,
  discountPercent: 50,

  // Valor del plan Profesional mensual
  professionalPlanPrice: 27500
} as const

// Función helper para obtener lugares restantes
export function getFounderSpotsRemaining(): number {
  return FOUNDER_OFFER_CONFIG.spotsTotal - FOUNDER_OFFER_CONFIG.spotsTaken
}

// Función helper para verificar si la oferta sigue activa
export function isFounderOfferActive(): boolean {
  if (!FOUNDER_OFFER_CONFIG.isActive) return false

  // Verificar si quedan lugares
  if (getFounderSpotsRemaining() <= 0) return false

  // Verificar fecha límite si existe
  if (FOUNDER_OFFER_CONFIG.endDate) {
    const endDate = new Date(FOUNDER_OFFER_CONFIG.endDate)
    const now = new Date()
    if (now > endDate) return false
  }

  return true
}

// Calcular valor total de la oferta
export function getFounderOfferTotalValue(): number {
  return FOUNDER_OFFER_CONFIG.professionalPlanPrice * FOUNDER_OFFER_CONFIG.freeMonths
}
