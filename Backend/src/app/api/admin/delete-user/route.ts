perfimport { NextRequest, NextResponse } from 'next/server';
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

export async function DELETE(request: NextRequest) {
  try {
    // Obtener el ID del usuario a eliminar
    const { searchParams } = new URL(request.url);
    const userIdToDelete = searchParams.get('userId');

    if (!userIdToDelete) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

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
        { error: 'Permisos insuficientes. Solo administradores pueden eliminar usuarios.' },
        { status: 403 }
      );
    }

    // SELF DELETE PREVENTION MARKER - Verificaciones de seguridad mejoradas
    
    // 1. Verificación ID usuario - Prevenir auto-eliminación por ID
    if (user.id === userIdToDelete) {
      console.error(`CRITICAL ERROR: Self-deletion attempt by user ID ${user.id}`);
      return NextResponse.json(
        { error: 'CRÍTICO: No puedes eliminar tu propia cuenta por ID' },
        { status: 400 }
      );
    }

    // Obtener información del usuario antes de eliminarlo (para logging y verificaciones)
    const { data: userToDelete, error: getUserError } = await supabaseAdmin
      .from('User')
      .select('email, name, role')
      .eq('id', userIdToDelete)
      .single();

    if (getUserError) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // 2. Verificación email - Prevenir auto-eliminación por email
    if (user.email === userToDelete.email) {
      console.error(`CRITICAL ERROR: Self-deletion attempt by email ${user.email}`);
      return NextResponse.json(
        { error: 'CRÍTICO: No puedes eliminar tu propia cuenta por email' },
        { status: 400 }
      );
    }

    // 3. Verificación último admin - Prevenir eliminación del último administrador
    if (userToDelete.role === 'ADMIN') {
      const { count: adminCount } = await supabaseAdmin
        .from('User')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ADMIN');

      if (adminCount && adminCount <= 1) {
        console.error(`CRITICAL ERROR: Attempt to delete last admin by ${user.email}`);
        return NextResponse.json(
          { error: 'CRÍTICO: No se puede eliminar el último administrador del sistema' },
          { status: 400 }
        );
      }
    }

    // 4. Final Safety Check - Verificación final de seguridad
    if (user.id === userIdToDelete || user.email === userToDelete.email) {
      console.error(`CRITICAL ERROR: Final safety check failed - self deletion attempt`);
      return NextResponse.json(
        { error: 'CRÍTICO: Verificación final de seguridad falló' },
        { status: 400 }
      );
    }

    // Eliminar datos relacionados del usuario (opcional - depende de tu lógica de negocio)
    // Esto es importante para mantener la integridad de los datos
    
    // 1. Eliminar propiedades del usuario
    const { error: propertiesError } = await supabaseAdmin
      .from('Property')
      .delete()
      .eq('userId', userIdToDelete);

    if (propertiesError) {
      console.error('Error eliminando propiedades:', propertiesError);
      // Continuar con la eliminación aunque falle esto
    }

    // 2. Eliminar favoritos del usuario
    const { error: favoritesError } = await supabaseAdmin
      .from('Favorite')
      .delete()
      .eq('userId', userIdToDelete);

    if (favoritesError) {
      console.error('Error eliminando favoritos:', favoritesError);
    }

    // 3. Eliminar historial de búsquedas
    const { error: searchHistoryError } = await supabaseAdmin
      .from('SearchHistory')
      .delete()
      .eq('userId', userIdToDelete);

    if (searchHistoryError) {
      console.error('Error eliminando historial de búsquedas:', searchHistoryError);
    }

    // 4. Eliminar el usuario de la tabla User
    const { error: deleteUserError } = await supabaseAdmin
      .from('User')
      .delete()
      .eq('id', userIdToDelete);

    if (deleteUserError) {
      return NextResponse.json(
        { error: 'Error eliminando usuario de la base de datos' },
        { status: 500 }
      );
    }

    // 5. Eliminar el usuario de Supabase Auth (esto es lo más importante)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (authDeleteError) {
      console.error('Error eliminando usuario de Auth:', authDeleteError);
      return NextResponse.json(
        { error: 'Error eliminando usuario de autenticación' },
        { status: 500 }
      );
    }

    // Log de auditoría
    console.log(`Usuario eliminado exitosamente:`, {
      deletedUserId: userIdToDelete,
      deletedUserEmail: userToDelete.email,
      deletedUserName: userToDelete.name,
      deletedUserRole: userToDelete.role,
      deletedBy: user.id,
      deletedByEmail: user.email,
      timestamp: new Date().toISOString()
    });

    // Opcional: Guardar log en base de datos
    try {
      await supabaseAdmin
        .from('AuditLog')
        .insert({
          action: 'DELETE_USER',
          performedBy: user.id,
          targetUserId: userIdToDelete,
          details: {
            deletedUserEmail: userToDelete.email,
            deletedUserName: userToDelete.name,
            deletedUserRole: userToDelete.role
          },
          timestamp: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('Error guardando log de auditoría:', auditError);
      // No fallar la operación por esto
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      deletedUser: {
        id: userIdToDelete,
        email: userToDelete.email,
        name: userToDelete.name
      }
    });

  } catch (error) {
    console.error('Error en eliminación de usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Método GET para obtener información del usuario (opcional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Verificar autenticación
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

    // Obtener información del usuario
    const { data: targetUser, error: getUserError } = await supabaseAdmin
      .from('User')
      .select('id, email, name, role, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (getUserError) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener estadísticas del usuario
    const [
      { count: propertiesCount },
      { count: favoritesCount }
    ] = await Promise.all([
      supabaseAdmin.from('Property').select('*', { count: 'exact', head: true }).eq('userId', userId),
      supabaseAdmin.from('Favorite').select('*', { count: 'exact', head: true }).eq('userId', userId)
    ]);

    return NextResponse.json({
      user: targetUser,
      stats: {
        propertiesCount: propertiesCount || 0,
        favoritesCount: favoritesCount || 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo información del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
