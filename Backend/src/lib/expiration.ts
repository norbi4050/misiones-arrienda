/**
 * 🕒 SISTEMA DE CADUCIDAD DE ANUNCIOS
 * 
 * Maneja la expiración automática de anuncios según el plan técnico:
 * - Usuario Básico: 7 días gratis, 30 días pago
 * - Propietario Directo: 20 días gratis, 3 meses pago
 * - Profesional: 3 meses según plan
 */

import { prisma } from './prisma';

export interface ExpirationConfig {
  userType: 'inquilino' | 'dueno_directo' | 'inmobiliaria';
  isPaid: boolean;
  isHighlighted?: boolean;
}

export class ExpirationManager {
  
  /**
   * Calcula la fecha de expiración según el tipo de usuario y si es pago
   */
  static calculateExpirationDate(config: ExpirationConfig): Date {
    const now = new Date();
    
    switch (config.userType) {
      case 'inquilino': // Usuario Básico (Comunidad)
        if (config.isPaid) {
          // Pago: AR$5.000 → 30 días
          return new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        } else {
          // Gratis: 7 días
          return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
        }
        
      case 'dueno_directo': // Propietario Directo
        if (config.isPaid) {
          // Pago: AR$10.000 → 3 meses
          return new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
        } else {
          // Gratis: 20 días
          return new Date(now.getTime() + (20 * 24 * 60 * 60 * 1000));
        }
        
      case 'inmobiliaria': // Usuario Profesional
        // Siempre 3 meses (según plan de suscripción)
        return new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
        
      default:
        // Por defecto: 7 días
        return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    }
  }
  
  /**
   * Calcula la fecha de expiración para destacados
   */
  static calculateHighlightExpiration(): Date {
    const now = new Date();
    // Destacados duran 20 días
    return new Date(now.getTime() + (20 * 24 * 60 * 60 * 1000));
  }
  
  /**
   * Verifica si un anuncio ha expirado
   */
  static isExpired(expirationDate: Date): boolean {
    return new Date() > expirationDate;
  }
  
  /**
   * Obtiene anuncios que expiran en los próximos días
   */
  static async getExpiringAnnouncements(daysAhead: number = 3) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    // Propiedades que expiran
    const expiringProperties = await prisma.property.findMany({
      where: {
        expiresAt: {
          lte: futureDate,
          gte: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true
          }
        }
      }
    });
    
    // Perfiles de comunidad que expiran
    const expiringProfiles = await prisma.userProfile.findMany({
      where: {
        expiresAt: {
          lte: futureDate,
          gte: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true
          }
        }
      }
    });
    
    return {
      properties: expiringProperties,
      profiles: expiringProfiles
    };
  }
  
  /**
   * Marca anuncios expirados como inactivos
   */
  static async deactivateExpiredAnnouncements() {
    const now = new Date();
    
    // Desactivar propiedades expiradas
    const expiredProperties = await prisma.property.updateMany({
      where: {
        expiresAt: {
          lt: now
        },
        status: 'AVAILABLE'
      },
      data: {
        status: 'EXPIRED'
      }
    });
    
    // Desactivar perfiles de comunidad expirados
    const expiredProfiles = await prisma.userProfile.updateMany({
      where: {
        expiresAt: {
          lt: now
        },
        isSuspended: false
      },
      data: {
        isSuspended: true
      }
    });
    
    return {
      expiredProperties: expiredProperties.count,
      expiredProfiles: expiredProfiles.count
    };
  }
  
  /**
   * Renueva un anuncio (extiende su fecha de expiración)
   */
  static async renewAnnouncement(
    type: 'property' | 'profile',
    id: string,
    config: ExpirationConfig
  ) {
    const newExpirationDate = this.calculateExpirationDate(config);
    
    if (type === 'property') {
      return await prisma.property.update({
        where: { id },
        data: {
          expiresAt: newExpirationDate,
          status: 'AVAILABLE'
        }
      });
    } else {
      return await prisma.userProfile.update({
        where: { id },
        data: {
          expiresAt: newExpirationDate,
          isSuspended: false
        }
      });
    }
  }
  
  /**
   * Obtiene estadísticas de expiración
   */
  static async getExpirationStats() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const stats = {
      expiredToday: {
        properties: await prisma.property.count({
          where: {
            expiresAt: { lt: now },
            status: 'EXPIRED'
          }
        }),
        profiles: await prisma.userProfile.count({
          where: {
            expiresAt: { lt: now },
            isSuspended: true
          }
        })
      },
      expiringTomorrow: {
        properties: await prisma.property.count({
          where: {
            expiresAt: { 
              gte: now,
              lt: tomorrow 
            }
          }
        }),
        profiles: await prisma.userProfile.count({
          where: {
            expiresAt: { 
              gte: now,
              lt: tomorrow 
            }
          }
        })
      },
      expiringThisWeek: {
        properties: await prisma.property.count({
          where: {
            expiresAt: { 
              gte: now,
              lt: nextWeek 
            }
          }
        }),
        profiles: await prisma.userProfile.count({
          where: {
            expiresAt: { 
              gte: now,
              lt: nextWeek 
            }
          }
        })
      }
    };
    
    return stats;
  }
}

// Configuración de precios según el plan técnico
export const PRICING_CONFIG = {
  comunidad: {
    free: { days: 7, price: 0 },
    paid: { days: 30, price: 5000 }, // AR$5.000
    highlighted: { days: 20, price: 3000 } // AR$3.000 adicional
  },
  propietario: {
    free: { days: 20, price: 0 },
    paid: { days: 90, price: 10000 }, // AR$10.000
    highlighted: { days: 20, price: 7000 } // AR$7.000
  },
  inmobiliaria: {
    basic: { days: 90, price: 25000, properties: 10 }, // AR$25.000/mes
    premium: { days: 90, price: 50000, properties: -1 }, // AR$50.000/mes (ilimitadas)
    highlighted: { days: 20, price: 7000 } // AR$7.000 c/u
  }
};
