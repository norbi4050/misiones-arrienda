/**
 * 📊 API DE ESTADÍSTICAS DE ADMINISTRACIÓN
 * 
 * Proporciona estadísticas completas del sistema para el dashboard de administración
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de administrador (por ahora simplificado)
    // TODO: Implementar verificación real de admin
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Estadísticas de usuarios
    const [
      totalUsers,
      newUsersThisMonth,
      inquilinos,
      duenos,
      inmobiliarias
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      prisma.user.count({
        where: {
          userType: 'inquilino'
        }
      }),
      prisma.user.count({
        where: {
          userType: 'dueno_directo'
        }
      }),
      prisma.user.count({
        where: {
          userType: 'inmobiliaria'
        }
      })
    ]);

    // Estadísticas de propiedades
    const [
      totalProperties,
      activeProperties,
      expiredProperties,
      featuredProperties,
      newPropertiesThisMonth
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({
        where: {
          status: 'AVAILABLE'
        }
      }),
      prisma.property.count({
        where: {
          status: 'EXPIRED'
        }
      }),
      prisma.property.count({
        where: {
          featured: true
        }
      }),
      prisma.property.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      })
    ]);

    // Estadísticas de pagos (simuladas por ahora)
    const paymentStats = {
      totalRevenue: 2500000, // AR$2.500.000
      thisMonth: 450000, // AR$450.000
      successful: 156,
      pending: 12,
      failed: 8
    };

    // Estadísticas de comunidad (simuladas por ahora)
    const communityStats = {
      profiles: 45,
      activeProfiles: 42,
      suspendedProfiles: 3,
      newThisMonth: 8
    };

    const stats = {
      users: {
        total: totalUsers,
        inquilinos,
        duenos,
        inmobiliarias,
        newThisMonth: newUsersThisMonth
      },
      properties: {
        total: totalProperties,
        active: activeProperties,
        expired: expiredProperties,
        featured: featuredProperties,
        newThisMonth: newPropertiesThisMonth
      },
      payments: paymentStats,
      community: {
        profiles: communityStats.profiles,
        activeProfiles: communityStats.activeProfiles,
        suspendedProfiles: communityStats.suspendedProfiles,
        newThisMonth: communityStats.newThisMonth
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
