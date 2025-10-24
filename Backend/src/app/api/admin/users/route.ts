import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin, ADMIN_ACCESS_DENIED, logAdminAccess } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar permisos de admin usando el sistema estándar
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(ADMIN_ACCESS_DENIED, { status: 403 });
    }

    // Log admin access
    await logAdminAccess('view_users');

    const supabase = createClient();

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    // Calcular offset
    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabase
      .from('users')
      .select('id, email, name, userType, createdAt, updatedAt', { count: 'exact' });

    // Aplicar filtros
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('userType', role);
    }

    // Aplicar paginación y ordenamiento
    query = query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      console.error('[AdminUsers] Error fetching users:', {
        error: usersError,
        message: usersError.message,
        details: usersError.details,
        hint: usersError.hint,
        code: usersError.code
      });
      return NextResponse.json(
        { error: 'Error obteniendo usuarios', details: usersError.message },
        { status: 500 }
      );
    }

    // Obtener estadísticas generales
    const { data: allUsers } = await supabase
      .from('users')
      .select('userType');

    const totalUsers = allUsers?.length || 0;
    const inquilinoCount = allUsers?.filter(u => u.userType === 'inquilino').length || 0;
    const duenoCount = allUsers?.filter(u => u.userType === 'dueno').length || 0;
    const inmobiliariaCount = allUsers?.filter(u => u.userType === 'inmobiliaria').length || 0;

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: {
        totalUsers,
        inquilinoCount,
        duenoCount,
        inmobiliariaCount
      }
    });

  } catch (error) {
    console.error('Error en API de usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Método POST para crear usuarios (opcional)
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos de admin usando el sistema estándar
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(ADMIN_ACCESS_DENIED, { status: 403 });
    }

    const supabase = createClient();

    const body = await request.json();
    const { email, password, name, userType = 'inquilino' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Log admin action
    await logAdminAccess('create_user', { email, userType });

    // Note: Creating users via admin requires service role key
    // This endpoint is a placeholder - actual implementation would need service role key
    return NextResponse.json(
      {
        error: 'Funcionalidad de creación de usuarios no disponible',
        message: 'Usa el flujo de registro normal para crear usuarios'
      },
      { status: 501 }
    );

  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
