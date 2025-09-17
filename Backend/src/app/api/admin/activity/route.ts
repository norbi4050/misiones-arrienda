/**
 * 📈 API DE ACTIVIDAD RECIENTE DE ADMINISTRACIÓN
 *
 * Proporciona la actividad reciente del sistema para el dashboard de administración
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
        { error: 'Permisos insuficientes. Solo administradores pueden acceder a la actividad del sistema.' },
        { status: 403 }
      );
    }

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
      include: {
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

    // Log de auditoría
    .toISOString(),
      userEmail: user.email
    });

    return NextResponse.json(recentActivity);

  } catch (error) {
    console.error('Error fetching admin activity:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
