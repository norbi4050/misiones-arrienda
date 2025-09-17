/**
 * 🚫 SISTEMA DE LÍMITES POR TIPO DE USUARIO (VERSIÓN SIMPLIFICADA)
 *
 * Controla las limitaciones según el plan técnico:
 * - Usuario Básico (Comunidad): 1 perfil gratis, ilimitados pagos
 * - Propietario Directo: 3 propiedades gratis, 10 con pago
 * - Inmobiliaria: según plan de suscripción
 */

import { prisma } from './prisma';

export interface UserLimits {
  userType: 'inquilino' | 'dueno_directo' | 'inmobiliaria';
  maxFreeProperties: number;
  maxPaidProperties: number;
  maxFreeProfiles: number;
  maxPaidProfiles: number;
  canHighlight: boolean;
  highlightPrice: number;
}

export class UserLimitsManager {

  /**
   * Obtiene los límites según el tipo de usuario
   */
  static getUserLimits(userType: string, subscriptionType?: string): UserLimits {
    switch (userType) {
      case 'inquilino': // Usuario Básico (Comunidad)
        return {
          userType: 'inquilino',
          maxFreeProperties: 0, // No puede publicar propiedades
          maxPaidProperties: 0,
          maxFreeProfiles: 1, // 1 perfil gratis
          maxPaidProfiles: -1, // Ilimitados con pago
          canHighlight: true,
          highlightPrice: 3000 // AR$3.000
        };

      case 'dueno_directo': // Propietario Directo
        return {
          userType: 'dueno_directo',
          maxFreeProperties: 3, // 3 propiedades gratis
          maxPaidProperties: 10, // 10 con pago de AR$10.000
          maxFreeProfiles: 0, // No puede usar comunidad gratis
          maxPaidProfiles: 1, // 1 perfil con pago
          canHighlight: true,
          highlightPrice: 7000 // AR$7.000
        };

      case 'inmobiliaria': // Usuario Profesional
        if (subscriptionType === 'premium') {
          return {
            userType: 'inmobiliaria',
            maxFreeProperties: 0,
            maxPaidProperties: -1, // Ilimitadas
            maxFreeProfiles: 0,
            maxPaidProfiles: -1, // Ilimitados
            canHighlight: true,
            highlightPrice: 7000 // AR$7.000
          };
        } else {
          // Plan básico
          return {
            userType: 'inmobiliaria',
            maxFreeProperties: 0,
            maxPaidProperties: 10, // 10 propiedades
            maxFreeProfiles: 0,
            maxPaidProfiles: 5, // 5 perfiles
            canHighlight: true,
            highlightPrice: 7000 // AR$7.000
          };
        }

      default:
        // Usuario sin tipo definido - límites mínimos
        return {
          userType: 'inquilino',
          maxFreeProperties: 0,
          maxPaidProperties: 0,
          maxFreeProfiles: 1,
          maxPaidProfiles: 1,
          canHighlight: false,
          highlightPrice: 0
        };
    }
  }

  /**
   * Verifica si un usuario puede publicar una propiedad
   */
  static async canPublishProperty(userId: string): Promise<{
    canPublish: boolean;
    reason?: string;
    requiresPayment: boolean;
    currentCount: number;
    maxAllowed: number;
  }> {
    try {
      // Obtener usuario básico
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          canPublish: false,
          reason: 'Usuario no encontrado',
          requiresPayment: false,
          currentCount: 0,
          maxAllowed: 0
        };
      }

      // Contar propiedades activas del usuario
      const currentCount = await prisma.property.count({
        where: {
          userId,
          status: {
            not: 'EXPIRED'
          }
        }
      });

      const limits = this.getUserLimits(user.userType || 'inquilino');

      // Verificar si puede publicar gratis
      if (currentCount < limits.maxFreeProperties) {
        return {
          canPublish: true,
          requiresPayment: false,
          currentCount,
          maxAllowed: limits.maxFreeProperties
        };
      }

      // Verificar si puede publicar con pago
      if (limits.maxPaidProperties === -1 || currentCount < limits.maxPaidProperties) {
        return {
          canPublish: true,
          requiresPayment: true,
          currentCount,
          maxAllowed: limits.maxPaidProperties
        };
      }

      // Ha alcanzado el límite máximo
      return {
        canPublish: false,
        reason: `Has alcanzado el límite máximo de ${limits.maxPaidProperties} propiedades`,
        requiresPayment: false,
        currentCount,
        maxAllowed: limits.maxPaidProperties
      };

    } catch (error) {
      console.error('Error checking property limits:', error);
      return {
        canPublish: false,
        reason: 'Error al verificar límites',
        requiresPayment: false,
        currentCount: 0,
        maxAllowed: 0
      };
    }
  }

  /**
   * Verifica si un usuario puede crear un perfil de comunidad
   */
  static async canCreateCommunityProfile(userId: string): Promise<{
    canCreate: boolean;
    reason?: string;
    requiresPayment: boolean;
    currentCount: number;
    maxAllowed: number;
  }> {
    try {
      // Obtener usuario básico
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          canCreate: false,
          reason: 'Usuario no encontrado',
          requiresPayment: false,
          currentCount: 0,
          maxAllowed: 0
        };
      }

      // Verificar si ya tiene un perfil de comunidad
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      const currentCount = existingProfile ? 1 : 0;
      const limits = this.getUserLimits(user.userType || 'inquilino');

      // Verificar si puede crear gratis
      if (currentCount < limits.maxFreeProfiles) {
        return {
          canCreate: true,
          requiresPayment: false,
          currentCount,
          maxAllowed: limits.maxFreeProfiles
        };
      }

      // Verificar si puede crear con pago
      if (limits.maxPaidProfiles === -1 || currentCount < limits.maxPaidProfiles) {
        return {
          canCreate: true,
          requiresPayment: true,
          currentCount,
          maxAllowed: limits.maxPaidProfiles
        };
      }

      // Ha alcanzado el límite máximo
      return {
        canCreate: false,
        reason: `Has alcanzado el límite máximo de perfiles`,
        requiresPayment: false,
        currentCount,
        maxAllowed: limits.maxPaidProfiles
      };

    } catch (error) {
      console.error('Error checking profile limits:', error);
      return {
        canCreate: false,
        reason: 'Error al verificar límites',
        requiresPayment: false,
        currentCount: 0,
        maxAllowed: 0
      };
    }
  }

  /**
   * Verifica si un usuario puede destacar un anuncio
   */
  static async canHighlightAnnouncement(userId: string): Promise<{
    canHighlight: boolean;
    reason?: string;
    price: number;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          canHighlight: false,
          reason: 'Usuario no encontrado',
          price: 0
        };
      }

      const limits = this.getUserLimits(user.userType || 'inquilino');

      if (!limits.canHighlight) {
        return {
          canHighlight: false,
          reason: 'Tu tipo de cuenta no permite destacar anuncios',
          price: 0
        };
      }

      return {
        canHighlight: true,
        price: limits.highlightPrice
      };

    } catch (error) {
      console.error('Error checking highlight limits:', error);
      return {
        canHighlight: false,
        reason: 'Error al verificar límites',
        price: 0
      };
    }
  }

  /**
   * Obtiene el resumen de uso actual del usuario
   */
  static async getUserUsageSummary(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return null;
      }

      // Contar propiedades activas
      const propertiesCount = await prisma.property.count({
        where: {
          userId,
          status: {
            not: 'EXPIRED'
          }
        }
      });

      // Verificar perfil de comunidad
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });
      const profilesCount = existingProfile ? 1 : 0;

      const limits = this.getUserLimits(user.userType || 'inquilino');

      return {
        userType: user.userType,
        subscriptionType: 'free', // Por ahora siempre free
        limits,
        usage: {
          properties: {
            current: propertiesCount,
            maxFree: limits.maxFreeProperties,
            maxPaid: limits.maxPaidProperties,
            canPublishFree: propertiesCount < limits.maxFreeProperties,
            canPublishPaid: limits.maxPaidProperties === -1 || propertiesCount < limits.maxPaidProperties
          },
          profiles: {
            current: profilesCount,
            maxFree: limits.maxFreeProfiles,
            maxPaid: limits.maxPaidProfiles,
            canCreateFree: profilesCount < limits.maxFreeProfiles,
            canCreatePaid: limits.maxPaidProfiles === -1 || profilesCount < limits.maxPaidProfiles
          },
          highlighting: {
            available: limits.canHighlight,
            price: limits.highlightPrice
          }
        }
      };

    } catch (error) {
      console.error('Error getting usage summary:', error);
      return null;
    }
  }
}

// Configuración de precios por tipo de usuario
export const USER_PRICING = {
  inquilino: {
    communityProfile: 5000, // AR$5.000 por 30 días
    highlight: 3000 // AR$3.000 por 20 días
  },
  dueno_directo: {
    propertyPackage: 10000, // AR$10.000 por 3 meses (hasta 10 propiedades)
    communityProfile: 5000, // AR$5.000 por 30 días
    highlight: 7000 // AR$7.000 por 20 días
  },
  inmobiliaria: {
    basicPlan: 25000, // AR$25.000/mes (10 propiedades)
    premiumPlan: 50000, // AR$50.000/mes (ilimitadas)
    highlight: 7000 // AR$7.000 por 20 días c/u
  }
};
