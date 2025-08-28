/**
 * 🚫 SISTEMA DE LÍMITES POR TIPO DE USUARIO
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
    // Obtener usuario y sus límites
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          where: {
            status: {
              not: 'EXPIRED'
            }
          }
        },
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
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
    
    const limits = this.getUserLimits(
      user.userType || 'inquilino',
      user.subscriptions[0]?.planType
    );
    
    const currentCount = user.properties.length;
    
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
    // Obtener usuario y sus perfiles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        communityProfile: true,
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
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
    
    const limits = this.getUserLimits(
      user.userType || 'inquilino',
      user.subscriptions[0]?.planType
    );
    
    const currentCount = user.communityProfile ? 1 : 0;
    
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
  }
  
  /**
   * Verifica si un usuario puede destacar un anuncio
   */
  static async canHighlightAnnouncement(userId: string): Promise<{
    canHighlight: boolean;
    reason?: string;
    price: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });
    
    if (!user) {
      return {
        canHighlight: false,
        reason: 'Usuario no encontrado',
        price: 0
      };
    }
    
    const limits = this.getUserLimits(
      user.userType || 'inquilino',
      user.subscriptions[0]?.planType
    );
    
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
  }
  
  /**
   * Obtiene el resumen de uso actual del usuario
   */
  static async getUserUsageSummary(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          where: {
            status: {
              not: 'EXPIRED'
            }
          }
        },
        communityProfile: true,
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });
    
    if (!user) {
      return null;
    }
    
    const limits = this.getUserLimits(
      user.userType || 'inquilino',
      user.subscriptions[0]?.planType
    );
    
    const propertiesCount = user.properties.length;
    const profilesCount = user.communityProfile ? 1 : 0;
    
    return {
      userType: user.userType,
      subscriptionType: user.subscriptions[0]?.planType || 'free',
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
  }
  
  /**
   * Actualiza los límites cuando un usuario cambia de plan
   */
  static async updateUserPlan(userId: string, newPlan: string) {
    // Actualizar el tipo de usuario
    await prisma.user.update({
      where: { id: userId },
      data: {
        userType: newPlan
      }
    });
    
    // Verificar si necesita desactivar anuncios que excedan los nuevos límites
    const summary = await this.getUserUsageSummary(userId);
    
    if (summary) {
      // Si excede el límite de propiedades, desactivar las más antiguas
      if (summary.usage.properties.current > summary.limits.maxPaidProperties && 
          summary.limits.maxPaidProperties !== -1) {
        
        const excessCount = summary.usage.properties.current - summary.limits.maxPaidProperties;
        
        await prisma.property.updateMany({
          where: {
            userId,
            status: 'AVAILABLE'
          },
          data: {
            status: 'EXPIRED'
          },
          take: excessCount
        });
      }
      
      // Si excede el límite de perfiles, suspender
      if (summary.usage.profiles.current > summary.limits.maxPaidProfiles && 
          summary.limits.maxPaidProfiles !== -1) {
        
        await prisma.userProfile.updateMany({
          where: {
            userId
          },
          data: {
            isSuspended: true
          }
        });
      }
    }
    
    return summary;
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
