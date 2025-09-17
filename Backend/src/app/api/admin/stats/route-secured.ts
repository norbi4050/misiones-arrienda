/**
 * 📊 API DE ESTADÍSTICAS DE ADMINISTRACIÓN - VERSIÓN SEGURA
 *
 * Proporciona estadísticas completas del sistema para el dashboard de administración
 * CON VERIFICACIÓN DE AUTENTICACIÓN Y AUTORIZACIÓN
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Cliente admin con Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cliente regular para verificar permisos
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // 🔒 VERIFICACIÓN DE AUTENTICACIÓN Y AUTORIZACIÓN
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado - Token requerido' },
        { status: 401 }
      );
    }

    // Verificar que el usuario actual está autenticado
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar permisos de admin en la base de datos
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo administradores pueden acceder a las estadísticas.' },
        { status: 403 }
      );
    }

    // 📊 OBTENER ESTADÍSTICAS DEL SISTEMA
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Estadísticas de usuarios usando Supabase
    const [
      { count: totalUsers },
      { count: newUsersThisMonth },
      { count: inquilinos },
      { count: duenos },
      { count: inmobiliarias }
    ] = await Promise.all([
      supabaseAdmin.from('User').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('User').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
      supabaseAdmin.from('User').select('*', { count: 'exact', head: true }).eq('user_type', 'inquilino'),
      supabaseAdmin.from('User').select('*', { count: 'exact', head: true }).eq('user_type', 'dueno_directo'),
      supabaseAdmin.from('User').select('*', { count: 'exact', head: true }).eq('user_type', 'inmobiliaria')
    ]);

    // Estadísticas de propiedades usando Supabase
    const [
      { count: totalProperties },
      { count: activeProperties },
      { count: expiredProperties },
      { count: featuredProperties },
      { count: newPropertiesThisMonth }
    ] = await Promise.all([
      supabaseAdmin.from('Property').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('Property').select('*', { count: 'exact', head: true }).eq('status', 'AVAILABLE'),
      supabaseAdmin.from('Property').select('*', { count: 'exact', head: true }).eq('status', 'EXPIRED'),
      supabaseAdmin.from('Property').select('*', { count: 'exact', head: true }).eq('featured', true),
      supabaseAdmin.from('Property').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString())
    ]);

    // Estadísticas de pagos (usando Supabase si existe la tabla Payment)
    let paymentStats;
    try {
      const [
        { count: totalPayments },
        { count: successfulPayments },
        { count: pendingPayments },
        { count: failedPayments }
      ] = await Promise.all([
        supabaseAdmin.from('Payment').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('Payment').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
        supabaseAdmin.from('Payment').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabaseAdmin.from('Payment').select('*', { count: 'exact', head: true }).eq('status', 'FAILED')
      ]);

      paymentStats = {
        successful: successfulPayments || 0,
        pending: pendingPayments || 0,
        failed: failedPayments || 0,
        total: totalPayments || 0
      };
    } catch (paymentError) {
      // Si no existe la tabla Payment, usar datos simulados
      paymentStats = {
        successful: 0,
        pending: 0,
        failed: 0,
        total: 0,
        note: 'Tabla Payment no encontrada'
      };
    }

    const stats = {
      users: {
        total: totalUsers || 0,
        inquilinos: inquilinos || 0,
        duenos: duenos || 0,
        inmobiliarias: inmobiliarias || 0,
        newThisMonth: newUsersThisMonth || 0
      },
      properties: {
        total: totalProperties || 0,
        active: activeProperties || 0,
        expired: expiredProperties || 0,
        featured: featuredProperties || 0,
        newThisMonth: newPropertiesThisMonth || 0
      },
      payments: paymentStats,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        period: {
          month: now.getMonth() + 1,
          year: now.getFullYear()
        }
      }
    };

    // Log de auditoría
    .toISOString()
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
