/**
 * 🔧 MEJORA DEL ENDPOINT DELETE USER PARA ADMINISTRADORES
 * 
 * Este archivo mejora el endpoint existente para que funcione correctamente
 * con los permisos de administrador configurados.
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

    // Verificar permisos de admin en la base de datos (MEJORADO)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('User')
      .select('role, email')
      .eq('id', user.id)
      .single();

    // Verificar si es admin por rol O por email específico
    const isAdmin = userProfile?.role === 'ADMIN' || 
                   user.email === 'cgonzalezarchilla@gmail.com';

    if (profileError || !isAdmin) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo administradores pueden eliminar usuarios.' },
        { status: 403 }
      );
    }

    // VERIFICACIONES DE SEGURIDAD MEJORADAS
    
    // 1. Verificación ID usuario - Prevenir auto-eliminación por ID
    if (user.id === userIdToDelete) {
      console.error(`CRITICAL ERROR: Self-deletion attempt by user ID ${user.id}`);
      return NextResponse.json(
        { error: 'CRÍTICO: No puedes eliminar tu propia cuenta por ID' },
        { status: 400 }
      );
    }

    // Obtener información del usuario antes de eliminarlo (MEJORADO)
    let userToDelete = null;
    let userExistsInPublicTable = false;

    // Primero verificar en auth.users usando Service Role
    const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userIdToDelete);
    
    if (authUserError || !authUserData.user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado en sistema de autenticación' },
        { status: 404 }
      );
    }

    // Verificar si existe en tabla pública User
    const { data: publicUserData, error: publicUserError } = await supabaseAdmin
      .from('User')
      .select('email, name, role')
      .eq('id', userIdToDelete)
      .single();

    if (publicUserData) {
      userToDelete = publicUserData;
      userExistsInPublicTable = true;
    } else {
      // Usuario solo existe en auth.users (usuario huérfano)
      userToDelete = {
        email: authUserData.user.email || 'Sin email',
        name: authUserData.user.user_metadata?.name || 'Sin nombre',
        role: 'USUARIO_HUERFANO'
      };
      userExistsInPublicTable = false;
    }

    // 2. Verificación email - Prevenir auto-eliminación por email
    if (user.email === userToDelete.email) {
      console.error(`CRITICAL ERROR: Self-deletion attempt by email ${user.email}`);
      return NextResponse.json(
        { error: 'CRÍTICO: No puedes eliminar tu propia cuenta por email' },
        { status: 400 }
      );
    }

    // 3. Verificación último admin - Solo si el usuario existe en tabla pública
    if (userExistsInPublicTable && userToDelete.role === 'ADMIN') {
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

    // ELIMINACIÓN DE DATOS RELACIONADOS (MEJORADO)
    // Solo eliminar datos relacionados si el usuario existe en tabla pública
    
    if (userExistsInPublicTable) {
      console.log(`Eliminando datos relacionados para usuario: ${userIdToDelete}`);
      
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

      // 4. Eliminar inquiries del usuario
      const { error: inquiriesError } = await supabaseAdmin
        .from('UserInquiry')
        .delete()
        .eq('userId', userIdToDelete);

      if (inquiriesError) {
        console.error('Error eliminando inquiries:', inquiriesError);
      }

      // 5. Eliminar pagos del usuario
      const { error: paymentsError } = await supabaseAdmin
        .from('Payment')
        .delete()
        .eq('userId', userIdToDelete);

      if (paymentsError) {
        console.error('Error eliminando pagos:', paymentsError);
      }

      // 6. Eliminar suscripciones del usuario
      const { error: subscriptionsError } = await supabaseAdmin
        .from('Subscription')
        .delete()
        .eq('userId', userIdToDelete);

      if (subscriptionsError) {
        console.error('Error eliminando suscripciones:', subscriptionsError);
      }

      // 7. Eliminar perfil de comunidad
      const { error: communityProfileError } = await supabaseAdmin
        .from('UserProfile')
        .delete()
        .eq('userId', userIdToDelete);

      if (communityProfileError) {
        console.error('Error eliminando perfil de comunidad:', communityProfileError);
      }

      // 8. Eliminar el usuario de la tabla User
      const { error: deleteUserError } = await supabaseAdmin
        .from('User')
        .delete()
        .eq('id', userIdToDelete);

      if (deleteUserError) {
        console.error('Error eliminando usuario de tabla pública:', deleteUserError);
        return NextResponse.json(
          { error: 'Error eliminando usuario de la base de datos' },
          { status: 500 }
        );
      }
    } else {
      console.log(`Usuario huérfano detectado: ${userIdToDelete}. Solo eliminando de auth.users`);
    }

    // 9. Eliminar el usuario de Supabase Auth (CRÍTICO - SIEMPRE HACER ESTO)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (authDeleteError) {
      console.error('Error eliminando usuario de Auth:', authDeleteError);
      return NextResponse.json(
        { error: 'Error eliminando usuario de autenticación' },
        { status: 500 }
      );
    }

    // Log de auditoría MEJORADO
    console.log(`Usuario eliminado exitosamente:`, {
      deletedUserId: userIdToDelete,
      deletedUserEmail: userToDelete.email,
      deletedUserName: userToDelete.name,
      deletedUserRole: userToDelete.role,
      wasOrphanUser: !userExistsInPublicTable,
      deletedBy: user.id,
      deletedByEmail: user.email,
      timestamp: new Date().toISOString()
    });

    // Opcional: Guardar log en base de datos (MEJORADO)
    try {
      // Solo intentar guardar log si la tabla AuditLog existe
      await supabaseAdmin
        .from('AuditLog')
        .insert({
          action: 'DELETE_USER',
          performedBy: user.id,
          targetUserId: userIdToDelete,
          details: {
            deletedUserEmail: userToDelete.email,
            deletedUserName: userToDelete.name,
            deletedUserRole: userToDelete.role,
            wasOrphanUser: !userExistsInPublicTable
          },
          timestamp: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('Error guardando log de auditoría:', auditError);
      // No fallar la operación por esto
    }

    return NextResponse.json({
      success: true,
      message: userExistsInPublicTable 
        ? 'Usuario eliminado exitosamente' 
        : 'Usuario huérfano eliminado exitosamente de autenticación',
      deletedUser: {
        id: userIdToDelete,
        email: userToDelete.email,
        name: userToDelete.name,
        wasOrphanUser: !userExistsInPublicTable
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

// Método GET mejorado para obtener información del usuario
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

    // Verificar permisos de admin (MEJORADO)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'ADMIN' || 
                   user.email === 'cgonzalezarchilla@gmail.com';

    if (profileError || !isAdmin) {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Obtener información del usuario (MEJORADO)
    // Primero verificar en auth.users
    const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authUserError || !authUserData.user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado en sistema de autenticación' },
        { status: 404 }
      );
    }

    // Verificar en tabla pública
    const { data: targetUser, error: getUserError } = await supabaseAdmin
      .from('User')
      .select('id, email, name, role, created_at, updated_at')
      .eq('id', userId)
      .single();

    let userInfo;
    let isOrphanUser = false;

    if (targetUser) {
      userInfo = targetUser;
    } else {
      // Usuario huérfano
      isOrphanUser = true;
      userInfo = {
        id: userId,
        email: authUserData.user.email || 'Sin email',
        name: authUserData.user.user_metadata?.name || 'Sin nombre',
        role: 'USUARIO_HUERFANO',
        created_at: authUserData.user.created_at,
        updated_at: authUserData.user.updated_at
      };
    }

    // Obtener estadísticas del usuario (solo si no es huérfano)
    let stats = {
      propertiesCount: 0,
      favoritesCount: 0,
      isOrphanUser: isOrphanUser
    };

    if (!isOrphanUser) {
      const [
        { count: propertiesCount },
        { count: favoritesCount }
      ] = await Promise.all([
        supabaseAdmin.from('Property').select('*', { count: 'exact', head: true }).eq('userId', userId),
        supabaseAdmin.from('Favorite').select('*', { count: 'exact', head: true }).eq('userId', userId)
      ]);

      stats.propertiesCount = propertiesCount || 0;
      stats.favoritesCount = favoritesCount || 0;
    }

    return NextResponse.json({
      user: userInfo,
      stats: stats
    });

  } catch (error) {
    console.error('Error obteniendo información del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
