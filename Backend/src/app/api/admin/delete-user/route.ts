import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin, getCurrentAdminUser, ADMIN_ACCESS_DENIED, logAdminAccess } from '@/lib/admin-auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Cliente admin con Service Role Key
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    // Verificar permisos de admin usando el sistema estándar
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(ADMIN_ACCESS_DENIED, { status: 403 });
    }

    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'No se pudo obtener información del admin' }, { status: 500 });
    }

    // Obtener el ID del usuario a eliminar
    const { searchParams } = new URL(request.url);
    const userIdToDelete = searchParams.get('userId');

    if (!userIdToDelete) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // SELF DELETE PREVENTION - Verificaciones de seguridad

    // 1. Verificación ID usuario - Prevenir auto-eliminación por ID
    if (adminUser.id === userIdToDelete) {
      console.error(`CRITICAL ERROR: Self-deletion attempt by user ID ${adminUser.id}`);
      return NextResponse.json(
        { error: 'CRÍTICO: No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    // Obtener información del usuario antes de eliminarlo (para logging y verificaciones)
    const { data: userToDelete, error: getUserError } = await supabaseAdmin
      .from('users')
      .select('email, name, userType')
      .eq('id', userIdToDelete)
      .single();

    if (getUserError) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // 2. Verificación email - Prevenir auto-eliminación por email
    if (adminUser.email === userToDelete.email) {
      console.error(`CRITICAL ERROR: Self-deletion attempt by email ${adminUser.email}`);
      return NextResponse.json(
        { error: 'CRÍTICO: No puedes eliminar tu propia cuenta' },
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
      .from('users')
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
    await logAdminAccess('delete_user', {
      deletedUserId: userIdToDelete,
      deletedUserEmail: userToDelete.email,
      deletedUserName: userToDelete.name,
      deletedUserType: userToDelete.userType
    });

    console.log(`Usuario eliminado exitosamente:`, {
      deletedUserId: userIdToDelete,
      deletedUserEmail: userToDelete.email,
      deletedUserName: userToDelete.name,
      deletedUserType: userToDelete.userType,
      deletedBy: adminUser.id,
      deletedByEmail: adminUser.email,
      timestamp: new Date().toISOString()
    });

    // Opcional: Guardar log en base de datos (si existe la tabla AuditLog)
    try {
      await supabaseAdmin
        .from('AuditLog')
        .insert({
          action: 'DELETE_USER',
          performedBy: adminUser.id,
          targetUserId: userIdToDelete,
          details: {
            deletedUserEmail: userToDelete.email,
            deletedUserName: userToDelete.name,
            deletedUserType: userToDelete.userType
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
    // Verificar permisos de admin usando el sistema estándar
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(ADMIN_ACCESS_DENIED, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Obtener información del usuario
    const { data: targetUser, error: getUserError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, userType, createdAt, updatedAt')
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
