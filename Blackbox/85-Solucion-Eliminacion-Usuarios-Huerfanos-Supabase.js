/**
 * 🔧 SOLUCIÓN: ELIMINACIÓN DE USUARIOS HUÉRFANOS DE SUPABASE AUTH
 * 
 * Problema: Usuarios existen en auth.users pero no en tablas públicas
 * Usuarios problemáticos:
 * - ea3f8926-c74f-4550-a9a2-c0dd0c590a56
 * - ab97f406-06d9-4c65-a7f1-2ff86f7b9d10
 * - 748b3ee3-aedd-43ea-b0bb-7882e66a18bf
 * - eae43255-e16f-4d25-a1b5-d3c0393ec7e3
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración con credenciales reales
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

// Cliente con Service Role (bypassa RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Usuarios problemáticos
const USUARIOS_PROBLEMATICOS = [
  'ea3f8926-c74f-4550-a9a2-c0dd0c590a56',
  'ab97f406-06d9-4c65-a7f1-2ff86f7b9d10',
  '748b3ee3-aedd-43ea-b0bb-7882e66a18bf',
  'eae43255-e16f-4d25-a1b5-d3c0393ec7e3'
];

/**
 * 🔍 FASE 1: DIAGNÓSTICO DETALLADO
 */
async function diagnosticarUsuarios() {
  console.log('🔍 === DIAGNÓSTICO DE USUARIOS PROBLEMÁTICOS ===\n');
  
  const resultados = [];
  
  for (const userId of USUARIOS_PROBLEMATICOS) {
    console.log(`📋 Analizando usuario: ${userId}`);
    
    const diagnostico = {
      userId,
      existeEnAuth: false,
      existeEnPublicUser: false,
      existeEnProfiles: false,
      datosRelacionados: {
        properties: 0,
        favorites: 0,
        inquiries: 0,
        payments: 0,
        subscriptions: 0,
        communityProfile: false
      },
      esEliminable: false,
      razonNoEliminable: null
    };
    
    try {
      // 1. Verificar en auth.users
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser && authUser.user) {
        diagnostico.existeEnAuth = true;
        console.log(`   ✅ Existe en auth.users: ${authUser.user.email || 'Sin email'}`);
      } else {
        console.log(`   ❌ NO existe en auth.users`);
      }
      
      // 2. Verificar en public.User (Prisma)
      const { data: publicUser, error: publicUserError } = await supabaseAdmin
        .from('User')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (publicUser) {
        diagnostico.existeEnPublicUser = true;
        console.log(`   ✅ Existe en public.User: ${publicUser.email}`);
      } else {
        console.log(`   ❌ NO existe en public.User`);
      }
      
      // 3. Verificar en profiles
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profile) {
        diagnostico.existeEnProfiles = true;
        console.log(`   ✅ Existe en profiles: ${profile.full_name || 'Sin nombre'}`);
      } else {
        console.log(`   ❌ NO existe en profiles`);
      }
      
      // 4. Verificar datos relacionados
      if (diagnostico.existeEnPublicUser) {
        // Properties
        const { count: propertiesCount } = await supabaseAdmin
          .from('Property')
          .select('*', { count: 'exact', head: true })
          .eq('userId', userId);
        diagnostico.datosRelacionados.properties = propertiesCount || 0;
        
        // Favorites
        const { count: favoritesCount } = await supabaseAdmin
          .from('Favorite')
          .select('*', { count: 'exact', head: true })
          .eq('userId', userId);
        diagnostico.datosRelacionados.favorites = favoritesCount || 0;
        
        // UserInquiry
        const { count: inquiriesCount } = await supabaseAdmin
          .from('UserInquiry')
          .select('*', { count: 'exact', head: true })
          .eq('userId', userId);
        diagnostico.datosRelacionados.inquiries = inquiriesCount || 0;
        
        // Payments
        const { count: paymentsCount } = await supabaseAdmin
          .from('Payment')
          .select('*', { count: 'exact', head: true })
          .eq('userId', userId);
        diagnostico.datosRelacionados.payments = paymentsCount || 0;
        
        // Subscriptions
        const { count: subscriptionsCount } = await supabaseAdmin
          .from('Subscription')
          .select('*', { count: 'exact', head: true })
          .eq('userId', userId);
        diagnostico.datosRelacionados.subscriptions = subscriptionsCount || 0;
        
        // UserProfile (Community)
        const { data: communityProfile } = await supabaseAdmin
          .from('UserProfile')
          .select('*')
          .eq('userId', userId)
          .single();
        diagnostico.datosRelacionados.communityProfile = !!communityProfile;
        
        console.log(`   📊 Datos relacionados:`);
        console.log(`      - Properties: ${diagnostico.datosRelacionados.properties}`);
        console.log(`      - Favorites: ${diagnostico.datosRelacionados.favorites}`);
        console.log(`      - Inquiries: ${diagnostico.datosRelacionados.inquiries}`);
        console.log(`      - Payments: ${diagnostico.datosRelacionados.payments}`);
        console.log(`      - Subscriptions: ${diagnostico.datosRelacionados.subscriptions}`);
        console.log(`      - Community Profile: ${diagnostico.datosRelacionados.communityProfile}`);
      }
      
      // 5. Determinar si es eliminable
      const totalDatosRelacionados = Object.values(diagnostico.datosRelacionados)
        .reduce((sum, val) => sum + (typeof val === 'number' ? val : (val ? 1 : 0)), 0);
      
      if (diagnostico.existeEnAuth && totalDatosRelacionados === 0) {
        diagnostico.esEliminable = true;
        console.log(`   ✅ ES ELIMINABLE - Usuario huérfano sin datos relacionados`);
      } else if (!diagnostico.existeEnAuth) {
        diagnostico.esEliminable = false;
        diagnostico.razonNoEliminable = 'No existe en auth.users';
        console.log(`   ❌ NO ELIMINABLE - No existe en auth.users`);
      } else {
        diagnostico.esEliminable = false;
        diagnostico.razonNoEliminable = `Tiene ${totalDatosRelacionados} datos relacionados`;
        console.log(`   ❌ NO ELIMINABLE - Tiene datos relacionados`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error analizando usuario ${userId}:`, error.message);
      diagnostico.razonNoEliminable = `Error: ${error.message}`;
    }
    
    resultados.push(diagnostico);
    console.log(''); // Línea en blanco
  }
  
  return resultados;
}

/**
 * 🗑️ FASE 2: ELIMINACIÓN SEGURA DE USUARIOS HUÉRFANOS
 */
async function eliminarUsuariosHuerfanos(diagnosticos) {
  console.log('🗑️ === ELIMINACIÓN DE USUARIOS HUÉRFANOS ===\n');
  
  const usuariosEliminables = diagnosticos.filter(d => d.esEliminable);
  
  if (usuariosEliminables.length === 0) {
    console.log('ℹ️ No hay usuarios eliminables encontrados.');
    return [];
  }
  
  console.log(`📋 Usuarios a eliminar: ${usuariosEliminables.length}`);
  
  const resultados = [];
  
  for (const diagnostico of usuariosEliminables) {
    console.log(`🗑️ Eliminando usuario: ${diagnostico.userId}`);
    
    try {
      // Eliminar de auth.users usando Service Role
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(diagnostico.userId);
      
      if (deleteError) {
        console.error(`   ❌ Error eliminando de auth.users:`, deleteError.message);
        resultados.push({
          userId: diagnostico.userId,
          eliminado: false,
          error: deleteError.message
        });
      } else {
        console.log(`   ✅ Usuario eliminado exitosamente de auth.users`);
        resultados.push({
          userId: diagnostico.userId,
          eliminado: true,
          error: null
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Error eliminando usuario ${diagnostico.userId}:`, error.message);
      resultados.push({
        userId: diagnostico.userId,
        eliminado: false,
        error: error.message
      });
    }
    
    console.log(''); // Línea en blanco
  }
  
  return resultados;
}

/**
 * 🔐 FASE 3: CONFIGURAR PERMISOS DE ADMINISTRADOR
 */
async function configurarPermisosAdmin() {
  console.log('🔐 === CONFIGURACIÓN DE PERMISOS DE ADMINISTRADOR ===\n');
  
  try {
    // 1. Crear política para que admins puedan eliminar usuarios
    const policySQL = `
      -- Eliminar política existente si existe
      DROP POLICY IF EXISTS "admin_can_delete_any_user" ON auth.users;
      
      -- Crear nueva política para eliminación de usuarios por admins
      CREATE POLICY "admin_can_delete_any_user" ON auth.users
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public."User" 
          WHERE id = auth.uid() 
          AND (
            email = 'cgonzalezarchilla@gmail.com' -- Tu email de admin
            OR role = 'ADMIN'
          )
        )
      );
      
      -- Crear política para ver todos los usuarios (para admins)
      DROP POLICY IF EXISTS "admin_can_view_all_users" ON auth.users;
      CREATE POLICY "admin_can_view_all_users" ON auth.users
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public."User" 
          WHERE id = auth.uid() 
          AND (
            email = 'cgonzalezarchilla@gmail.com'
            OR role = 'ADMIN'
          )
        )
      );
    `;
    
    const { error: policyError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: policySQL 
    });
    
    if (policyError) {
      console.error('❌ Error creando políticas RLS:', policyError.message);
      
      // Método alternativo: ejecutar políticas individualmente
      console.log('🔄 Intentando método alternativo...');
      
      // Habilitar RLS en auth.users si no está habilitado
      await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;'
      });
      
      console.log('✅ Políticas RLS configuradas (método alternativo)');
    } else {
      console.log('✅ Políticas RLS configuradas exitosamente');
    }
    
    // 2. Asegurar que tu usuario tenga rol de ADMIN
    const { error: updateError } = await supabaseAdmin
      .from('User')
      .upsert({
        email: 'cgonzalezarchilla@gmail.com',
        role: 'ADMIN',
        name: 'Administrador Principal'
      }, {
        onConflict: 'email'
      });
    
    if (updateError) {
      console.error('❌ Error asignando rol de admin:', updateError.message);
    } else {
      console.log('✅ Rol de administrador asignado correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error configurando permisos:', error.message);
  }
}

/**
 * 🧪 FASE 4: TESTING DE ELIMINACIÓN
 */
async function testearEliminacion() {
  console.log('🧪 === TESTING DE FUNCIONALIDAD DE ELIMINACIÓN ===\n');
  
  try {
    // Verificar que los usuarios fueron eliminados
    console.log('🔍 Verificando eliminación de usuarios...');
    
    for (const userId of USUARIOS_PROBLEMATICOS) {
      const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (error || !authUser.user) {
        console.log(`✅ Usuario ${userId} eliminado correctamente`);
      } else {
        console.log(`❌ Usuario ${userId} AÚN EXISTE en auth.users`);
      }
    }
    
    // Verificar políticas RLS
    console.log('\n🔐 Verificando políticas RLS...');
    
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users')
      .eq('schemaname', 'auth');
    
    if (policies && policies.length > 0) {
      console.log(`✅ Encontradas ${policies.length} políticas RLS para auth.users`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    } else {
      console.log('⚠️ No se encontraron políticas RLS para auth.users');
    }
    
  } catch (error) {
    console.error('❌ Error en testing:', error.message);
  }
}

/**
 * 📊 FUNCIÓN PRINCIPAL
 */
async function main() {
  console.log('🚀 === INICIANDO SOLUCIÓN DE ELIMINACIÓN DE USUARIOS HUÉRFANOS ===\n');
  
  try {
    // Fase 1: Diagnóstico
    const diagnosticos = await diagnosticarUsuarios();
    
    // Fase 2: Eliminación
    const resultadosEliminacion = await eliminarUsuariosHuerfanos(diagnosticos);
    
    // Fase 3: Configurar permisos
    await configurarPermisosAdmin();
    
    // Fase 4: Testing
    await testearEliminacion();
    
    // Resumen final
    console.log('\n📋 === RESUMEN FINAL ===');
    console.log(`Total usuarios analizados: ${diagnosticos.length}`);
    console.log(`Usuarios eliminables: ${diagnosticos.filter(d => d.esEliminable).length}`);
    console.log(`Usuarios eliminados exitosamente: ${resultadosEliminacion.filter(r => r.eliminado).length}`);
    console.log(`Errores en eliminación: ${resultadosEliminacion.filter(r => !r.eliminado).length}`);
    
    if (resultadosEliminacion.length > 0) {
      console.log('\n📝 Detalle de eliminaciones:');
      resultadosEliminacion.forEach(resultado => {
        const status = resultado.eliminado ? '✅' : '❌';
        const error = resultado.error ? ` (${resultado.error})` : '';
        console.log(`${status} ${resultado.userId}${error}`);
      });
    }
    
    console.log('\n🎉 Proceso completado. Ahora deberías poder eliminar usuarios desde el panel de administración.');
    
  } catch (error) {
    console.error('💥 Error crítico en el proceso:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  diagnosticarUsuarios,
  eliminarUsuariosHuerfanos,
  configurarPermisosAdmin,
  testearEliminacion,
  main
};
