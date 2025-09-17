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
    // Verificar autenticación del usuario actual
    const cookieStore = cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario actual es admin
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
        { error: 'Permisos insuficientes. Solo administradores pueden ver usuarios.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    // Calcular offset
    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabaseAdmin
      .from('User')
      .select('id, email, name, role, created_at, updated_at', { count: 'exact' });

    // Aplicar filtros
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    // Aplicar paginación y ordenamiento
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      console.error('Error obteniendo usuarios:', usersError);
      return NextResponse.json(
        { error: 'Error obteniendo usuarios' },
        { status: 500 }
      );
    }

    // Obtener estadísticas generales
    const { data: stats } = await supabaseAdmin
      .from('User')
      .select('role')
      .then(({ data }) => {
        if (!data) return { data: null };

        const totalUsers = data.length;
        const adminCount = data.filter(u => u.role === 'ADMIN').length;
        const moderatorCount = data.filter(u => u.role === 'MODERATOR').length;
        const userCount = data.filter(u => u.role === 'USER').length;

        return {
          data: {
            totalUsers,
            adminCount,
            moderatorCount,
            userCount
          }
        };
      });

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: stats || {
        totalUsers: 0,
        adminCount: 0,
        moderatorCount: 0,
        userCount: 0
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
    // Verificar autenticación del usuario actual
    const cookieStore = cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar permisos de admin
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name, role = 'USER' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Crear usuario en Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || ''
      }
    });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    // Crear perfil en la base de datos
    const { data: profile, error: profileCreateError } = await supabaseAdmin
      .from('User')
      .insert({
        id: newUser.user.id,
        email,
        name: name || '',
        role
      })
      .select()
      .single();

    if (profileCreateError) {
      // Si falla la creación del perfil, eliminar el usuario de Auth
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);

      return NextResponse.json(
        { error: 'Error creando perfil de usuario' },
        { status: 500 }
      );
    }

    // Log de auditoría
    .toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.user.id,
        email,
        name: name || '',
        role
      }
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
