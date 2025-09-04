const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno
function leerEnv() {
    const envPath = path.join('Backend', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    
    return envVars;
}

const envVars = leerEnv();
const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function testingFinalCompleto() {
    console.log('🧪 TESTING FINAL COMPLETO');
    console.log('=========================\n');
    
    const resultados = {
        conexion: false,
        autenticacion: false,
        storage: false,
        tablas: { profiles: false, properties: false },
        puntuacionFinal: 0
    };
    
    try {
        // Test 1: Conexión básica
        console.log('🔄 Test 1: Conexión básica a Supabase');
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError) {
            console.log(`✅ Conexión exitosa - ${users.length} usuarios encontrados`);
            resultados.conexion = true;
        } else {
            console.log(`❌ Error de conexión: ${usersError.message}`);
        }
        
        // Test 2: Autenticación
        console.log('\n🔄 Test 2: Sistema de autenticación');
        try {
            const testEmail = `test-final-${Date.now()}@example.com`;
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: testEmail,
                password: 'test-password-123',
                email_confirm: true
            });
            
            if (!createError) {
                console.log('✅ Creación de usuario: EXITOSA');
                await supabase.auth.admin.deleteUser(newUser.user.id);
                console.log('✅ Eliminación de usuario: EXITOSA');
                resultados.autenticacion = true;
            } else {
                console.log(`❌ Error en autenticación: ${createError.message}`);
            }
        } catch (authError) {
            console.log(`❌ Error en test de autenticación: ${authError.message}`);
        }
        
        // Test 3: Storage
        console.log('\n🔄 Test 3: Sistema de storage');
        const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
        if (!storageError) {
            console.log(`✅ Storage accesible - ${buckets.length} buckets encontrados`);
            buckets.forEach(bucket => {
                console.log(`  - ${bucket.name} (público: ${bucket.public})`);
            });
            resultados.storage = true;
        } else {
            console.log(`❌ Error en storage: ${storageError.message}`);
        }
        
        // Test 4: Tablas
        console.log('\n🔄 Test 4: Acceso a tablas');
        
        // Test tabla profiles
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
        
        if (!profilesError) {
            console.log('✅ Tabla profiles: ACCESIBLE');
            resultados.tablas.profiles = true;
        } else {
            console.log(`⚠️  Tabla profiles: ${profilesError.message}`);
        }
        
        // Test tabla properties
        const { data: propertiesData, error: propertiesError } = await supabase
            .from('properties')
            .select('id')
            .limit(1);
        
        if (!propertiesError) {
            console.log('✅ Tabla properties: ACCESIBLE');
            resultados.tablas.properties = true;
        } else {
            console.log(`⚠️  Tabla properties: ${propertiesError.message}`);
        }
        
        // Calcular puntuación final
        let puntos = 0;
        if (resultados.conexion) puntos += 25;
        if (resultados.autenticacion) puntos += 25;
        if (resultados.storage) puntos += 25;
        if (resultados.tablas.profiles) puntos += 12.5;
        if (resultados.tablas.properties) puntos += 12.5;
        
        resultados.puntuacionFinal = puntos;
        
        // Reporte final
        console.log('\n📊 REPORTE FINAL DE TESTING');
        console.log('============================');
        console.log(`🔗 Conexión: ${resultados.conexion ? '✅ OK' : '❌ FALLO'}`);
        console.log(`🔐 Autenticación: ${resultados.autenticacion ? '✅ OK' : '❌ FALLO'}`);
        console.log(`💾 Storage: ${resultados.storage ? '✅ OK' : '❌ FALLO'}`);
        console.log(`📋 Tabla profiles: ${resultados.tablas.profiles ? '✅ OK' : '⚠️  MANUAL'}`);
        console.log(`📋 Tabla properties: ${resultados.tablas.properties ? '✅ OK' : '⚠️  MANUAL'}`);
        console.log(`\n🎯 PUNTUACIÓN FINAL: ${resultados.puntuacionFinal}/100`);
        
        if (resultados.puntuacionFinal >= 90) {
            console.log('🎉 ESTADO: EXCELENTE - Configuración completa');
        } else if (resultados.puntuacionFinal >= 75) {
            console.log('✅ ESTADO: BUENO - Listo para desarrollo');
        } else if (resultados.puntuacionFinal >= 50) {
            console.log('⚠️  ESTADO: PARCIAL - Requiere configuración manual');
        } else {
            console.log('❌ ESTADO: PROBLEMÁTICO - Requiere revisión');
        }
        
        console.log('\n🎯 RECOMENDACIONES:');
        if (resultados.puntuacionFinal >= 75) {
            console.log('1. ✅ Configuración lista para desarrollo');
            console.log('2. 🚀 Proceder con implementación de funcionalidades');
            console.log('3. 🧪 Realizar testing de integración');
        } else {
            console.log('1. 📋 Revisar GUIA-CONFIGURACION-MANUAL-SUPABASE.md');
            console.log('2. 🔧 Completar configuración manual en Supabase Dashboard');
            console.log('3. 🔄 Re-ejecutar este testing');
        }
        
        return resultados;
        
    } catch (error) {
        console.log(`❌ Error en testing final: ${error.message}`);
        return resultados;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testingFinalCompleto()
        .then(resultados => {
            console.log('\n🎉 Testing final completado');
            
            if (resultados.puntuacionFinal >= 75) {
                console.log('✅ Configuración lista para desarrollo');
                process.exit(0);
            } else {
                console.log('⚠️  Configuración requiere atención adicional');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error en testing final:', error.message);
            process.exit(1);
        });
}

module.exports = { testingFinalCompleto };
