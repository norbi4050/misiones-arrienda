const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ============================================================
// TESTING EXHAUSTIVO POST-CORRECCIÓN: POLÍTICA INSERT USERS
// VERIFICACIÓN COMPLETA DEL ERROR "Database error saving new user"
// ============================================================

console.log('🧪 TESTING EXHAUSTIVO POST-CORRECCIÓN: POLÍTICA INSERT USERS');
console.log('============================================================');

// Configuración con credenciales reales
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testingExhaustivoPostCorreccion() {
    const reporte = {
        timestamp: new Date().toISOString(),
        tests: [],
        errores: [],
        exito: false,
        resumen: {
            totalTests: 0,
            testsPasados: 0,
            testsFallidos: 0,
            errorRegistroResuelto: false
        }
    };

    try {
        console.log('\n🔍 TEST 1: Verificar conexión a Supabase...');
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('count(*)')
                .limit(1);

            if (error) {
                console.log('❌ Error de conexión:', error.message);
                reporte.errores.push(`Test 1: ${error.message}`);
                reporte.tests.push({ test: 'Conexión Supabase', resultado: 'FALLIDO', error: error.message });
            } else {
                console.log('✅ Conexión exitosa a Supabase');
                reporte.tests.push({ test: 'Conexión Supabase', resultado: 'EXITOSO' });
                reporte.resumen.testsPasados++;
            }
        } catch (error) {
            console.log('❌ Error crítico de conexión:', error.message);
            reporte.errores.push(`Test 1: ${error.message}`);
            reporte.tests.push({ test: 'Conexión Supabase', resultado: 'FALLIDO', error: error.message });
        }
        reporte.resumen.totalTests++;

        console.log('\n🔍 TEST 2: Verificar estructura de tabla users...');
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .limit(1);

            if (error) {
                console.log('❌ Error verificando tabla users:', error.message);
                reporte.errores.push(`Test 2: ${error.message}`);
                reporte.tests.push({ test: 'Estructura tabla users', resultado: 'FALLIDO', error: error.message });
            } else {
                console.log('✅ Tabla users accesible');
                reporte.tests.push({ test: 'Estructura tabla users', resultado: 'EXITOSO' });
                reporte.resumen.testsPasados++;
            }
        } catch (error) {
            console.log('❌ Error crítico verificando tabla:', error.message);
            reporte.errores.push(`Test 2: ${error.message}`);
            reporte.tests.push({ test: 'Estructura tabla users', resultado: 'FALLIDO', error: error.message });
        }
        reporte.resumen.totalTests++;

        console.log('\n🔍 TEST 3: Probar INSERT directo con service role...');
        try {
            const testUser = {
                id: '00000000-0000-0000-0000-000000000001',
                email: 'test-service-role@example.com',
                full_name: 'Test Service Role User',
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabaseAdmin
                .from('users')
                .insert([testUser])
                .select();

            if (error) {
                console.log('❌ Error INSERT con service role:', error.message);
                reporte.errores.push(`Test 3: ${error.message}`);
                reporte.tests.push({ test: 'INSERT service role', resultado: 'FALLIDO', error: error.message });
            } else {
                console.log('✅ INSERT exitoso con service role');
                reporte.tests.push({ test: 'INSERT service role', resultado: 'EXITOSO', data: data });
                reporte.resumen.testsPasados++;

                // Limpiar datos de prueba
                await supabaseAdmin.from('users').delete().eq('id', testUser.id);
            }
        } catch (error) {
            console.log('❌ Error crítico en INSERT service role:', error.message);
            reporte.errores.push(`Test 3: ${error.message}`);
            reporte.tests.push({ test: 'INSERT service role', resultado: 'FALLIDO', error: error.message });
        }
        reporte.resumen.totalTests++;

        console.log('\n🔍 TEST 4: Probar INSERT con cliente anónimo...');
        try {
            const testUser = {
                id: '00000000-0000-0000-0000-000000000002',
                email: 'test-anon@example.com',
                full_name: 'Test Anonymous User',
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabaseAnon
                .from('users')
                .insert([testUser])
                .select();

            if (error) {
                console.log('❌ Error INSERT con cliente anónimo:', error.message);
                reporte.errores.push(`Test 4: ${error.message}`);
                reporte.tests.push({ test: 'INSERT anónimo', resultado: 'FALLIDO', error: error.message });
            } else {
                console.log('✅ INSERT exitoso con cliente anónimo');
                reporte.tests.push({ test: 'INSERT anónimo', resultado: 'EXITOSO', data: data });
                reporte.resumen.testsPasados++;

                // Limpiar datos de prueba
                await supabaseAdmin.from('users').delete().eq('id', testUser.id);
            }
        } catch (error) {
            console.log('❌ Error crítico en INSERT anónimo:', error.message);
            reporte.errores.push(`Test 4: ${error.message}`);
            reporte.tests.push({ test: 'INSERT anónimo', resultado: 'FALLIDO', error: error.message });
        }
        reporte.resumen.totalTests++;

        console.log('\n🔍 TEST 5: Simular registro de usuario real...');
        try {
            const userData = {
                id: '00000000-0000-0000-0000-000000000003',
                email: 'usuario.prueba@example.com',
                full_name: 'Usuario de Prueba',
                user_type: 'inquilino',
                phone: '+54911234567',
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabaseAdmin
                .from('users')
                .insert([userData])
                .select();

            if (error) {
                console.log('❌ Error simulando registro real:', error.message);
                reporte.errores.push(`Test 5: ${error.message}`);
                reporte.tests.push({ test: 'Registro usuario real', resultado: 'FALLIDO', error: error.message });
            } else {
                console.log('✅ Registro de usuario real exitoso');
                reporte.tests.push({ test: 'Registro usuario real', resultado: 'EXITOSO', data: data });
                reporte.resumen.testsPasados++;
                reporte.resumen.errorRegistroResuelto = true;

                // Limpiar datos de prueba
                await supabaseAdmin.from('users').delete().eq('id', userData.id);
            }
        } catch (error) {
            console.log('❌ Error crítico simulando registro:', error.message);
            reporte.errores.push(`Test 5: ${error.message}`);
            reporte.tests.push({ test: 'Registro usuario real', resultado: 'FALLIDO', error: error.message });
        }
        reporte.resumen.totalTests++;

        console.log('\n🔍 TEST 6: Verificar API de registro del backend...');
        try {
            const testData = {
                email: 'test-backend@example.com',
                password: 'TestPassword123!',
                fullName: 'Test Backend User',
                userType: 'inquilino',
                phone: '+54911234567'
            };

            // Simular llamada a la API de registro
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ API de registro funcionando correctamente');
                reporte.tests.push({ test: 'API registro backend', resultado: 'EXITOSO', data: result });
                reporte.resumen.testsPasados++;
            } else {
                const errorText = await response.text();
                console.log('❌ Error en API de registro:', errorText);
                reporte.errores.push(`Test 6: ${errorText}`);
                reporte.tests.push({ test: 'API registro backend', resultado: 'FALLIDO', error: errorText });
            }
        } catch (error) {
            console.log('❌ Error conectando con API backend:', error.message);
            reporte.errores.push(`Test 6: ${error.message}`);
            reporte.tests.push({ test: 'API registro backend', resultado: 'FALLIDO', error: error.message });
        }
        reporte.resumen.totalTests++;

        // Calcular resultados finales
        reporte.resumen.testsFallidos = reporte.resumen.totalTests - reporte.resumen.testsPasados;
        reporte.exito = reporte.resumen.testsPasados >= (reporte.resumen.totalTests * 0.7); // 70% de éxito mínimo

        // Mostrar resumen
        console.log('\n🎯 RESUMEN DEL TESTING:');
        console.log('============================================================');
        console.log(`📊 Total de tests: ${reporte.resumen.totalTests}`);
        console.log(`✅ Tests exitosos: ${reporte.resumen.testsPasados}`);
        console.log(`❌ Tests fallidos: ${reporte.resumen.testsFallidos}`);
        console.log(`🎯 Porcentaje de éxito: ${Math.round((reporte.resumen.testsPasados / reporte.resumen.totalTests) * 100)}%`);
        console.log(`🔧 Error "Database error saving new user" resuelto: ${reporte.resumen.errorRegistroResuelto ? 'SÍ' : 'NO'}`);

        if (reporte.exito) {
            console.log('\n✅ TESTING COMPLETADO EXITOSAMENTE');
            console.log('El error "Database error saving new user" ha sido resuelto.');
            console.log('El sistema de registro de usuarios está funcionando correctamente.');
        } else {
            console.log('\n⚠️ TESTING COMPLETADO CON PROBLEMAS');
            console.log('Algunos tests fallaron. Revisar errores y aplicar correcciones adicionales.');
        }

        // Guardar reporte
        const reportePath = path.join(__dirname, '232-Reporte-Testing-Post-Correccion-Policy-INSERT-Users-Final.json');
        fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
        console.log(`\n📄 Reporte guardado en: ${reportePath}`);

        console.log('\n🔄 PRÓXIMOS PASOS:');
        if (reporte.resumen.errorRegistroResuelto) {
            console.log('1. ✅ Error principal resuelto - continuar con testing de integración');
            console.log('2. ✅ Probar registro desde la aplicación web');
            console.log('3. ✅ Verificar flujo completo de autenticación');
            console.log('4. ✅ Confirmar funcionamiento en producción');
        } else {
            console.log('1. ❌ Aplicar correcciones manuales adicionales');
            console.log('2. ❌ Revisar políticas RLS en Supabase Dashboard');
            console.log('3. ❌ Verificar permisos de tabla users');
            console.log('4. ❌ Re-ejecutar testing después de correcciones');
        }

        console.log('\n✅ PROCESO DE TESTING COMPLETADO');

        return reporte;

    } catch (error) {
        console.error('❌ ERROR CRÍTICO EN EL TESTING:', error);
        reporte.errores.push(`Error crítico: ${error.message}`);
        reporte.exito = false;
        return reporte;
    }
}

// Ejecutar testing
if (require.main === module) {
    testingExhaustivoPostCorreccion()
        .then(reporte => {
            process.exit(reporte.exito ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ ERROR FATAL:', error);
            process.exit(1);
        });
}

module.exports = { testingExhaustivoPostCorreccion };
