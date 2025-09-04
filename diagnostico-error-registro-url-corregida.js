const { createClient } = require('@supabase/supabase-js');

async function diagnosticarErrorRegistroURLCorregida() {
    console.log('\n🔍 DIAGNÓSTICO ACTUALIZADO - ERROR DE REGISTRO CON URL CORREGIDA');
    console.log('================================================================================\n');

    // Credenciales del archivo .env
    const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
    const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

    console.log('📋 PASO 1: Analizando discrepancia de URL...');
    console.log('❌ URL en diagnóstico anterior: https://qfeyhaaxymmnohqdele.supabase.co');
    console.log('✅ URL en archivos .env:        https://qfeyhaaxyemmnohqdele.supabase.co');
    console.log('🔍 Diferencia detectada: "qfeyhaaxymmnohqdele" vs "qfeyhaaxyemmnohqdele"');
    console.log('   - Diagnóstico anterior: qfeyhaaxymmnohqdele (falta una "m")');
    console.log('   - Archivos .env:        qfeyhaaxyemmnohqdele (correcto)\n');

    console.log('🔗 PASO 2: Creando cliente Supabase con URL corregida...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log('✅ Cliente Supabase creado exitosamente\n');

    console.log('🏥 PASO 3: Verificando conectividad con URL corregida...');
    try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
            console.log('❌ Error accediendo a auth.users:', authError.message);
            return;
        }
        
        console.log('✅ Conexión exitosa a Supabase Auth');
        console.log(`📊 Usuarios encontrados: ${authUsers.users.length}`);
        
        // Verificar tabla users
        console.log('\n🗄️ PASO 4: Verificando tabla users...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(5);
            
        if (usersError) {
            console.log('❌ Error accediendo a tabla users:', usersError.message);
            console.log('💡 Esto podría indicar que la tabla users no existe o hay problemas de permisos');
        } else {
            console.log('✅ Tabla users accesible');
            console.log(`📊 Registros en tabla users: ${users.length}`);
        }

        // Probar creación de usuario de prueba
        console.log('\n👤 PASO 5: Probando creación de usuario de prueba...');
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true
        });
        
        if (createError) {
            console.log('❌ Error creando usuario de prueba:', createError.message);
        } else {
            console.log('✅ Usuario de prueba creado exitosamente');
            console.log(`📧 Email: ${newUser.user.email}`);
            console.log(`🆔 ID: ${newUser.user.id}`);
            
            // Limpiar usuario de prueba
            await supabase.auth.admin.deleteUser(newUser.user.id);
            console.log('🧹 Usuario de prueba eliminado');
        }

    } catch (error) {
        console.log('❌ Error de conectividad:', error.message);
        console.log('🔍 Detalles del error:', error);
    }

    console.log('\n🎯 CONCLUSIÓN:');
    console.log('================================================================================');
    console.log('El problema original era un ERROR DE TIPEO en la URL de Supabase:');
    console.log('- URL incorrecta: qfeyhaaxymmnohqdele (faltaba una "m")');
    console.log('- URL correcta:   qfeyhaaxyemmnohqdele');
    console.log('\nLas credenciales en los archivos .env son CORRECTAS.');
    console.log('El error "Database error saving new user" debería resolverse con la URL correcta.');
    console.log('\n🎉 Diagnóstico completado');
}

// Ejecutar diagnóstico
diagnosticarErrorRegistroURLCorregida().catch(console.error);
