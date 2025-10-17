/**
 * Script de Auditoría - Sincronización de Usuarios
 * Ejecuta queries para diagnosticar el problema de avatar
 * Fecha: 16 de Enero 2025
 */

const { createClient } = require('@supabase/supabase-js');

// Usar variables de entorno directamente (asumiendo que se pasan al ejecutar)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('Necesitas: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('============================================================================');
console.log('AUDITORÍA EN VIVO - SINCRONIZACIÓN DE USUARIOS');
console.log('Fecha: 2025-01-16');
console.log('============================================================================\n');

async function runAudit() {
  try {
    // ========================================
    // 1. CONTEO DE REGISTROS
    // ========================================
    console.log('--- 1. CONTEO DE REGISTROS POR TABLA ---\n');

    const { count: authCount, error: authError } = await supabase
      .from('users') // auth.users via Supabase
      .select('*', { count: 'exact', head: true });

    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: userProfilesCount, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    console.log(`auth.users:        ${authError ? 'ERROR' : authCount ?? 'N/A'}`);
    console.log(`profiles:          ${profilesError ? 'ERROR' : profilesCount ?? 'N/A'}`);
    console.log(`users (custom):    ${usersError ? 'ERROR' : usersCount ?? 'N/A'}`);
    console.log(`user_profiles:     ${userProfilesError ? 'ERROR' : userProfilesCount ?? 'N/A'}\n`);

    // ========================================
    // 2. LISTAR TODOS LOS USUARIOS EN auth.users
    // ========================================
    console.log('--- 2. USUARIOS EN auth.users (vía Admin API) ---\n');

    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listando usuarios:', listError);
    } else {
      console.log(`Total usuarios en auth.users: ${authUsers.users.length}\n`);
      authUsers.users.forEach(user => {
        console.log(`ID:        ${user.id}`);
        console.log(`Email:     ${user.email}`);
        console.log(`Created:   ${user.created_at}`);
        console.log(`Metadata:  ${JSON.stringify(user.user_metadata)}`);
        console.log('---');
      });
    }

    // ========================================
    // 3. LISTAR USUARIOS EN profiles
    // ========================================
    console.log('\n--- 3. USUARIOS EN public.profiles ---\n');

    const { data: profiles, error: profilesFetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesFetchError) {
      console.error('❌ Error:', profilesFetchError);
    } else {
      console.log(`Total en profiles: ${profiles.length}\n`);
      profiles.forEach(p => {
        console.log(`ID:         ${p.id}`);
        console.log(`Full Name:  ${p.full_name}`);
        console.log(`Avatar URL: ${p.avatar_url}`);
        console.log(`Created:    ${p.created_at}`);
        console.log('---');
      });
    }

    // ========================================
    // 4. LISTAR USUARIOS EN users (custom table)
    // ========================================
    console.log('\n--- 4. USUARIOS EN public.users (custom table) ---\n');

    const { data: users, error: usersFetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersFetchError) {
      console.error('❌ Error:', usersFetchError);
    } else {
      console.log(`Total en users: ${users.length}\n`);
      users.forEach(u => {
        console.log(`ID:         ${u.id}`);
        console.log(`Name:       ${u.name}`);
        console.log(`Email:      ${u.email}`);
        console.log(`User Type:  ${u.user_type}`);
        console.log(`Avatar:     ${u.avatar || u.profile_image || 'N/A'}`);
        console.log(`Created:    ${u.created_at}`);
        console.log('---');
      });
    }

    // ========================================
    // 5. LISTAR user_profiles
    // ========================================
    console.log('\n--- 5. USUARIOS EN public.user_profiles (comunidad) ---\n');

    const { data: userProfiles, error: upFetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (upFetchError) {
      console.error('❌ Error:', upFetchError);
    } else {
      console.log(`Total en user_profiles: ${userProfiles.length}\n`);
      userProfiles.forEach(up => {
        console.log(`ID:      ${up.id}`);
        console.log(`User ID: ${up.userId || up.user_id}`);
        console.log(`Role:    ${up.role}`);
        console.log(`City:    ${up.city}`);
        console.log('---');
      });
    }

    // ========================================
    // 6. VERIFICAR USUARIO ESPECÍFICO
    // ========================================
    console.log('\n--- 6. VERIFICAR USER_ID ESPECÍFICO: 6403f9d2-e846-4c70-87e0-e051127d9500 ---\n');

    const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';

    // En auth.users
    const authUser = authUsers.users.find(u => u.id === userId);
    console.log(`En auth.users:       ${authUser ? '✓ EXISTE' : '✗ NO EXISTE'}`);
    if (authUser) {
      console.log(`  Email: ${authUser.email}`);
      console.log(`  Metadata: ${JSON.stringify(authUser.user_metadata)}`);
    }

    // En profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log(`En profiles:         ${profileData ? '✓ EXISTE' : '✗ NO EXISTE'}`);
    if (profileData) {
      console.log(`  Full Name: ${profileData.full_name}`);
      console.log(`  Avatar: ${profileData.avatar_url}`);
    }

    // En users
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log(`En users (custom):   ${userData ? '✓ EXISTE' : '✗ NO EXISTE'}`);
    if (userData) {
      console.log(`  Name: ${userData.name}`);
      console.log(`  Email: ${userData.email}`);
      console.log(`  User Type: ${userData.user_type}`);
    }

    // En user_profiles
    const { data: upData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();

    console.log(`En user_profiles:    ${upData ? '✓ EXISTE' : '✗ NO EXISTE'}`);
    if (upData) {
      console.log(`  Role: ${upData.role}`);
      console.log(`  City: ${upData.city}`);
    }

    // ========================================
    // 7. ANÁLISIS DE SINCRONIZACIÓN
    // ========================================
    console.log('\n--- 7. ANÁLISIS DE SINCRONIZACIÓN ---\n');

    // Encontrar usuarios huérfanos
    const authUserIds = authUsers.users.map(u => u.id);
    const customUserIds = users.map(u => u.id);

    const orphanUsers = authUserIds.filter(id => !customUserIds.includes(id));

    console.log(`Total en auth.users:     ${authUserIds.length}`);
    console.log(`Total en users (custom): ${customUserIds.length}`);
    console.log(`Usuarios HUÉRFANOS:      ${orphanUsers.length}\n`);

    if (orphanUsers.length > 0) {
      console.log('⚠️ USUARIOS HUÉRFANOS (en auth.users pero NO en users):');
      orphanUsers.forEach(id => {
        const user = authUsers.users.find(u => u.id === id);
        console.log(`  - ${id} (${user?.email})`);
      });
    } else {
      console.log('✓ No hay usuarios huérfanos - sincronización OK');
    }

    // ========================================
    // 8. RESUMEN EJECUTIVO
    // ========================================
    console.log('\n============================================================================');
    console.log('RESUMEN EJECUTIVO');
    console.log('============================================================================\n');

    const syncAuthProfiles = authUserIds.length === (profilesCount ?? 0);
    const syncAuthUsers = orphanUsers.length === 0;

    console.log(`Sincronización auth → profiles:  ${syncAuthProfiles ? '✓ OK' : '✗ DESINCRONIZADO'}`);
    console.log(`Sincronización auth → users:     ${syncAuthUsers ? '✓ OK' : '✗ DESINCRONIZADO'}`);

    if (!syncAuthUsers) {
      console.log(`\n⚠️ PROBLEMA DETECTADO: ${orphanUsers.length} usuario(s) en auth.users sin entrada en users`);
      console.log('   Esto causa el error 404 en el endpoint de avatar.\n');
    }

    console.log('\n============================================================================');
    console.log('AUDITORÍA COMPLETADA');
    console.log('============================================================================');

  } catch (error) {
    console.error('❌ Error ejecutando auditoría:', error);
    process.exit(1);
  }
}

runAudit();
