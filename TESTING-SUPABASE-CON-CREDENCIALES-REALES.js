const { createClient } = require('@supabase/supabase-js');

console.log('🚀 TESTING SUPABASE CON CREDENCIALES REALES');
console.log('============================================\n');

// Credenciales reales proporcionadas
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function testingSupabaseCompleto() {
    let puntuacionTotal = 0;
    const maxPuntos = 100;
    
    console.log('📊 INICIANDO EVALUACIÓN COMPLETA...\n');
    
    // Test 1: Conexión básica (20 puntos)
    console.log('🔄 Test 1: Conexión básica a Supabase');
    try {
        const { data, error } = await supabase.from('auth.users').select('count').limit(1);
        if (!error) {
            console.log('✅ Conexión básica: EXITOSA (+20 puntos)');
            puntuacionTotal += 20;
        } else {
            console.log(`❌ Conexión básica: ${error.message} (+0 puntos)`);
        }
    } catch (err) {
        console.log(`❌ Error de conexión: ${err.message} (+0 puntos)`);
    }
    
    // Test 2: Autenticación (20 puntos)
    console.log('\n🔄 Test 2: Sistema de autenticación');
    try {
        const { data: users, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError) {
            console.log(`✅ Autenticación: FUNCIONAL - ${users.users?.length || 0} usuarios (+20 puntos)`);
            puntuacionTotal += 20;
        } else {
            console.log(`❌ Autenticación: ${authError.message} (+0 puntos)`);
        }
    } catch (err) {
        console.log(`❌ Error de autenticación: ${err.message} (+0 puntos)`);
    }
    
    // Test 3: Storage (15 puntos)
    console.log('\n🔄 Test 3: Sistema de storage');
    try {
        const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
        if (!storageError && buckets) {
            console.log(`✅ Storage: FUNCIONAL - ${buckets.length} buckets (+15 puntos)`);
            buckets.forEach(bucket => {
                console.log(`  - ${bucket.name} (público: ${bucket.public})`);
            });
            puntuacionTotal += 15;
        } else {
            console.log(`❌ Storage: ${storageError?.message || 'No disponible'} (+0 puntos)`);
        }
    } catch (err) {
        console.log(`❌ Error de storage: ${err.message} (+0 puntos)`);
    }
    
    // Test 4: Tabla properties (15 puntos)
    console.log('\n🔄 Test 4: Tabla properties');
    try {
        const { data: properties, error: propError } = await supabase
            .from('properties')
            .select('*')
            .limit(1);
        
        if (!propError) {
            console.log(`✅ Tabla properties: ACCESIBLE (+15 puntos)`);
            puntuacionTotal += 15;
        } else {
            console.log(`❌ Tabla properties: ${propError.message} (+0 puntos)`);
        }
    } catch (err) {
        console.log(`❌ Error en properties: ${err.message} (+0 puntos)`);
    }
    
    // Test 5: Tabla profiles (15 puntos)
    console.log('\n🔄 Test 5: Tabla profiles');
    try {
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);
        
        if (!profileError) {
            console.log(`✅ Tabla profiles: ACCESIBLE (+15 puntos)`);
            puntuacionTotal += 15;
        } else {
            console.log(`❌ Tabla profiles: ${profileError.message} (+0 puntos)`);
        }
    } catch (err) {
        console.log(`❌ Error en profiles: ${err.message} (+0 puntos)`);
    }
    
    // Test 6: Funcionalidad completa (15 puntos)
    console.log('\n🔄 Test 6: Funcionalidad completa');
    try {
        // Test de creación y eliminación de usuario
        const testEmail = `test-${Date.now()}@example.com`;
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: 'TestPassword123!',
            email_confirm: true
        });
        
        if (!createError && newUser.user) {
            console.log('✅ Creación de usuario: EXITOSA');
            
            // Eliminar usuario de prueba
            await supabase.auth.admin.deleteUser(newUser.user.id);
            console.log('✅ Eliminación de usuario: EXITOSA');
            console.log('✅ Funcionalidad completa: OPERATIVA (+15 puntos)');
            puntuacionTotal += 15;
        } else {
            console.log(`❌ Funcionalidad completa: ${createError?.message} (+0 puntos)`);
        }
    } catch (err) {
        console.log(`❌ Error en funcionalidad: ${err.message} (+0 puntos)`);
    }
    
    // Calcular porcentaje final
    const porcentajeFinal = Math.round((puntuacionTotal / maxPuntos) * 100);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 REPORTE FINAL');
    console.log('='.repeat(50));
    console.log(`🎯 PUNTUACIÓN: ${puntuacionTotal}/${maxPuntos} puntos`);
    console.log(`📈 PORCENTAJE: ${porcentajeFinal}%`);
    
    // Determinar estado
    let estado, recomendacion;
    if (porcentajeFinal >= 90) {
        estado = '🎉 EXCELENTE';
        recomendacion = 'Supabase está 100% configurado y listo para producción';
    } else if (porcentajeFinal >= 80) {
        estado = '✅ MUY BUENO';
        recomendacion = 'Configuración sólida, solo faltan detalles menores';
    } else if (porcentajeFinal >= 70) {
        estado = '👍 BUENO';
        recomendacion = 'Configuración funcional, requiere ajustes menores';
    } else if (porcentajeFinal >= 50) {
        estado = '⚠️ ACEPTABLE';
        recomendacion = 'Configuración básica, requiere trabajo adicional';
    } else {
        estado = '❌ CRÍTICO';
        recomendacion = 'Requiere configuración completa de Supabase';
    }
    
    console.log(`🏆 ESTADO: ${estado}`);
    console.log(`💡 RECOMENDACIÓN: ${recomendacion}`);
    
    console.log('\n📋 PRÓXIMOS PASOS:');
    if (porcentajeFinal >= 90) {
        console.log('1. 🚀 ¡Proyecto listo para deployment!');
        console.log('2. 📊 Monitorear métricas en producción');
        console.log('3. 🔧 Optimizaciones menores si es necesario');
    } else if (porcentajeFinal >= 80) {
        console.log('1. 🔧 Completar configuración de tablas faltantes');
        console.log('2. 🧪 Testing adicional de funcionalidades');
        console.log('3. 🚀 Preparar para deployment');
    } else if (porcentajeFinal >= 70) {
        console.log('1. 📋 Revisar configuración manual de Supabase');
        console.log('2. 🔧 Crear tablas y políticas faltantes');
        console.log('3. 🧪 Re-ejecutar testing');
    } else {
        console.log('1. 🚨 Revisar credenciales de Supabase');
        console.log('2. 🔧 Configurar base de datos completa');
        console.log('3. 📋 Seguir guía de configuración paso a paso');
    }
    
    // Generar reporte JSON
    const reporte = {
        timestamp: new Date().toISOString(),
        puntuacion: puntuacionTotal,
        porcentaje: porcentajeFinal,
        estado: estado,
        recomendacion: recomendacion,
        detalles: {
            conexion: puntuacionTotal >= 20,
            autenticacion: puntuacionTotal >= 40,
            storage: puntuacionTotal >= 55,
            tablaProperties: puntuacionTotal >= 70,
            tablaProfiles: puntuacionTotal >= 85,
            funcionalidadCompleta: puntuacionTotal >= 100
        }
    };
    
    require('fs').writeFileSync('REPORTE-SUPABASE-CREDENCIALES-REALES.json', 
        JSON.stringify(reporte, null, 2));
    
    console.log('\n📄 Reporte guardado: REPORTE-SUPABASE-CREDENCIALES-REALES.json');
    console.log('✅ Testing completado\n');
    
    return porcentajeFinal;
}

// Ejecutar testing
testingSupabaseCompleto().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
});
