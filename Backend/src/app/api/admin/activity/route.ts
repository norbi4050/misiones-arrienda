/**
 * 📈 API DE ACTIVIDAD RECIENTE DE ADMINISTRACIÓN
 * 
 * Proporciona la actividad reciente del sistema para el dashboard de administración
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de administrador (por ahora simplificado)
    // TODO: Implementar verificación real de admin
    
    // Obtener actividad reciente de usuarios
    const recentUsers = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        name: true,
        userType: true,
        createdAt: true
      }
    });

    // Obtener actividad reciente de propiedades
    const recentProperties = await prisma.property.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Definir tipo para la actividad
    interface ActivityItem {
      id: string;
      type: 'user_registered' | 'property_published' | 'payment_received' | 'profile_created';
      description: string;
      timestamp: string;
      amount?: number;
    }

    // Combinar y formatear actividad
    const activity: ActivityItem[] = [];

    // Agregar usuarios registrados
    recentUsers.forEach(user => {
      activity.push({
        id: `user-${user.id}`,
        type: 'user_registered' as const,
        description: `${user.name} se registró como ${user.userType}`,
        timestamp: user.createdAt.toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    });

    // Agregar propiedades publicadas
    recentProperties.forEach(property => {
      activity.push({
        id: `property-${property.id}`,
        type: 'property_published' as const,
        description: `${property.user.name} publicó "${property.title}"`,
        timestamp: property.createdAt.toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    });

    // Agregar actividad simulada de pagos y perfiles
    const simulatedActivity = [
      {
        id: 'payment-1',
        type: 'payment_received' as const,
        description: 'Pago recibido por destacar propiedad',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        amount: 7000
      },
      {
        id: 'profile-1',
        type: 'profile_created' as const,
        description: 'Nuevo perfil de comunidad creado',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      {
        id: 'payment-2',
        type: 'payment_received' as const,
        description: 'Pago recibido por plan inmobiliaria',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        amount: 25000
      }
    ];

    // Combinar toda la actividad
    const allActivity = [...activity, ...simulatedActivity];

    // Ordenar por timestamp (más reciente primero)
    allActivity.sort((a, b) => {
      const dateA = new Date(a.timestamp.split(' ')[0].split('/').reverse().join('-') + ' ' + a.timestamp.split(' ')[1]);
      const dateB = new Date(b.timestamp.split(' ')[0].split('/').reverse().join('-') + ' ' + b.timestamp.split(' ')[1]);
      return dateB.getTime() - dateA.getTime();
    });

    // Tomar solo los 10 más recientes
    const recentActivity = allActivity.slice(0, 10);

    return NextResponse.json(recentActivity);

  } catch (error) {
    console.error('Error fetching admin activity:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
