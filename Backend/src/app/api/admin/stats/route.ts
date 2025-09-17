/**
 * 📊 API DE ESTADÍSTICAS DE ADMINISTRACIÓN
 *
 * Proporciona estadísticas completas del sistema para el dashboard de administración
 * CON VERIFICACIÓN DE AUTENTICACIÓN Y AUTORIZACIÓN
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

// Cliente admin con Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación del usuario
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verificar que el usuario actual es admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token de autorización inválido' },
        { status: 401 }
      );
    }

    // Verificar permisos de admin en la base de datos
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo administradores pueden acceder a las estadísticas.' },
        { status: 403 }
      );
    }

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

    // Log de auditoría
    .toISOString(),
      userEmail: user.email
    });

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
